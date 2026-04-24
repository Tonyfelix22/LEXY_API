from rest_framework import serializers
from .models import (
    Department, Employee, EmploymentHistory, PayrollRun, PayrollDeduction, 
    LeaveType, LeaveBalance, LeaveRequest, JobPosting, Applicant, 
    PerformanceGoal, PerformanceReview, TravelRequest
)
from django.contrib.auth.models import User
from users.models import UserProfile
from django.utils import timezone
import random
import string


# ===============================
# Department
# ===============================
class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id',
            'name',
            'code',
            'manager',
            'manager_name',
            'employee_count'
        ]
        read_only_fields = ['id']

    def get_employee_count(self, obj):
        return obj.employees.filter(status='ACTIVE').count()


# ===============================
# Employee
# ===============================
class EmployeeListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    years_of_service = serializers.FloatField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id',
            'staff_number',
            'full_name',
            'email',
            'department',
            'department_name',
            'job_title',
            'employment_type',
            'status',
            'hire_date',
            'basic_salary',
            'years_of_service'
        ]
        read_only_fields = ['id', 'full_name', 'department_name', 'years_of_service']


class EmployeeDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    years_of_service = serializers.FloatField(read_only=True)

    # Write-only fields for user creation
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, write_only=True, default='STAFF')

    class Meta:
        model = Employee
        fields = [
            'id',
            'staff_number',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'national_id',
            'department',
            'department_name',
            'department_code',
            'job_title',
            'employment_type',
            'hire_date',
            'end_date',
            'basic_salary',
            'kra_pin',
            'nssf_number',
            'SHA_number',
            'status',
            'is_active',
            'years_of_service',
            'created_at',
            'updated_at',
            'username',
            'password',
            'role'
        ]
        read_only_fields = [
            'id',
            'staff_number',
            'full_name',
            'department_name',
            'department_code',
            'is_active',
            'years_of_service',
            'created_at',
            'updated_at'
        ]

    def create(self, validated_data):
        # Extract user data
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        role = validated_data.pop('role', 'STAFF')

        # Auto-generate staff number
        # Format: {Department Code}-{Random 4 Digits}
        department = validated_data.get('department')
        prefix = department.code if department else "EMP"
        
        while True:
            suffix = ''.join(random.choices(string.digits, k=4))
            staff_number = f"{prefix}-{suffix}"
            if not Employee.objects.filter(staff_number=staff_number).exists():
                break
        
        validated_data['staff_number'] = staff_number

        # Create User if username/password provided
        user = None
        if username and password:
            if User.objects.filter(username=username).exists():
                raise serializers.ValidationError({'username': 'Username already exists.'})
            
            user = User.objects.create_user(username=username, password=password, email=validated_data.get('email'))
            
            # Create/Update UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.department = validated_data.get('department').name if validated_data.get('department') else ''
            profile.save()

        # The User post_save signal auto-provisions a stub Employee, to prevent uniqueness
        # crashes on email and user fields, we must update the stub, not create a duplicate.
        if user:
            employee = Employee.objects.get(user=user)
            for key, value in validated_data.items():
                setattr(employee, key, value)
            # Override auto-generated stub fields with provided ones
            employee.staff_number = staff_number
            employee.save()
            return employee
        else:
            validated_data['user'] = None
            employee = Employee.objects.create(**validated_data)
            return employee

    def validate_email(self, value):
        instance = self.instance
        if Employee.objects.exclude(pk=instance.pk if instance else None).filter(email=value).exists():
            raise serializers.ValidationError("An employee with this email already exists.")
        return value

    def validate_staff_number(self, value):
        instance = self.instance
        if Employee.objects.exclude(pk=instance.pk if instance else None).filter(staff_number=value).exists():
            raise serializers.ValidationError("An employee with this staff number already exists.")
        return value

    def validate_national_id(self, value):
        instance = self.instance
        if Employee.objects.exclude(pk=instance.pk if instance else None).filter(national_id=value).exists():
            raise serializers.ValidationError("An employee with this national id already exists.")
        return value

    def validate(self, data):
        hire_date = data.get('hire_date') or (self.instance.hire_date if self.instance else None)
        end_date = data.get('end_date')
        if end_date and hire_date and end_date < hire_date:
            raise serializers.ValidationError({'end_date': 'End date cannot be before hire date.'})

        # Validate NSSF and SHA numbers
        employment_type = data.get('employment_type') or (self.instance.employment_type if self.instance else None)
        nssf_number = data.get('nssf_number')
        sha_number = data.get('SHA_number')

        if employment_type not in ['INTERN', 'CASUAL']:
            errors = {}
            if not nssf_number and (not self.instance or not self.instance.nssf_number):
                errors['nssf_number'] = "NSSF Number is required for this employment type."
            if not sha_number and (not self.instance or not self.instance.SHA_number):
                errors['SHA_number'] = "SHA Number is required for this employment type."
            
            if errors:
                raise serializers.ValidationError(errors)

        return data


