from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.apps import apps


# ========================
# DEPARTMENT MODEL
# ========================
class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    manager = models.ForeignKey(
        'Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments'
    )

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


# ========================
# EMPLOYEE MODEL
# ========================
class Employee(models.Model):
    EMPLOYMENT_STATUS = [
        ('ACTIVE', 'Active'),
        ('ON_LEAVE', 'On Leave'),
        ('SUSPENDED', 'Suspended'),
        ('TERMINATED', 'Terminated'),
        ('RESIGNED', 'Resigned'),
    ]

    EMPLOYMENT_TYPE = [
        ('PERMANENT', 'Permanent'),
        ('CONTRACT', 'Contract'),
        ('CASUAL', 'Casual'),
        ('INTERN', 'Intern'),
    ]

    # Personal Info
    staff_number = models.CharField(max_length=20, unique=True, db_index=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    national_id = models.CharField(max_length=20, unique=True)

    # Link to Auth User
    user = models.OneToOneField('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_profile')

    # Employment Info
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    job_title = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE, default='PERMANENT')
    hire_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    # Compensation
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)

    # Tax Info
    kra_pin = models.CharField(max_length=20, blank=True, null=True, verbose_name="KRA PIN")
    nssf_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="NSSF Number")
    SHA_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="SHA Number")

    # Status
    status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS, default='ACTIVE')

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['staff_number']
        indexes = [
            models.Index(fields=['hire_date']),
        ]

    def get_full_name(self):
        """Return the employee's full name."""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    def clean(self):
        """Validate end date logic and tax numbers."""
        if self.end_date and self.end_date < self.hire_date:
            raise ValidationError("End date cannot be before hire date")

        # Enforce NSSF and SHA numbers for non-intern/casual employees
        if self.employment_type not in ['INTERN', 'CASUAL']:
            if not self.nssf_number:
                raise ValidationError({'nssf_number': "NSSF Number is required for this employment type."})
            if not self.SHA_number:
                raise ValidationError({'SHA_number': "SHA Number is required for this employment type."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        """Check if employee is currently active."""
        return self.status == 'ACTIVE'

    @property
    def years_of_service(self):
        """Calculate years of service."""
        end = self.end_date or timezone.now().date()
        delta = end - self.hire_date
        return round(delta.days / 365.25, 2)


# ========================
# EMPLOYMENT HISTORY MODEL
# ========================
class EmploymentHistory(models.Model):
    CHANGE_TYPE = [
        ('PROMOTION', 'Promotion'),
        ('TRANSFER', 'Transfer'),
        ('SALARY_INCREASE', 'Salary Increase'),
        ('SALARY_DECREASE', 'Salary Decrease'),
        ('DEMOTION', 'Demotion'),
        ('TERMINATION', 'Termination'),
        ('RESIGNATION', 'Resignation'),
        ('SUSPENSION', 'Suspension'),
        ('REINSTATEMENT', 'Reinstatement'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='employment_history')
    effective_date = models.DateField()
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPE)

    # Previous values
    previous_department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='previous_employees'
    )
    previous_job_title = models.CharField(max_length=100, blank=True, null=True)
    previous_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    previous_status = models.CharField(max_length=20, blank=True, null=True)

    # New values
    new_department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='new_employees'
    )
    new_job_title = models.CharField(max_length=100, blank=True, null=True)
    new_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_status = models.CharField(max_length=20, blank=True, null=True)

    reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    approved_by = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-effective_date']
        verbose_name_plural = "Employment Histories"
        indexes = [
            models.Index(fields=['employee', '-effective_date']),
            models.Index(fields=['change_type']),
        ]

    def __str__(self):
        return f"{self.employee.staff_number} - {self.change_type} on {self.effective_date}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            employee = self.employee
            if self.new_department:
                employee.department = self.new_department
            if self.new_job_title:
                employee.job_title = self.new_job_title
            if self.new_salary:
                employee.basic_salary = self.new_salary
            if self.new_status:
                employee.status = self.new_status
            employee.save()


