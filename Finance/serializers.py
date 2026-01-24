from rest_framework import serializers
from .models import Account, JournalEntry, JournalLine, Budget, Contact, Invoice, InvoiceItem, Payment, BankStatement, BankStatementLine, PurchaseRequest


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'


class JournalLineSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = JournalLine
        fields = ['id', 'account', 'account_name', 'debit', 'credit', 'description']


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalLineSerializer(many=True)

    class Meta:
        model = JournalEntry
        fields = ['id', 'date', 'description', 'reference', 'lines']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines')
        entry = JournalEntry.objects.create(**validated_data)

        total_debit = total_credit = 0
        for line_data in lines_data:
            JournalLine.objects.create(entry=entry, **line_data)
            total_debit += line_data['debit']
            total_credit += line_data['credit']

        if total_debit != total_credit:
            raise serializers.ValidationError("Journal entry is not balanced (Debit != Credit).")

        return entry


class BudgetSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    utilization = serializers.FloatField(read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'name', 'department', 'department_name',
            'amount', 'spent_amount', 'remaining_amount', 'utilization',
            'start_date', 'end_date', 'description', 'is_active',
            'status', 'approved_by'
        ]


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'


class InvoiceItemSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    
    class Meta:
        model = InvoiceItem
        fields = ['id', 'invoice', 'description', 'account', 'account_name', 'quantity', 'unit_price', 'amount']
        read_only_fields = ['amount', 'invoice']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['journal_entry', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'contact', 'contact_name', 'type', 'reference', 
            'date', 'due_date', 'status', 'status_display',
            'total_amount', 'amount_due', 'journal_entry', 'created_at', 'items'
        ]
        read_only_fields = ['total_amount', 'amount_due', 'journal_entry', 'created_at', 'status']


class InvoiceCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(
        child=serializers.DictField(), write_only=True
    )

    class Meta:
        model = Invoice
        fields = [
            'contact', 'type', 'reference', 'date', 'due_date', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        
        invoice.calculate_totals()
        return invoice


class BankStatementLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankStatementLine
        fields = '__all__'
        read_only_fields = ['is_reconciled', 'matched_journal_entry']


class BankStatementSerializer(serializers.ModelSerializer):
    lines = BankStatementLineSerializer(many=True, read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = BankStatement
        fields = [
            'id', 'account', 'account_name', 'statement_date', 'reference',
            'start_balance', 'end_balance', 'status', 'created_at', 'lines'
        ]
        read_only_fields = ['created_at', 'status']


class PurchaseRequestSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    approved_by_name = serializers.SerializerMethodField(read_only=True)
    budget_name = serializers.CharField(source='budget.name', read_only=True)

    class Meta:
        model = PurchaseRequest
        fields = [
            'id', 'requester', 'requester_name', 'department', 'department_name',
            'description', 'estimated_cost', 'vendor_suggestion',
            'status', 'approved_by', 'approved_by_name', 'rejection_reason',
            'budget', 'budget_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'approved_by', 'rejection_reason', 'created_at', 'requester']

    def get_requester_name(self, obj):
        emp = obj.requester
        if not emp:
            return None
        # Prefer linked Django user full name if available
        user = getattr(emp, 'user', None)
        if user and hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name:
                return name
        # Fallback to Employee first/last name or string repr
        first = getattr(emp, 'first_name', '') or ''
        last = getattr(emp, 'last_name', '') or ''
        full = (first + ' ' + last).strip()
        return full or str(emp)

    def get_approved_by_name(self, obj):
        emp = obj.approved_by
        if not emp:
            return None
        user = getattr(emp, 'user', None)
        if user and hasattr(user, 'get_full_name'):
            name = user.get_full_name()
            if name:
                return name
        first = getattr(emp, 'first_name', '') or ''
        last = getattr(emp, 'last_name', '') or ''
        full = (first + ' ' + last).strip()
        return full or str(emp)
