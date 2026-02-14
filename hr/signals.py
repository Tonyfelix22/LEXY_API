
import logging
import requests
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from hr.models import PayrollRun, Employee, LeaveType, LeaveBalance

logger = logging.getLogger(__name__)

AUDIT_LOG_URL = "http://192.168.0.113:8000/api/audit/auditlogs/"

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
                    requests.post(AUDIT_LOG_URL, json=audit_data, timeout=5)
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
                response = requests.post(AUDIT_LOG_URL, json=audit_data, timeout=5)
                if response.status_code in [200, 201]:
                    logger.info(f"✅ Audit log created for PayrollRun {instance.id}")
                else:
                    logger.warning(f"⚠️ Audit log failed ({response.status_code}) for PayrollRun {instance.id}")
            except requests.exceptions.RequestException as e:
                logger.warning(f"⚠️ Failed to send audit log for PayrollRun {instance.id}: {e}")

    except Exception as e:
        logger.error(f"❌ Auto post to finance failed for PayrollRun {instance.id}: {e}")
        try:
            error_audit_data = {
                "action": "ERROR",
                "module": "Payroll",
                "details": f"Auto post to finance failed for PayrollRun {instance.id}: {str(e)}",
                "timestamp": timezone.now().isoformat(),
                "user": "System",
            }
            requests.post(AUDIT_LOG_URL, json=error_audit_data, timeout=5)
        except Exception as audit_error:
            logger.error(f"❌ Failed to log audit error for PayrollRun {instance.id}: {audit_error}")


# ----------------------------------------------------------------------
# 👤 AUTO CREATE PAYROLL WHEN A NEW EMPLOYEE IS CREATED
# ----------------------------------------------------------------------
@receiver(post_save, sender=Employee)
def auto_create_payroll_for_new_employee(sender, instance, created, **kwargs):
    """
    Automatically creates a payroll record when a new ACTIVE employee is added.
    Prevents duplicate payrolls for the same period.
    """
    if not created or instance.status != "ACTIVE":
        return

    try:
        today = timezone.now().date()
        start_date = today.replace(day=1)
        end_date = (start_date + relativedelta(months=1)) - timedelta(days=1)

        payroll, created_payroll = PayrollRun.objects.get_or_create(
            employee=instance,
            period_start=start_date,
            period_end=end_date,
            defaults={
                "status": "DRAFT",
                "basic_salary": instance.basic_salary or 0,
                "allowances": 0,
                "overtime": 0,
                "gross_salary": instance.basic_salary or 0,
                "paye_tax": 0,
                "nssf_deduction": 0,
                "sha_deduction": 0,
                "other_deductions": 0,
                "total_deductions": 0,
                "net_salary": instance.basic_salary or 0,
            },
        )

        if created_payroll:
            logger.info(f"✅ Payroll initialized for {instance.get_full_name()} (Employee ID {instance.id})")
        else:
            logger.warning(f"⚠️ Payroll already exists for {instance.get_full_name()} (Employee ID {instance.id})")

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
            response = requests.post(AUDIT_LOG_URL, json=audit_payload, timeout=5)
            if response.status_code in [200, 201]:
                logger.info(f"✅ Audit log created for new payroll of {instance.get_full_name()}")
            else:
                logger.warning(f"⚠️ Audit log creation failed ({response.status_code}) for {instance.get_full_name()}")
        except requests.exceptions.RequestException as e:
            logger.warning(f"⚠️ Failed to send audit log for {instance.get_full_name()}: {e}")

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
            requests.post(AUDIT_LOG_URL, json=audit_payload, timeout=5)
        except Exception:
            pass # Fail silently for audit

    except Exception as e:
        logger.error(f"❌ Auto leave balance creation failed for {instance.get_full_name()}: {e}")
