import os
import django
import sys

sys.path.append(r'd:\pycharm\PythonProject\LEXIE_ERP\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LEXY_API.settings')
django.setup()

from hr.models import Employee

def list_staff_numbers():
    employees = Employee.objects.all()[:10]
    print("Existing Staff Numbers:")
    for emp in employees:
        print(f"{emp.staff_number} (Dept: {emp.department.name if emp.department else 'None'}, Code: {emp.department.code if emp.department else 'None'})")

if __name__ == "__main__":
    list_staff_numbers()
