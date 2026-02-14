#from django.shortcuts import render

# Create your views here.
# finance/views.py

from django.db import models
from rest_framework import viewsets, status, filters, permissions, serializers
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.utils import timezone
import random
import string

from .models import Account, JournalEntry, Budget, Contact, Invoice, Payment, JournalLine, BankStatement, BankStatementLine, PurchaseRequest
from .serializers import (
    AccountSerializer, JournalEntrySerializer, BudgetSerializer,
    ContactSerializer, InvoiceSerializer, InvoiceCreateSerializer, PaymentSerializer,
    BankStatementSerializer, BankStatementLineSerializer, PurchaseRequestSerializer
)
from .permissions import IsFinanceOrAdmin

# ✅ Import PayrollRun safely for finance summary
from hr.models import PayrollRun, Employee, Department


# Helper to ensure an Employee exists and is linked to a Django user
# Used to auto-provision minimal employee profiles for request flows.
def ensure_employee_for_user(user):
    try:
        return user.employee_profile
    except Exception:
        pass

    # Try locate by email and link
    if getattr(user, 'email', None):
        try:
            emp = Employee.objects.get(email=user.email)
            if emp.user is None:
                emp.user = user
                emp.save()
            return emp
        except Employee.DoesNotExist:
            pass

    # Auto-provision minimal Employee record (Intern to relax statutory fields)
    first = user.first_name or 'First'
    last = user.last_name or 'Last'
    email = user.email or f'user{user.id}@example.local'

    # Unique staff_number generation
    base = f'EMP-{user.id}-{random.randint(1000, 9999)}'
    staff_number = base
    while Employee.objects.filter(staff_number=staff_number).exists():
        staff_number = f'{base}{random.randint(0,9)}'

    national_id = f'NID{user.id}{random.randint(1000, 9999)}'

    emp = Employee.objects.create(
        staff_number=staff_number,
        first_name=first,
        last_name=last,
        email=email,
        phone='',
        national_id=national_id,
        user=user,
        department=None,
        job_title='Staff',
        employment_type='INTERN',
        hire_date=timezone.now().date(),
        end_date=None,
        basic_salary=0,
        kra_pin='',
        nssf_number='',
        SHA_number='',
        status='ACTIVE',
    )
    return emp

# =====================================================
# ACCOUNT VIEWSET
# =====================================================
class AccountViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD for Finance Accounts.
    Restricted to Finance and Admin roles only.
    """
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['code', 'name', 'balance']
    ordering = ['code']

    def perform_create(self, serializer):
        # Automatically track who created the account
        serializer.save(created_by=self.request.user.username)

    @action(detail=True, methods=['get'])
    def balance(self, request, pk=None):
        """Return the current balance of an account"""
        account = self.get_object()
        return Response({'account': account.name, 'balance': str(account.balance)})


# =====================================================
# JOURNAL ENTRY VIEWSET
# =====================================================
class JournalEntryViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD for Journal Entries.
    Restricted to Finance and Admin roles.
    """
    queryset = JournalEntry.objects.all().prefetch_related('lines', 'created_by_user')
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'description', 'lines__account__name']
    ordering_fields = ['date', 'reference', 'total_debit', 'total_credit']
    ordering = ['-date']

    def perform_create(self, serializer):
        """Auto-assign the creator and enforce finance-only"""
        serializer.save(created_by=self.request.user.username)

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of posted journal entries"""
        journal = self.get_object()
        if journal.status == 'POSTED':
            return Response({'error': 'Cannot delete a posted journal entry'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def post(self, request, pk=None):
        """Mark the journal entry as posted (finalized)"""
        journal = self.get_object()

        if journal.status == 'POSTED':
            return Response({'error': 'Journal entry already posted'}, status=status.HTTP_400_BAD_REQUEST)

        journal.status = 'POSTED'
        journal.posted_by = request.user.username
        journal.save()

        return Response({'message': f'Journal entry {journal.reference} posted successfully'})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return a financial summary by account"""
        entries = self.get_queryset()
        data = (
            entries.values('lines__account__name')
            .annotate(
                total_debit_sum=models.Sum('lines__debit'),
                total_credit_sum=models.Sum('lines__credit')
            )
            .order_by('lines__account__name')
        )
        return Response(data)