# ========================
# PAYROLL RUN MODEL
# ========================
class PayrollRun(models.Model):
    PAYROLL_STATUS = [
        ('DRAFT', 'Draft'),
        ('CALCULATED', 'Calculated'),
        ('APPROVED', 'Approved'),
        ('POSTED', 'Posted to Finance'),
        ('PAID', 'Paid'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payroll_runs')
    period_start = models.DateField()
    period_end = models.DateField()
    pay_date = models.DateField(default=timezone.now)

    # Earnings
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    overtime = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2)

    # Deductions
    paye_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="PAYE Tax")
    nssf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="NSSF Deduction")
    sha_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="SHA Deduction")
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Net pay
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)

    # Status tracking
    status = models.CharField(max_length=20, choices=PAYROLL_STATUS, default='DRAFT')
    is_posted_to_finance = models.BooleanField(default=False)
    journal_entry = models.ForeignKey(
        'finance.JournalEntry', on_delete=models.SET_NULL, null=True, blank=True, related_name='payroll_runs'
    )

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    calculated_by = models.CharField(max_length=100, blank=True, null=True)
    approved_by = models.CharField(max_length=100, blank=True, null=True)
    posted_by = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-period_end', '-pay_date']
        unique_together = ['employee', 'period_start', 'period_end']
        indexes = [
            models.Index(fields=['employee', '-period_end']),
            models.Index(fields=['status']),
            models.Index(fields=['pay_date']),
        ]

    def __str__(self):
        return f"Payroll for {self.employee.staff_number} ({self.period_start} - {self.period_end})"

    def calculate_totals(self):
        """Compute payroll totals with automatic tax calculation (Kenya)."""
        from decimal import Decimal, ROUND_HALF_UP

        # Ensure values are Decimals
        basic = Decimal(str(self.basic_salary))
        allowances = Decimal(str(self.allowances))
        overtime = Decimal(str(self.overtime))
        
        self.gross_salary = (basic + allowances + overtime).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        gross = self.gross_salary

        # 1. NSSF (Tier I + Tier II) - Standard 2024 rates
        # Exempt Interns and Casuals
        if self.employee.employment_type in ['INTERN', 'CASUAL']:
            self.nssf_deduction = Decimal('0.00')
        else:
            nssf_rate = Decimal('0.06')
            tier_2_limit = Decimal('36000')
            
            pensionable_pay = basic
            
            if pensionable_pay > tier_2_limit:
                self.nssf_deduction = Decimal('2160.00')
            else:
                self.nssf_deduction = (pensionable_pay * nssf_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # 2. SHA (Social Health Authority) - 2.75% of Gross
        # Exempt Interns and Casuals
        if self.employee.employment_type in ['INTERN', 'CASUAL']:
            self.sha_deduction = Decimal('0.00')
        else:
            self.sha_deduction = (gross * Decimal('0.0275')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # 3. PAYE
        taxable_income = gross - self.nssf_deduction - self.sha_deduction
        
        if taxable_income <= 0:
            self.paye_tax = Decimal('0.00')
        else:
            tax = Decimal('0.00')
            # Band 1: Up to 24,000 @ 10%
            b1 = Decimal('24000')
            if taxable_income <= b1:
                tax += taxable_income * Decimal('0.10')
            else:
                tax += b1 * Decimal('0.10')
                remainder = taxable_income - b1
                
                # Band 2: Next 8,333 @ 25%
                b2 = Decimal('8333')
                if remainder <= b2:
                    tax += remainder * Decimal('0.25')
                else:
                    tax += b2 * Decimal('0.25')
                    remainder -= b2
                    
                    # Band 3: Next 467,667 @ 30%
                    b3 = Decimal('467667')
                    if remainder <= b3:
                        tax += remainder * Decimal('0.30')
                    else:
                        tax += b3 * Decimal('0.30')
                        remainder -= b3
                        
                        # Band 4: Next 300,000 @ 32.5%
                        b4 = Decimal('300000')
                        if remainder <= b4:
                            tax += remainder * Decimal('0.325')
                        else:
                            tax += b4 * Decimal('0.325')
                            remainder -= b4
                            
                            # Band 5: Above 800,000 @ 35%
                            tax += remainder * Decimal('0.35')
            
            # Personal Relief
            personal_relief = Decimal('2400')
            paye = tax - personal_relief
            self.paye_tax = max(paye, Decimal('0.00')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        self.total_deductions = (
            self.paye_tax + self.nssf_deduction + self.sha_deduction + self.other_deductions
        ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        self.net_salary = (self.gross_salary - self.total_deductions).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.status = 'CALCULATED'
        self.save()

    def post_to_finance(self, posted_by=None):
        """Create corresponding journal entry in Finance."""
        if self.is_posted_to_finance:
            raise ValidationError("This payroll has already been posted to finance")

        if self.status != 'APPROVED':
            raise ValidationError("Payroll must be approved before posting to finance")

        Account = apps.get_model('finance', 'Account')
        JournalEntry = apps.get_model('finance', 'JournalEntry')
        JournalLine = apps.get_model('finance', 'JournalLine')

        try:
            salary_expense = Account.objects.get(code='5210')
            paye_payable = Account.objects.get(code='2110')
            nssf_payable = Account.objects.get(code='2120')
            sha_payable = Account.objects.get(code='2130')
            bank_account = Account.objects.get(code='1120')

            entry = JournalEntry.objects.create(
                date=self.pay_date,
                description=f"Payroll for {self.employee.get_full_name()} - {self.employee.staff_number} "
                            f"({self.period_start} to {self.period_end})",
                reference=f"PAY-{self.employee.staff_number}-{self.period_start.strftime('%Y%m')}"
            )

            # Journal lines
            JournalLine.objects.create(entry=entry, account=salary_expense,
                                       debit=self.gross_salary, credit=0,
                                       description=f"Gross salary for {self.employee.staff_number}")

            if self.paye_tax > 0:
                JournalLine.objects.create(entry=entry, account=paye_payable, debit=0, credit=self.paye_tax,
                                           description=f"PAYE for {self.employee.staff_number}")

            if self.nssf_deduction > 0:
                JournalLine.objects.create(entry=entry, account=nssf_payable, debit=0, credit=self.nssf_deduction,
                                           description=f"NSSF for {self.employee.staff_number}")

            if self.sha_deduction > 0:
                JournalLine.objects.create(entry=entry, account=sha_payable, debit=0, credit=self.sha_deduction,
                                           description=f"SHA for {self.employee.staff_number}")

            JournalLine.objects.create(entry=entry, account=bank_account, debit=0, credit=self.net_salary,
                                       description=f"Net pay for {self.employee.staff_number}")

            self.journal_entry = entry
            self.is_posted_to_finance = True
            self.status = 'POSTED'
            self.posted_by = posted_by
            self.save()

            return entry

        except Account.DoesNotExist as e:
            raise ValidationError(f"Missing account: {e}")
        except Exception as e:
            raise ValidationError(f"Finance posting error: {e}")

    def clean(self):
        if self.period_end < self.period_start:
            raise ValidationError("Period end date must be after period start date")

        if self.employee.status != 'ACTIVE':
            raise ValidationError(f"Cannot create payroll for {self.employee.status} employee")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# ========================
# PAYROLL DEDUCTION MODEL
# ========================
class PayrollDeduction(models.Model):
    DEDUCTION_TYPE = [
        ('LOAN', 'Loan Repayment'),
        ('ADVANCE', 'Salary Advance'),
        ('INSURANCE', 'Insurance'),
        ('UNION_DUES', 'Union Dues'),
        ('OTHER', 'Other'),
    ]

    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='additional_deductions')
    deduction_type = models.CharField(max_length=20, choices=DEDUCTION_TYPE)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['deduction_type']

    def __str__(self):
        return f"{self.deduction_type} - {self.amount} ({self.payroll_run.employee.staff_number})"


# ========================
# LEAVE MANAGEMENT MODELS
# ========================

class LeaveType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=10, unique=True)
    days_per_year = models.PositiveIntegerField(default=21)
    requires_approval = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class LeaveBalance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(default=timezone.now().year)
    balance = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    used = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    class Meta:
        unique_together = ('employee', 'leave_type', 'year')

    def __str__(self):
        return f"{self.employee.staff_number} - {self.leave_type.code}: {self.balance}"

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    manager_comment = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def duration(self):
        # Simple calculation, can be enhanced to exclude weekends/holidays
        delta = self.end_date - self.start_date
        return delta.days + 1

    def __str__(self):
        return f"{self.employee.staff_number} - {self.leave_type.code} ({self.start_date} to {self.end_date})"

    def clean(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("Start date cannot be after end date")


# ========================
# RECRUITMENT MODELS
# ========================

class JobPosting(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
    ]

    title = models.CharField(max_length=200)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='job_postings')
    job_description = models.TextField()
    requirements = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    closing_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.department.name} ({self.status})"


class Applicant(models.Model):
    STATUS_CHOICES = [
        ('APPLIED', 'Applied'),
        ('SCREENING', 'Screening'),
        ('INTERVIEW', 'Interview'),
        ('OFFER_SENT', 'Offer Sent'),
        ('HIRED', 'Hired'),
        ('REJECTED', 'Rejected'),
    ]

    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applicants')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Internal Application Link
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_applications')
    
    # resume = models.FileField(upload_to='resumes/', null=True, blank=True) # Skipped for simplicity in this demo, assumes external link or text
    resume_link = models.URLField(blank=True, null=True, help_text="Link to resume/portfolio")
    cover_letter = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='APPLIED')
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['job_posting', 'email']

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.job_posting.title}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


# ========================
# PERFORMANCE MODELS
# ========================

class PerformanceGoal(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    progress = models.IntegerField(default=0, help_text="Percentage 0-100")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.employee.get_full_name()}"


class PerformanceReview(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='reviews_received')
    reviewer = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews_given')
    
    review_period_start = models.DateField()
    review_period_end = models.DateField()
    review_date = models.DateField(default=timezone.now)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    rating = models.IntegerField(default=0, help_text="Rating 1-5")
    feedback = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review for {self.employee.get_full_name()} ({self.review_period_start} - {self.review_period_end})"


# ========================
# TRAVEL MANAGEMENT MODELS
# ========================

class TravelRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='travel_requests')
    destination = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    purpose = models.TextField()
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    manager_comment = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_travels')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Travel to {self.destination} - {self.employee.get_full_name()}"


