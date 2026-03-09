from django.db.models.signals import post_save
from django.dispatch import receiver
from hr.models import PayrollRun, LeaveRequest
from .service import NotificationService

@receiver(post_save, sender=PayrollRun)
def payroll_notification(sender, instance, created, **kwargs):
    if instance.status == 'APPROVED':
        # Notify Finance Admins (assuming we have a way to find them, or just the person who needs to post it)
        # For MVP, we'll notify the user who created it or a specific role if we had group logic here.
        # Let's notify the employee that their payroll is approved.
        NotificationService.send_notification(
            user=instance.employee.user, # Assuming Employee has a user link
            notification_type='PAYROLL_APPROVAL',
            title='Payroll Approved',
            body=f"Your payroll for {instance.period_start} to {instance.period_end} has been approved.",
            related_link=f"/dashboard/hr/payroll_runs/{instance.id}"
        )

@receiver(post_save, sender=LeaveRequest)
def leave_notification(sender, instance, created, **kwargs):
    if instance.status in ['APPROVED', 'REJECTED']:
        NotificationService.send_notification(
            user=instance.employee.user,
            notification_type='LEAVE_REQUEST',
            title=f'Leave Request {instance.status.title()}',
            body=f"Your leave request from {instance.start_date} to {instance.end_date} has been {instance.status.lower()}.",
            related_link="/dashboard/leave"
        )