# =====================================================
# FINANCE DASHBOARD SUMMARY ENDPOINT
# =====================================================
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def finance_summary(request):
    """
    Aggregated summary endpoint for Finance Dashboard.
    Returns total accounts, balance, journal entries, and payroll runs.
    """
    total_accounts = Account.objects.count()
    total_balance = sum(a.balance or 0 for a in Account.objects.all())
    total_journals = JournalEntry.objects.count()
    total_payrolls = PayrollRun.objects.count()

    return Response({
        "totalAccounts": total_accounts,
        "totalBalance": total_balance,
        "totalJournalEntries": total_journals,
        "totalPayrollRuns": total_payrolls,
    })


# =====================================================
# BUDGET VIEWSET
# =====================================================
class BudgetViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD for Department Budgets.
    """
    queryset = Budget.objects.all().select_related('department')
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'department__name']
    ordering_fields = ['amount', 'spent_amount', 'end_date']
    ordering = ['-end_date']

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        budget = self.get_object()
        if budget.status != 'PENDING':
             return Response({'error': 'Budget is not pending approval'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify user has permission (e.g. Finance Admin)
        if hasattr(request.user, 'employee_profile'):
             budget.approved_by = request.user.employee_profile
        
        budget.status = 'APPROVED'
        budget.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        budget = self.get_object()
        if budget.status != 'PENDING':
             return Response({'error': 'Budget is not pending approval'}, status=status.HTTP_400_BAD_REQUEST)
        
        budget.status = 'REJECTED'
        budget.save()
        return Response({'status': 'rejected'})


# =====================================================
# CONTACT VIEWSET
# =====================================================
class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'phone', 'tax_id']
    ordering_fields = ['name']
    ordering = ['name']


# =====================================================
# INVOICE VIEWSET
# =====================================================
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().prefetch_related('items', 'contact')
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'status', 'contact']
    ordering_fields = ['date', 'due_date', 'total_amount']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    @action(detail=True, methods=['post'])
    def post(self, request, pk=None):
        """
        Finalize a Draft Invoice/Bill and create Journal Entries.
        - Invoice (Customer): Credit Income, Debit Accounts Receivable.
        - Bill (Vendor): Debit Expense, Credit Accounts Payable.
        """
        invoice = self.get_object()
        
        if invoice.status != 'DRAFT':
            return Response({'error': 'Only draft invoices can be posted'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 1. Fetch GL Accounts
            ar_account = Account.objects.get(code='1200') # Accounts Receivable
            ap_account = Account.objects.get(code='2100') # Accounts Payable
            
            # Default fallback for sales/purchases if not specified in items? 
            # Ideally items specify accounts.
            
            # 2. Create Journal Entry
            description = f"{invoice.get_type_display()} #{invoice.reference}"
            je = JournalEntry.objects.create(
                date=invoice.date,
                description=description,
                reference=invoice.reference,
            )
            
            total = invoice.total_amount
            
            if invoice.type == 'INVOICE': # Sales
                # Debit AR (Asset increases)
                JournalLine.objects.create(entry=je, account=ar_account, debit=total, credit=0, description="Accounts Receivable")
                
                # Credit Income (Revenue increases) - Per item
                for item in invoice.items.all():
                    JournalLine.objects.create(entry=je, account=item.account, debit=0, credit=item.amount, description=item.description)
                    
            elif invoice.type == 'BILL': # Purchases
                # Credit AP (Liability increases)
                JournalLine.objects.create(entry=je, account=ap_account, debit=0, credit=total, description="Accounts Payable")
                
                # Debit Expense (Expense increases) - Per item
                for item in invoice.items.all():
                    JournalLine.objects.create(entry=je, account=item.account, debit=item.amount, credit=0, description=item.description)

            invoice.status = 'POSTED'
            invoice.journal_entry = je
            invoice.amount_due = total # Full amount due initially
            invoice.save()
            
            return Response({'message': 'Invoice posted successfully', 'journal_entry': je.id})
            
        except Account.DoesNotExist:
             return Response({'error': 'System accounts (AR/AP) not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def register_payment(self, request, pk=None):
        """
        Register a payment for an invoice.
        Creates a Payment record and a Journal Entry.
        """
        invoice = self.get_object()
        amount = request.data.get('amount')
        method = request.data.get('method', 'BANK')
        reference = request.data.get('reference')

        if not amount:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        amount = float(amount)
        if amount > invoice.amount_due:
             return Response({'error': 'Payment amount exceeds amount due'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Fetch GL Accounts
            bank_account = Account.objects.get(code='1120') # Bank
            ar_account = Account.objects.get(code='1200') # Accounts Receivable
            ap_account = Account.objects.get(code='2100') # Accounts Payable

            # 2. Create Payment Record
            payment = Payment.objects.create(
                invoice=invoice,
                amount=amount,
                method=method,
                reference=reference,
                date=timezone.now().date()
            )
            
            # 3. Create Journal Entry
            description = f"Payment for {invoice.reference}"
            je = JournalEntry.objects.create(
                date=payment.date,
                description=description,
                reference=reference or f"PAY-{payment.id}"
            )
            
            if invoice.type == 'INVOICE': # Payment Received (Customer pays us)
                # Debit Bank (Asset increases)
                JournalLine.objects.create(entry=je, account=bank_account, debit=amount, credit=0, description="Payment Received")
                # Credit AR (Asset decreases)
                JournalLine.objects.create(entry=je, account=ar_account, debit=0, credit=amount, description="Clear AR")
                
            elif invoice.type == 'BILL': # Payment Made (We pay vendor)
                # Debit AP (Liability decreases)
                JournalLine.objects.create(entry=je, account=ap_account, debit=amount, credit=0, description="Clear AP")
                # Credit Bank (Asset decreases)
                JournalLine.objects.create(entry=je, account=bank_account, debit=0, credit=amount, description="Payment Made")

            payment.journal_entry = je
            payment.save()
            
            # Update Invoice Status
            invoice.calculate_totals() 
            
            return Response({'message': 'Payment registered successfully'})
            
        except Account.DoesNotExist:
             return Response({'error': 'System accounts (Bank/AR/AP) not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =====================================================
# BANK RECONCILIATION VIEWSETS
# =====================================================
class BankStatementViewSet(viewsets.ModelViewSet):
    queryset = BankStatement.objects.all().order_by('-statement_date')
    serializer_class = BankStatementSerializer
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['account', 'status']


class BankStatementLineViewSet(viewsets.ModelViewSet):
    queryset = BankStatementLine.objects.all()
    serializer_class = BankStatementLineSerializer
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['statement', 'is_reconciled']

    @action(detail=True, methods=['post'])
    def match(self, request, pk=None):
        """
        Match a bank statement line to a Journal Entry.
        Body: { "journal_entry_id": 123 }
        """
        line = self.get_object()
        je_id = request.data.get('journal_entry_id')
        
        if not je_id:
            return Response({'error': 'journal_entry_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            je = JournalEntry.objects.get(id=je_id)
            
            # Basic validation: amounts should match (approximately?)
            # For exact match:
            # Check if total debit or credit of JE matches line amount magnitude
            # This logic can be refined. For now, we trust the user.
            
            line.matched_journal_entry = je
            line.is_reconciled = True
            line.save()
            
            return Response({'status': 'matched'})
        except JournalEntry.DoesNotExist:
             return Response({'error': 'Journal Entry not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def unmatch(self, request, pk=None):
        """Unmatch a bank line from its journal entry"""
        line = self.get_object()
        line.matched_journal_entry = None
        line.is_reconciled = False
        line.save()
        return Response({'status': 'unmatched'})



# =====================================================
# PURCHASE REQUEST VIEWSET
# =====================================================
class PurchaseRequestViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequest.objects.all().select_related('requester', 'department', 'budget', 'approved_by')
    serializer_class = PurchaseRequestSerializer
    permission_classes = [permissions.IsAuthenticated] # Basic auth, specific roles handled in methods potentially
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'department', 'requester']
    search_fields = ['description', 'requester__first_name']

    def perform_create(self, serializer):
        # Auto-link or auto-provision requester Employee profile
        user = self.request.user
        employee = getattr(user, 'employee_profile', None)
        if not employee:
            employee = ensure_employee_for_user(user)
        if not employee:
            raise serializers.ValidationError({"requester": "User must be linked to an Employee profile to submit requests."})
        serializer.save(requester=employee)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        pr = self.get_object()
        if pr.status != 'PENDING':
             return Response({'error': 'Request is not pending approval'}, status=status.HTTP_400_BAD_REQUEST)

        # Check budget availability if linked
        if pr.budget and pr.budget.remaining_amount < pr.estimated_cost:
             return Response({'error': 'Insufficient budget funds'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(request.user, 'employee_profile'):
             pr.approved_by = request.user.employee_profile
        
        pr.status = 'APPROVED'
        
        # Update budget spent amount if strictly reserving now? 
        # Or wait for actual Order/Invoice? 
        # Let's reserve/encumber funds (simplified: update spent)
        if pr.budget:
            pr.budget.spent_amount += pr.estimated_cost
            pr.budget.save()
            
        pr.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        pr = self.get_object()
        if pr.status != 'PENDING':
             return Response({'error': 'Request is not pending approval'}, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '')
        pr.rejection_reason = reason
        pr.status = 'REJECTED'
        pr.save()
        return Response({'status': 'rejected'})
