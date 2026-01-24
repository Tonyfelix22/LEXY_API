from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.utils import timezone
from .models import UserProfile
from hr.models import Employee
import random


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    # Ensure profile exists
    profile, _ = UserProfile.objects.get_or_create(user=instance)

    # Auto-provision/link Employee profile on first creation
    if created:
        # If an Employee already exists with the same email, link it
        if instance.email:
            try:
                emp = Employee.objects.get(email=instance.email)
                if emp.user is None:
                    emp.user = instance
                    emp.save()
                    return
            except Employee.DoesNotExist:
                pass

        # Otherwise create a minimal Employee record (employment_type INTERN bypasses strict fields)
        first = instance.first_name or 'First'
        last = instance.last_name or 'Last'
        email = instance.email or f'user{instance.id}@example.local'

        # Generate unique staff number
        base = f'EMP-{instance.id}-{random.randint(1000, 9999)}'
        staff_number = base
        while Employee.objects.filter(staff_number=staff_number).exists():
            staff_number = f'{base}{random.randint(0,9)}'

        national_id = f'NID{instance.id}{random.randint(1000, 9999)}'

        Employee.objects.create(
            staff_number=staff_number,
            first_name=first,
            last_name=last,
            email=email,
            phone='',
            national_id=national_id,
            user=instance,
            department=None,
            job_title='Staff',
            employment_type='INTERN',
            hire_date=timezone.now().date(),
            end_date=None,
            basic_salary=0,
            kra_pin='',
            nssf_number='',
            SHA_number='',
            status='ACTIVE',
        )
    else:
        # Keep profile updated on user save
        profile.save()
