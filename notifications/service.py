from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, NotificationPreference
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_notification(user, notification_type, title, body, related_link=None):
        """
        Main entry point to send a notification.
        Checks user preferences before sending.
        """
        # Get or create default preferences
        pref, created = NotificationPreference.objects.get_or_create(
            user=user, 
            notification_type=notification_type,
            defaults={'email_enabled': True, 'system_enabled': True}
        )

        # Create system notification if enabled
        if pref.system_enabled:
            Notification.objects.create(
                recipient=user,
                notification_type=notification_type,
                title=title,
                body=body,
                status='PENDING',
                related_link=related_link
            )

        # Send email if enabled
        if pref.email_enabled and user.email:
            try:
                send_mail(
                    subject=f"[LEXIE ERP] {title}",
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                # If we created a notification record, mark it as SENT (email sent)
                # Note: This logic simplifies things. Ideally, we track email status separately or use the same record.
                # For now, we'll assume the Notification record tracks the *overall* status.
                Notification.objects.filter(recipient=user, title=title, status='PENDING').update(status='SENT')
                
            except Exception as e:
                logger.error(f"Failed to send email to {user.email}: {e}")
                # Mark as FAILED if it exists
                Notification.objects.filter(recipient=user, title=title, status='PENDING').update(
                    status='FAILED', 
                    error_message=str(e)
                )
