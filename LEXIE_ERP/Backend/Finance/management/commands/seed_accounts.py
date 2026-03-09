from django.core.management.base import BaseCommand
from Finance.models import Account

class Command(BaseCommand):
    help = 'Seeds initial finance accounts'

    def handle(self, *args, **kwargs):
        accounts = [
            {'code': '5210', 'name': 'Salary Expense', 'type': 'EXPENSE'},
            {'code': '2110', 'name': 'PAYE Payable', 'type': 'LIABILITY'},
            {'code': '2120', 'name': 'NSSF Payable', 'type': 'LIABILITY'},
            {'code': '2130', 'name': 'SHA Payable', 'type': 'LIABILITY'},
            {'code': '1120', 'name': 'Bank Account', 'type': 'ASSET'},
        ]

        for acc_data in accounts:
            acc, created = Account.objects.get_or_create(
                code=acc_data['code'],
                defaults={'name': acc_data['name'], 'type': acc_data['type']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created account: {acc.code} - {acc.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Account already exists: {acc.code} - {acc.name}"))
