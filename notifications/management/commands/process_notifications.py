from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Retry failed notifications'

    def handle(self, *args, **options):
        # Find notifications that failed or are pending and have retries left (e.g., max 3)
        # For simplicity, we'll just look for FAILED ones with retry_count < 3
        failed_notifications = Notification.objects.filter(status='FAILED', retry_count__lt=3)
        
        self.stdout.write(f"Found {failed_notifications.count()} failed notifications to retry.")

        for notification in failed_notifications:
            try:
                if notification.recipient.email:
                    send_mail(
                        subject=f"[LEXIE ERP] {notification.title}",
                        message=notification.body,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[notification.recipient.email],
                        fail_silently=False,
                    )
                    notification.status = 'SENT'
                    notification.error_message = None
                    notification.save()
                    self.stdout.write(self.style.SUCCESS(f"Successfully resent notification {notification.id}"))
                else:
                    self.stdout.write(self.style.WARNING(f"Skipping notification {notification.id}: No email address"))
            
            except Exception as e:
                notification.retry_count += 1
                notification.error_message = str(e)
                notification.save()
                self.stdout.write(self.style.ERROR(f"Failed to resend notification {notification.id}: {e}"))
