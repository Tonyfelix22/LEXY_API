from django.core.management.base import BaseCommand
from hr.models import Department

class Command(BaseCommand):
    help = 'Seeds initial departments'

    def handle(self, *args, **kwargs):
        departments = [
            {'name': 'Human Resources', 'code': 'HR'},
            {'name': 'Finance', 'code': 'FIN'},
            {'name': 'Audit', 'code': 'AUD'},
        ]

        for dept_data in departments:
            dept, created = Department.objects.get_or_create(
                code=dept_data['code'],
                defaults={'name': dept_data['name']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created department: {dept.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Department already exists: {dept.name}"))
