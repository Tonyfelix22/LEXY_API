
import logging
import requests
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from hr.models import PayrollRun, Employee, LeaveType, LeaveBalance
from audit.models import AuditLog

logger = logging.getLogger(__name__)

# Removed hardcoded external audit URL

# ----------------------------------------------------------------------
# 🧾 AUTO POST TO FINANCE WHEN PAYROLL IS APPROVED (with Finance role enforcement)
# ----------------------------------------------------------------------
@receiver(post_save, sender=PayrollRun)
def auto_post_to_finance(sender, instance, created, **kwargs):
    """
    Automatically post PayrollRun to Finance when it is approved —
    but ONLY if approved by a Finance Admin role.
    Logs all success, failures, and unauthorized attempts to audit.
    """

    try:
        if instance.status == "APPROVED" and not instance.is_posted_to_finance:
            approved_by = (instance.approved_by or "").strip()

            # 🔐 Define authorized finance roles (adjust to your system)
            authorized_roles = ["FinanceAdmin", "Finance Manager", "Chief Accountant"]

            # 🚫 Reject if unauthorized user approved payroll
            if approved_by not in authorized_roles:
                logger.warning(
                    f"🚫 Unauthorized payroll posting blocked for PayrollRun {instance.id} — "
                    f"approver '{approved_by}' lacks finance role"
                )

                # Audit log for blocked action
                audit_data = {
                    "action": "SECURITY_ALERT",
                    "module": "Payroll",
                    "details": (
                        f"Unauthorized attempt to post PayrollRun {instance.id}. "
                        f"Approver '{approved_by}' not in authorized finance roles."
                    ),
                    "timestamp": timezone.now().isoformat(),
                    "user": approved_by or "System",
                }
                try:
                    AuditLog.objects.create(
                        module="Payroll",
                        action_type="SECURITY_ALERT",
                        description=audit_data["details"],
                        performed_by=None # Approver failed role check
                    )
                except Exception as audit_error:
                    logger.error(f"⚠️ Failed to log unauthorized attempt for PayrollRun {instance.id}: {audit_error}")
                return  # Stop here — not authorized

            # ✅ Authorized — post to Finance
            instance.post_to_finance(posted_by=approved_by)

            # 🧾 Audit log for successful posting
            audit_data = {
                "action": "UPDATE",
                "module": "Payroll",
                "details": (
                    f"PayrollRun {instance.id} successfully posted to Finance by {approved_by}. "
                    f"Period: {instance.period_start} → {instance.period_end}, "
                    f"Gross: {instance.gross_salary}"
                ),
                "timestamp": timezone.now().isoformat(),
                "user": approved_by,
            }

            try:
                AuditLog.objects.create(
                    module="Payroll",
                    action_type="UPDATE",
                    description=audit_data["details"],
                    performed_by=None # Add logic for user if possible
                )
                logger.info(f"✅ Audit log created for PayrollRun {instance.id}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to create audit log for PayrollRun {instance.id}: {e}")

    except Exception as e:
        logger.error(f"❌ Auto post to finance failed for PayrollRun {instance.id}: {e}")
        try:
            AuditLog.objects.create(
                module="Payroll",
                action_type="ERROR",
                description=f"Auto post to finance failed for PayrollRun {instance.id}: {str(e)}",
                performed_by=None
            )
        except Exception as audit_error:
            logger.error(f"❌ Failed to log audit error for PayrollRun {instance.id}: {audit_error}")


# ----------------------------------------------------------------------
# 👤 AUTO CREATE PAYROLL WHEN A NEW EMPLOYEE IS CREATED
# ----------------------------------------------------------------------
@receiver(post_save, sender=Employee)
def auto_create_payroll_for_new_employee(sender, instance, created, **kwargs):
    """
    Automatically creates a payroll record when an ACTIVE employee is added or updated.
    Checks if a payroll already exists for the current month.
    """
    if instance.status != "ACTIVE" or not instance.basic_salary or instance.basic_salary <= 0:
        return

    try:
        today = timezone.now().date()
        start_date = today.replace(day=1)
        end_date = (start_date + relativedelta(months=1)) - timedelta(days=1)

        # Check if payroll already exists for this period
        if PayrollRun.objects.filter(employee=instance, period_start=start_date, period_end=end_date).exists():
            return

        payroll = PayrollRun.objects.create(
            employee=instance,
            period_start=start_date,
            period_end=end_date,
            status="DRAFT",
            basic_salary=instance.basic_salary,
            allowances=0,
            overtime=0,
            gross_salary=instance.basic_salary,
            paye_tax=0,
            nssf_deduction=0,
            sha_deduction=0,
            other_deductions=0,
            total_deductions=0,
            net_salary=instance.basic_salary,
        )

        logger.info(f"✅ Payroll initialized for {instance.get_full_name()} (Employee ID {instance.id})")

        # 🧾 Send audit record for payroll creation
        audit_payload = {
            "action": "CREATE",
            "module": "Payroll",
            "details": (
                f"Auto-created payroll for {instance.get_full_name()} "
                f"(Employee ID {instance.id}) — Period {start_date} → {end_date}"
            ),
            "timestamp": timezone.now().isoformat(),
            "user": "System Auto",
        }

        try:
            AuditLog.objects.create(
                module="Payroll",
                action_type="CREATE",
                description=audit_payload["details"],
                performed_by=None
            )
            logger.info(f"✅ Audit log created for new payroll of {instance.get_full_name()}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to create audit log for {instance.get_full_name()}: {e}")

    except Exception as e:
        logger.error(f"❌ Auto payroll creation failed for {instance.get_full_name()}: {e}")

# ----------------------------------------------------------------------
# 🏝️ AUTO CREATE LEAVE BALANCES FOR NEW EMPLOYEE
# ----------------------------------------------------------------------
@receiver(post_save, sender=Employee)
def auto_create_leave_balances(sender, instance, created, **kwargs):
    """
    Automatically creates default LeaveBalance records for a new ACTIVE employee.
    Calculates prorated balance if necessary (basic implementation assigns full days for simplicity).
    """
    if not created or instance.status != "ACTIVE":
        return

    try:
        current_year = timezone.now().year
        leave_types = LeaveType.objects.all()

        for leave_type in leave_types:
            LeaveBalance.objects.get_or_create(
                employee=instance,
                leave_type=leave_type,
                year=current_year,
                defaults={
                    "balance": leave_type.days_per_year, # Assign full days for now
                    "used": 0
                }
            )
        
        logger.info(f"✅ Leave balances initialized for {instance.get_full_name()} (Employee ID {instance.id})")
        
        # 🧾 Send audit record for leave balance creation
        audit_payload = {
            "action": "CREATE",
            "module": "Leave",
            "details": (
                f"Auto-created leave balances for {instance.get_full_name()} "
                f"(Employee ID {instance.id}) — Year {current_year}"
            ),
            "timestamp": timezone.now().isoformat(),
            "user": "System Auto",
        }
        
        try:
            AuditLog.objects.create(
                module="Leave",
                action_type="CREATE",
                description=audit_payload["details"],
                performed_by=None
            )
        except Exception:
            pass # Fail silently for audit

    except Exception as e:
        logger.error(f"❌ Auto leave balance creation failed for {instance.get_full_name()}: {e}")
