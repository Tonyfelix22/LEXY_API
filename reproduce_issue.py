import os
import django
import sys
from datetime import date

# Setup Django environment
sys.path.append(r'd:\pycharm\PythonProject\LEXIE_ERP\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LEXY_API.settings')
django.setup()

from hr.models import Employee, PayrollRun, Department
from hr.serializers import PayrollRunListSerializer
from django.contrib.auth.models import User

def reproduce():
    print("--- Starting Reproduction Script ---")

    # 1. Create dependencies
    print("Creating Department...")
    dept, _ = Department.objects.get_or_create(name="Test Dept", code="TD001")
    
    # 2. Create Employee
    print("Creating Employee...")
    staff_number = f"TEST-{date.today().strftime('%Y%m%d%H%M%S')}"
    email = f"test.{staff_number}@example.com"
    national_id = staff_number
    
    try:
        employee = Employee.objects.create(
            staff_number=staff_number,
            first_name="John",
            last_name="Doe",
            email=email,
            national_id=national_id,
            department=dept,
            job_title="Tester",
            employment_type="PERMANENT",
            hire_date=date.today(),
            basic_salary=50000,
            status="ACTIVE"
        )
        print(f"Employee created: {employee.get_full_name()} ({employee.staff_number})")
    except Exception as e:
        print(f"Failed to create employee: {e}")
        return

    # 3. Check for Payroll Run
    print("Checking for Payroll Run...")
    payroll = PayrollRun.objects.filter(employee=employee).first()
    
    if payroll:
        print(f"SUCCESS: Payroll Run found for {employee.staff_number}")
        print(f"Payroll Status: {payroll.status}")
        print(f"Period: {payroll.period_start} to {payroll.period_end}")
        
        # 4. Check Serializer Output
        print("Checking Serializer Output...")
        serializer = PayrollRunListSerializer(payroll)
        data = serializer.data
        print(f"Serialized Data: {data}")
        
        if 'employee_name' in data:
            print(f"employee_name: {data['employee_name']}")
        else:
            print("ERROR: employee_name MISSING in serializer output")
            
        if data.get('employee_name') == "John Doe":
             print("SUCCESS: Employee name matches")
        else:
             print(f"WARNING: Employee name mismatch. Expected 'John Doe', got '{data.get('employee_name')}'")

    else:
        print("FAILURE: No Payroll Run found for the new employee.")

if __name__ == "__main__":
    reproduce()
