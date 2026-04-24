
import os
import django
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from datetime import timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LEXIE_ERP.settings')
django.setup()

from hr.models import Employee, PayrollRun, Department
from hr.serializers import PayrollRunCreateSerializer
from django.contrib.auth.models import User

def verify_fixes():
    print("--- Verifying Payroll Fixes ---")
    
    # 1. Test Signal: Update employee with salary should create payroll
    print("\n1. Testing Signal Logic...")
    dept, _ = Department.objects.get_or_create(code='TEST', name='Test Dept')
    
    # Create a user (stub employee should be created by users/signals.py)
    test_email = f"test_{int(timezone.now().timestamp())}@example.com"
    user = User.objects.create_user(username=test_email, email=test_email, password='password123')
    
    try:
        emp = Employee.objects.get(user=user)
        print(f"Stub Employee found: {emp.staff_number}, salary: {emp.basic_salary}")
        
        # Verify no payroll exists yet
        today = timezone.now().date()
        start_date = today.replace(day=1)
        end_date = (start_date + relativedelta(months=1)) - timedelta(days=1)
        
        payroll_exists = PayrollRun.objects.filter(employee=emp, period_start=start_date, period_end=end_date).exists()
        print(f"Payroll exists before update: {payroll_exists}")
        
        # Update employee with salary
        emp.basic_salary = 50000
        emp.status = 'ACTIVE'
        emp.department = dept
        emp.save()
        
        # Check if payroll was created
        payroll_exists = PayrollRun.objects.filter(employee=emp, period_start=start_date, period_end=end_date).exists()
        print(f"Payroll exists after update: {payroll_exists}")
        
        if payroll_exists:
            print("✅ Signal Test Passed!")
        else:
            print("❌ Signal Test Failed!")

    except Exception as e:
        print(f"❌ Error in Signal Test: {e}")

    # 2. Test Serializer: Manual creation should work
    print("\n2. Testing PayrollRunCreateSerializer...")
    data = {
        'employee': emp.id,
        'period_start': start_date + relativedelta(months=1),
        'period_end': (start_date + relativedelta(months=2)) - timedelta(days=1),
        'pay_date': start_date + relativedelta(months=1, days=25),
        'basic_salary': 50000,
        'allowances': 0,
        'overtime': 0,
        'paye_tax': 0,
        'nssf_deduction': 0,
        'sha_deduction': 0,
        'other_deductions': 0,
        'calculated_by': 'Admin'
    }
    
    serializer = PayrollRunCreateSerializer(data=data)
    if serializer.is_valid():
        try:
            payroll = serializer.save()
            print(f"✅ Serializer Test Passed! Payroll ID: {payroll.id}")
        except Exception as e:
            print(f"❌ Serializer save failed: {e}")
    else:
        print(f"❌ Serializer validation failed: {serializer.errors}")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    verify_fixes()
