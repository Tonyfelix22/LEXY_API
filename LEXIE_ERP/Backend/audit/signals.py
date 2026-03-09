from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.forms.models import model_to_dict
from .models import AuditLog
from .utils import get_current_user
import json
import datetime
from decimal import Decimal

# List of models to audit
# Format: 'app_label.ModelName'
AUDITED_MODELS = [
    'hr.Employee',
    'hr.Department',
    'hr.PayrollRun',
    'hr.LeaveRequest',
    'hr.EmploymentHistory',
    'hr.TravelRequest',
    'hr.Applicant',
    'finance.JournalEntry',
    'finance.Budget',
    'finance.Account',
    'finance.Invoice',
    'finance.Payment',
    'finance.BankStatement',
]

def get_module_for_model(instance):
    """
    Determine the module based on the model's app label.
    """
    app_label = instance._meta.app_label
    if app_label == 'hr':
        return 'HR'
    elif app_label.lower() == 'finance':
        return 'FINANCE'
    elif app_label == 'audit':
        return 'AUDIT'
    return 'SYSTEM'

class JsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)

def create_audit_log(instance, action, changes=None, details=None):
    """
    Helper to create an AuditLog entry.
    """
    user = get_current_user()
    module = get_module_for_model(instance)
    model_name = instance._meta.object_name
    object_id = str(instance.pk)
    
    description = f"{action} {instance._meta.verbose_name} {instance}"
    if details:
        description += f" | {details}"

    changes_json = None
    if changes:
        try:
            changes_json = json.dumps(changes, cls=JsonEncoder, indent=2)
        except Exception:
            changes_json = str(changes)

    AuditLog.objects.create(
        module=module,
        model_name=model_name,
        action_type=action,
        object_id=object_id,
        changes=changes_json, 
        description=description,
        performed_by=user
    )

@receiver(pre_save)
def audit_pre_save(sender, instance, **kwargs):
    """
    Capture the old state of the model before saving.
    """
    model_label = f"{instance._meta.app_label}.{instance._meta.object_name}"
    if model_label not in AUDITED_MODELS:
        return

    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            # Store a dict of the old state
            instance._old_state = model_to_dict(old_instance)
        except sender.DoesNotExist:
            instance._old_state = {}
    else:
        instance._old_state = {}

@receiver(post_save)
def audit_post_save(sender, instance, created, **kwargs):
    """
    Signal to log Create and Update operations with changes.
    """
    model_label = f"{instance._meta.app_label}.{instance._meta.object_name}"
    if model_label not in AUDITED_MODELS:
        return

    action = 'CREATE' if created else 'UPDATE'
    changes = {}

    if created:
        # records initial state
        try:
            changes = model_to_dict(instance)
        except Exception:
            changes = {"info": "Could not serialize new instance"}
    else:
        # Calculate diffs
        old_state = getattr(instance, '_old_state', {})
        new_state = model_to_dict(instance)
        
        for field, new_value in new_state.items():
            old_value = old_state.get(field)
            
            # Simple comparison
            if old_value != new_value:
                # Handle Decimal vs float mismatch or different types if needed
                # For now, strict equality check is okay for most fields
                changes[field] = {
                    'old': old_value,
                    'new': new_value
                }

    if created or changes:
        create_audit_log(instance, action, changes=changes)

@receiver(post_delete)
def audit_post_delete(sender, instance, **kwargs):
    """
    Signal to log Delete operations.
    """
    model_label = f"{instance._meta.app_label}.{instance._meta.object_name}"
    if model_label not in AUDITED_MODELS:
        return
    
    # Capture what was deleted
    try:
         details = model_to_dict(instance)
    except:
         details = str(instance)

    create_audit_log(instance, 'DELETE', changes=details)
