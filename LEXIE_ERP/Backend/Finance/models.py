
from django.db import models
from django.utils import timezone


class Account(models.Model):
    ACCOUNT_TYPES = [
        ('ASSET', 'Asset'),
        ('LIABILITY', 'Liability'),
        ('EQUITY', 'Equity'),
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    ]

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    def __str__(self):
        return f"{self.code} - {self.name}"


class JournalEntry(models.Model):
    date = models.DateField(default=timezone.now)
    description = models.TextField()
    reference = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"JournalEntry {self.id} - {self.date}"


class JournalLine(models.Model):
    entry = models.ForeignKey(JournalEntry, related_name='lines', on_delete=models.CASCADE)
    account = models.ForeignKey(Account, on_delete=models.PROTECT)
    debit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.account.code} | DR: {self.debit} | CR: {self.credit}"

    class Meta:
        verbose_name_plural = "Journal Lines"


class Budget(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    name = models.CharField(max_length=100)
    department = models.ForeignKey('hr.Department', on_delete=models.CASCADE, related_name='budgets', null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2, help_text="Allocated Amount")
    spent_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    start_date = models.DateField()
    end_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    
    # Approval Fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    approved_by = models.ForeignKey('hr.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_budgets')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.amount}"

    @property
    def is_active(self):
        now = timezone.now().date()
        return self.start_date <= now <= self.end_date

    @property
    def remaining_amount(self):
        return self.amount - self.spent_amount

    @property
    def utilization(self):
        if self.amount == 0:
            return 0
        return round((self.spent_amount / self.amount) * 100, 2)


class Contact(models.Model):
    CONTACT_TYPES = [
        ('CUSTOMER', 'Customer'),
        ('VENDOR', 'Vendor'),
    ]

    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=CONTACT_TYPES)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Invoice(models.Model):
    INVOICE_TYPES = [
        ('INVOICE', 'Customer Invoice'),  # Accounts Receivable
        ('BILL', 'Vendor Bill'),          # Accounts Payable
    ]
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('POSTED', 'Posted'),             # Validated, JE created
        ('PAID', 'Paid'),                 # Fully paid
        ('CANCELLED', 'Cancelled'),
    ]

    contact = models.ForeignKey(Contact, on_delete=models.PROTECT, related_name='invoices')
    type = models.CharField(max_length=20, choices=INVOICE_TYPES)
    reference = models.CharField(max_length=100, blank=True, null=True, help_text="Invoice Number")
    date = models.DateField(default=timezone.now)
    due_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    amount_due = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Link to GL
    journal_entry = models.ForeignKey(
        JournalEntry, on_delete=models.SET_NULL, null=True, blank=True, related_name='related_invoice'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_type_display()} {self.reference} - {self.contact.name}"
    
    def calculate_totals(self):
        self.total_amount = sum(item.amount for item in self.items.all())
        # Calculate amount due based on payments (done separately or simple calc here)
        paid = sum(p.amount for p in self.payments.all())
        self.amount_due = self.total_amount - paid
        
        if self.status == 'POSTED' and self.amount_due <= 0:
            self.status = 'PAID'
        elif self.status == 'PAID' and self.amount_due > 0:
            self.status = 'POSTED'
            
        self.save()


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, help_text="Revenue or Expense Account")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    amount = models.DecimalField(max_digits=15, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        self.invoice.calculate_totals()


class Payment(models.Model):
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('BANK', 'Bank Transfer'),
        ('CHECK', 'Check'),
        ('MOBILE', 'Mobile Money'),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField(default=timezone.now)
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='BANK')
    reference = models.CharField(max_length=100, blank=True, null=True, help_text="Payment Ref (Check No, Transaction ID)")
    
    # Link to GL (Payment Entry)
    journal_entry = models.ForeignKey(
        JournalEntry, on_delete=models.SET_NULL, null=True, blank=True, related_name='related_payment'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.amount} for {self.invoice}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.calculate_totals()


class BankStatement(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('POSTED', 'Posted'),
    ]

    account = models.ForeignKey(Account, on_delete=models.PROTECT, help_text="GL Account (Bank)", limit_choices_to={'type': 'ASSET'})
    statement_date = models.DateField(default=timezone.now)
    reference = models.CharField(max_length=100, help_text="Statement Number/Ref")
    
    start_balance = models.DecimalField(max_digits=15, decimal_places=2)
    end_balance = models.DecimalField(max_digits=15, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Statement {self.reference} - {self.account.name}"


class BankStatementLine(models.Model):
    statement = models.ForeignKey(BankStatement, on_delete=models.CASCADE, related_name='lines')
    date = models.DateField()
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2, help_text="Positive for Deposit, Negative for Withdrawal")
    reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Reconciliation Status
    is_reconciled = models.BooleanField(default=False)
    matched_journal_entry = models.ForeignKey(
        JournalEntry, on_delete=models.SET_NULL, null=True, blank=True, related_name='reconciled_bank_line'
    )
    
    def __str__(self):
        return f"{self.date} - {self.description} ({self.amount})"


class PurchaseRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('ORDERED', 'Ordered'), 
    ]

    requester = models.ForeignKey('hr.Employee', on_delete=models.CASCADE, related_name='purchase_requests')
    department = models.ForeignKey('hr.Department', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField()
    estimated_cost = models.DecimalField(max_digits=15, decimal_places=2)
    vendor_suggestion = models.CharField(max_length=200, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey('hr.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_purchases')
    rejection_reason = models.TextField(blank=True, null=True)
    
    budget = models.ForeignKey(Budget, on_delete=models.SET_NULL, null=True, blank=True, help_text="Budget to charge against")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"PR-{self.id} by {self.requester} ({self.status})"
