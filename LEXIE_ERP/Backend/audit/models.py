#from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from hr.models import Employee

class AuditLog(models.Model):
    MODULE_CHOICES = [
        ('HR', 'Human Resources'),
        ('FINANCE', 'Finance'),
        ('AUDIT', 'Audit'),
        ('SYSTEM', 'System'),
    ]

    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('PAYROLL_RUN', 'Payroll Run'),
        ('EMPLOYEE_HIRE', 'Employee Hire'),
        ('EMPLOYEE_TERMINATION', 'Employee Termination'),
    ]

    module = models.CharField(max_length=20, choices=MODULE_CHOICES)
    model_name = models.CharField(max_length=50, blank=True, null=True)
    action_type = models.CharField(max_length=50, choices=ACTION_CHOICES)
    object_id = models.CharField(max_length=50, blank=True, null=True)
    changes = models.TextField(blank=True, null=True)
    description = models.TextField()
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.module}] {self.action_type} at {self.timestamp:%Y-%m-%d %H:%M:%S}"


# ========================
# COMPLIANCE MODELS
# ========================

class RegulatoryRequirement(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLIANT', 'Compliant'),
        ('NON_COMPLIANT', 'Non-Compliant'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    authority = models.CharField(max_length=100, help_text="e.g. IRS, GDPR, OSHA")
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.authority} - {self.name}"


# ========================
# INTERNAL CONTROL MODELS
# ========================

class InternalControl(models.Model):
    CONTROL_TYPES = [
        ('PREVENTIVE', 'Preventive'),
        ('DETECTIVE', 'Detective'),
        ('CORRECTIVE', 'Corrective'),
    ]
    
    FREQUENCY_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('ANNUALLY', 'Annually'),
        ('AD_HOC', 'Ad Hoc'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    control_type = models.CharField(max_length=20, choices=CONTROL_TYPES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    owner = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='controls_owned')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ControlTest(models.Model):
    RESULT_CHOICES = [
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
        ('PARTIAL', 'Partial'),
    ]

    control = models.ForeignKey(InternalControl, on_delete=models.CASCADE, related_name='tests')
    test_date = models.DateField(default=models.functions.Now)
    tester = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='tests_performed')
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    evidence = models.TextField(blank=True, null=True, help_text="Link or description of evidence")
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Test for {self.control.name} on {self.test_date} ({self.result})"