# ===============================
# Employment History
# ===============================
class EmploymentHistorySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_staff_number = serializers.CharField(source='employee.staff_number', read_only=True)
    previous_department_name = serializers.CharField(source='previous_department.name', read_only=True)
    new_department_name = serializers.CharField(source='new_department.name', read_only=True)
    change_type_display = serializers.CharField(source='get_change_type_display', read_only=True)

    class Meta:
        model = EmploymentHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        has_change = any([
            data.get('new_department'),
            data.get('new_job_title'),
            data.get('new_salary'),
            data.get('new_status')
        ])
        if not has_change:
            raise serializers.ValidationError(
                "At least one new value must be specified (department, job_title, salary, or status)."
            )
        return data


# ===============================
# Payroll
# ===============================
class PayrollDeductionSerializer(serializers.ModelSerializer):
    deduction_type_display = serializers.CharField(source='get_deduction_type_display', read_only=True)

    class Meta:
        model = PayrollDeduction
        fields = [
            'id',
            'payroll_run',
            'deduction_type',
            'deduction_type_display',
            'description',
            'amount'
        ]
        read_only_fields = ['id']


class PayrollRunListSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_staff_number = serializers.CharField(source='employee.staff_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PayrollRun
        fields = [
            'id',
            'employee',
            'employee_name',
            'employee_staff_number',
            'period_start',
            'period_end',
            'pay_date',
            'gross_salary',
            'total_deductions',
            'net_salary',
            'status',
            'status_display',
            'is_posted_to_finance',
            'created_at'
        ]
        read_only_fields = ['id', 'employee_name', 'employee_staff_number', 'status_display', 'created_at']


class PayrollRunDetailSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_staff_number = serializers.CharField(source='employee.staff_number', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    additional_deductions = PayrollDeductionSerializer(many=True, read_only=True)
    journal_entry_id = serializers.IntegerField(source='journal_entry.id', read_only=True)

    class Meta:
        model = PayrollRun
        fields = '__all__'
        read_only_fields = [
            'id',
            'employee_name',
            'employee_staff_number',
            'employee_email',
            'department_name',
            'status_display',
            'is_posted_to_finance',
            'journal_entry',
            'journal_entry_id',
            'created_at',
            'updated_at'
        ]


class PayrollRunCreateSerializer(serializers.ModelSerializer):
    """When creating a new payroll, the backend handles calculations."""

    class Meta:
        model = PayrollRun
        fields = [
            'employee',
            'period_start',
            'period_end',
            'pay_date',
            'basic_salary',
            'allowances',
            'overtime',
            'paye_tax',
            'nssf_deduction',
            'sha_deduction',
            'other_deductions',
            'calculated_by'
        ]

    def create(self, validated_data):
        payroll = PayrollRun.objects.create(**validated_data)
        payroll.calculate_totals()
        return payroll

    def validate_employee(self, value):
        if value.status != 'ACTIVE':
            raise serializers.ValidationError(
                f"Cannot create payroll for {value.get_status_display()} employee."
            )
        return value

    def validate(self, data):
        employee = data.get('employee')
        start = data.get('period_start')
        end = data.get('period_end')
        if end < start:
            raise serializers.ValidationError({'period_end': 'Period end must be after start.'})
        if PayrollRun.objects.filter(employee=employee, period_start=start, period_end=end).exists():
            raise serializers.ValidationError(
                f"Payroll already exists for {employee.get_full_name()} for this period."
            )
        return data


class PayrollPostToFinanceSerializer(serializers.Serializer):
    posted_by = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate(self, data):
        payroll = self.context.get('payroll')
        if not payroll:
            raise serializers.ValidationError("Payroll not found.")
        if payroll.is_posted_to_finance:
            raise serializers.ValidationError("Payroll already posted.")
        if payroll.status != 'APPROVED':
            raise serializers.ValidationError("Payroll must be approved before posting.")
        return data


# ===============================
# Reporting
# ===============================
class EmployeeSalaryHistorySerializer(serializers.Serializer):
    effective_date = serializers.DateField()
    change_type = serializers.CharField()
    previous_salary = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    new_salary = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    reason = serializers.CharField(allow_null=True)
    approved_by = serializers.CharField(allow_null=True)


class PayrollSummarySerializer(serializers.Serializer):
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    total_employees = serializers.IntegerField()
    total_gross_salary = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_paye_tax = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_nssf = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_sha = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_deductions = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_net_salary = serializers.DecimalField(max_digits=15, decimal_places=2)
    status_breakdown = serializers.DictField()


# ===============================
# Leave Management
# ===============================

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'

class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    leave_type_code = serializers.CharField(source='leave_type.code', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = LeaveBalance
        fields = [
            'id',
            'employee',
            'employee_name',
            'leave_type',
            'leave_type_name',
            'leave_type_code',
            'year',
            'balance',
            'used'
        ]
        read_only_fields = ['id', 'employee_name', 'leave_type_name', 'leave_type_code']


ALLOWED_LEAVE_CODES = {
    'SICK': 'Sick Leave',
    'MAT': 'Maternity Leave',
    'ANL': 'Annual Leave',
    'COMP': 'Compassionate Leave',
    'STUDY': 'Study Leave',
    'PL': 'Paternity Leave',
    'OTHER': 'Other',
}

class LeaveRequestSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_user_id = serializers.IntegerField(source='employee.user.id', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    duration = serializers.IntegerField(read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'employee',
            'employee_name',
            'employee_user_id',
            'leave_type',
            'leave_type_name',
            'start_date',
            'end_date',
            'duration',
            'reason',
            'status',
            'manager_comment',
            'approved_by',
            'approved_by_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 
            'employee',
            'employee_name', 
            'employee_user_id',
            'leave_type_name', 
            'approved_by_name', 
            'duration', 
            'created_at', 
            'updated_at'
        ]

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        leave_type = data.get('leave_type') or (self.instance.leave_type if self.instance else None)
        reason = data.get('reason') or (self.instance.reason if self.instance else '')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError("Start date cannot be after end date.")
        
        # Enforce allowed leave types by code
        if leave_type and leave_type.code not in ALLOWED_LEAVE_CODES:
            allowed = ', '.join(sorted(ALLOWED_LEAVE_CODES.keys()))
            raise serializers.ValidationError({
                'leave_type': f"Unsupported leave type code '{leave_type.code}'. Allowed: {allowed}."
            })
        
        # If OTHER, require explicit explanation from user in reason
        if leave_type and leave_type.code == 'OTHER':
            if not reason or len(reason.strip()) < 10:
                raise serializers.ValidationError({
                    'reason': 'Please explain the leave type in detail (min 10 characters) when selecting Other.'
                })
        
        return data


# ===============================
# Recruitment
# ===============================

class JobPostingSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    applicant_count = serializers.IntegerField(source='applicants.count', read_only=True)

    class Meta:
        model = JobPosting
        fields = [
            'id', 'title', 'department', 'department_name', 'job_description', 
            'requirements', 'status', 'closing_date', 'applicant_count', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'applicant_count']


class ApplicantSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job_posting.title', read_only=True)
    
    class Meta:
        model = Applicant
        fields = [
            'id', 'job_posting', 'job_title', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'employee', 'resume_link', 'cover_letter', 'status', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'full_name', 'created_at', 'updated_at']


# ===============================
# Performance Management
# ===============================

class PerformanceGoalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    
    class Meta:
        model = PerformanceGoal
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)

    class Meta:
        model = PerformanceReview
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        review_period_start = data.get('review_period_start')
        review_period_end = data.get('review_period_end')
        employee = data.get('employee')
        reviewer = data.get('reviewer')
        status = data.get('status')

        # Validate date range
        if review_period_start and review_period_end:
            if review_period_start > review_period_end:
                raise serializers.ValidationError({
                    "review_period_end": "Review period end date cannot be before the start date."
                })

        # Prevent employee from reviewing themselves
        if employee and reviewer:
            if employee == reviewer:
                raise serializers.ValidationError({
                    "reviewer": "An employee cannot review themselves. Please select a different reviewer."
                })

        # Check for duplicate/overlapping scheduled reviews
        # Only check if employee and status are provided
        if employee and review_period_start and review_period_end:
            # Determine which reviews to check against
            # If creating a new review, exclude self from validation
            review_id = self.instance.id if self.instance else None

            # Check for overlapping review periods with SCHEDULED or COMPLETED status
            overlapping_reviews = PerformanceReview.objects.filter(
                employee=employee,
                review_period_start__lte=review_period_end,
                review_period_end__gte=review_period_start,
            ).exclude(id=review_id)

            # Filter for reviews that are already scheduled or completed
            conflicting_review = overlapping_reviews.filter(
                status__in=['SCHEDULED', 'COMPLETED']
            ).first()

            if conflicting_review:
                raise serializers.ValidationError({
                    "employee": f"This employee already has a performance review scheduled for the period "
                                f"{conflicting_review.review_period_start.strftime('%b %d, %Y')} to "
                                f"{conflicting_review.review_period_end.strftime('%b %d, %Y')}. "
                                f"Current status: {conflicting_review.status}."
                })

        return data


# ===============================
# Travel Management
# ===============================

class TravelRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = TravelRequest
        fields = [
            'id',
            'employee',
            'employee_name',
            'destination',
            'start_date',
            'end_date',
            'purpose',
            'estimated_cost',
            'status',
            'manager_comment',
            'approved_by',
            'approved_by_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'employee_name', 'approved_by_name', 'created_at', 'updated_at']

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError("Start date cannot be after end date.")
            
        return data

