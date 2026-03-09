#from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Department, Employee, EmploymentHistory, PayrollRun, PayrollDeduction

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'manager']
    search_fields = ['name', 'code']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['staff_number', 'first_name', 'last_name', 'department', 'job_title', 'status']
    search_fields = ['staff_number', 'first_name', 'last_name', 'email']
    list_filter = ['status', 'employment_type', 'department']

@admin.register(EmploymentHistory)
class EmploymentHistoryAdmin(admin.ModelAdmin):
    list_display = ['employee', 'change_type', 'effective_date']
    search_fields = ['employee__staff_number']
    list_filter = ['change_type', 'effective_date']

@admin.register(PayrollRun)
class PayrollRunAdmin(admin.ModelAdmin):
    list_display = ['employee', 'period_start', 'period_end', 'status']
    search_fields = ['employee__staff_number']
    list_filter = ['status']

@admin.register(PayrollDeduction)
class PayrollDeductionAdmin(admin.ModelAdmin):
    list_display = ['payroll_run', 'deduction_type', 'amount']