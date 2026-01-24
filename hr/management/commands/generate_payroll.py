from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime
from dateutil.relativedelta import relativedelta
from hr.models import PayrollRun, Employee
from decimal import Decimal, ROUND_HALF_UP


class Command(BaseCommand):
    help = 'Automatically generate and calculate payroll for all active employees.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--period',
            type=str,
            default='monthly',
            help='Payroll period: monthly, bi-weekly, or weekly.'
        )
        parser.add_argument(
            '--date',
            type=str,
            default=None,
            help='Reference date for payroll period (e.g., 2025-09-30). Defaults to today.'
        )
        parser.add_argument(
            '--reprocess',
            action='store_true',
            help='Reprocess existing payrolls for the given period (overwrite calculations).'
        )

    def handle(self, *args, **options):
        """
        Entry point for payroll generation.
        Determines payroll period, loops through active employees,
        and generates payroll with proper decimal rounding.
        """
        period = options['period'].lower()
        valid_periods = ['monthly', 'bi-weekly', 'weekly']
        if period not in valid_periods:
            self.stdout.write(self.style.ERROR(f"Invalid period: {period}. Must be one of {valid_periods}."))
            return

        # Determine the reference date
        ref_date = (
            datetime.strptime(options['date'], '%Y-%m-%d').date()
            if options['date']
            else timezone.now().date()
        )

        # Compute payroll start/end dates
        if period == 'monthly':
            start_date = ref_date.replace(day=1)
            end_date = (start_date + relativedelta(months=1)) - timedelta(days=1)
        elif period == 'bi-weekly':
            start_date = ref_date - timedelta(days=ref_date.weekday())
            end_date = start_date + timedelta(days=13)
        else:  # weekly
            start_date = ref_date - timedelta(days=ref_date.weekday())
            end_date = start_date + timedelta(days=6)

        self.stdout.write(self.style.NOTICE(
            f"Generating {period} payroll from {start_date} to {end_date}"
        ))

        reprocess = options['reprocess']
        employees = Employee.objects.filter(status='ACTIVE')

        if not employees.exists():
            self.stdout.write(self.style.WARNING("No active employees found."))
            return

        created, calculated, skipped = 0, 0, 0

        for emp in employees:
            try:
                existing = PayrollRun.objects.filter(
                    employee=emp,
                    period_start__lte=end_date,
                    period_end__gte=start_date
                ).first()

                if existing and not reprocess:
                    skipped += 1
                    continue

                # Create new or reuse existing payroll
                if existing and reprocess:
                    payroll = existing
                else:
                    payroll = PayrollRun(
                        employee=emp,
                        period_start=start_date,
                        period_end=end_date,
                        pay_date=end_date,
                        basic_salary=emp.basic_salary,
                    )
                    created += 1

                # Perform calculation
                self.calculate_payroll(payroll)
                calculated += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"❌ Failed for {emp.staff_number} ({emp.get_full_name()}): {e}"
                ))

        self.stdout.write(self.style.SUCCESS(
            f"✅ Payroll complete: {created} created, {calculated} calculated, {skipped} skipped."
        ))

    # --------------------------------------------------------------------------
    # Payroll calculation logic (precision-safe)
    # --------------------------------------------------------------------------
    def calculate_payroll(self, payroll):
        """
        Calculates all payroll components before saving.
        Enforces 2-decimal precision for all money fields.
        """
        TWO_PLACES = Decimal('0.01')

        # --- Step 1: Base Components ---
        basic = Decimal(payroll.basic_salary or 0).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        allowances = Decimal('0.00').quantize(TWO_PLACES)
        overtime = Decimal('0.00').quantize(TWO_PLACES)

        # --- Step 2: Deductions (dummy logic; replace with real formulas) ---
        paye_tax = (basic * Decimal('0.10')).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)  # 10% tax
        nssf = Decimal('200.00').quantize(TWO_PLACES)
        sha = Decimal('500.00').quantize(TWO_PLACES)
        other_deductions = Decimal('0.00').quantize(TWO_PLACES)

        # --- Step 3: Totals ---
        gross_salary = (basic + allowances + overtime).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        total_deductions = (paye_tax + nssf + sha + other_deductions).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        net_salary = (gross_salary - total_deductions).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

        # --- Step 4: Populate PayrollRun fields ---
        payroll.allowances = allowances
        payroll.overtime = overtime
        payroll.paye_tax = paye_tax
        payroll.nssf_deduction = nssf
        payroll.sha_deduction = sha
        payroll.other_deductions = other_deductions
        payroll.total_deductions = total_deductions
        payroll.gross_salary = gross_salary
        payroll.net_salary = net_salary
        payroll.status = 'CALCULATED'

        # --- Step 5: Save payroll safely ---
        payroll.save()
