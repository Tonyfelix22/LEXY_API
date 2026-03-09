from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Deletes all non-superuser accounts'

    def handle(self, *args, **kwargs):
        users = User.objects.filter(is_superuser=False)
        count = users.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No non-superuser accounts found.'))
            return

        self.stdout.write(f'Found {count} non-superuser accounts. Deleting...')
        # Use delete() directly on the queryset
        deleted_count, _ = users.delete()
        
        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {deleted_count} users.'))
