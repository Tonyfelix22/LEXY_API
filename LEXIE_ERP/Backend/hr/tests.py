from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from .models import LeaveType, Employee, Department
from .serializers import LeaveRequestSerializer


class LeaveRequestValidationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='john', password='pass', email='john@example.com',
            first_name='John', last_name='Doe'
        )
        self.dept = Department.objects.create(name='IT', code='IT')
        self.emp = Employee.objects.create(
            staff_number='IT-0001',
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            phone='',
            national_id='NID10001',
            user=self.user,
            department=self.dept,
            job_title='Engineer',
            employment_type='INTERN',
            hire_date=timezone.now().date(),
            basic_salary=0,
            status='ACTIVE',
        )
        # Seed leave types
        self.sick = LeaveType.objects.create(name='Sick Leave', code='SICK', days_per_year=7)
        self.mat = LeaveType.objects.create(name='Maternity Leave', code='MAT', days_per_year=90)
        self.other = LeaveType.objects.create(name='Other', code='OTHER', days_per_year=0)

    def test_sick_leave_ok(self):
        data = {
            'employee': self.emp.id,
            'leave_type': self.sick.id,
            'start_date': '2026-01-01',
            'end_date': '2026-01-03',
            'reason': 'Flu and fever'
        }
        ser = LeaveRequestSerializer(data=data)
        self.assertTrue(ser.is_valid(), ser.errors)

    def test_other_leave_requires_explanation(self):
        data = {
            'employee': self.emp.id,
            'leave_type': self.other.id,
            'start_date': '2026-01-01',
            'end_date': '2026-01-03',
            'reason': 'short'
        }
        ser = LeaveRequestSerializer(data=data)
        self.assertFalse(ser.is_valid())
        self.assertIn('reason', ser.errors)

        data['reason'] = 'Attending a personal legal matter that requires presence.'
        ser = LeaveRequestSerializer(data=data)
        self.assertTrue(ser.is_valid(), ser.errors)

    def test_reject_unknown_leave_code(self):
        unknown = LeaveType.objects.create(name='Random', code='XYZ', days_per_year=1)
        data = {
            'employee': self.emp.id,
            'leave_type': unknown.id,
            'start_date': '2026-01-01',
            'end_date': '2026-01-02',
            'reason': 'Test'
        }
        ser = LeaveRequestSerializer(data=data)
        self.assertFalse(ser.is_valid())
        self.assertIn('leave_type', ser.errors)
