from typing import Dict, Any, List
from .base import ReportStrategy
from audit.models import AuditLog

class AuditLogReport(ReportStrategy):
    def get_name(self) -> str:
        return "audit_log"

    def get_display_name(self) -> str:
        return "Audit Log"

    def get_category(self) -> str:
        return "AUDIT"

    def get_parameters(self) -> List[Dict[str, Any]]:
        return [
            {"name": "start_date", "type": "date", "label": "Start Date", "required": True},
            {"name": "end_date", "type": "date", "label": "End Date", "required": True},
            {"name": "module", "type": "select", "label": "Module", "options": [
                {"value": "HR", "label": "HR"},
                {"value": "FINANCE", "label": "Finance"},
                {"value": "ALL", "label": "All"}
            ], "required": False, "default": "ALL"}
        ]

    def generate_data(self, params: Dict[str, Any]) -> Any:
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        module = params.get("module")

        logs = AuditLog.objects.filter(timestamp__date__range=[start_date, end_date])

        if module and module != "ALL":
            logs = logs.filter(module=module)

        data = []
        for log in logs:
            data.append({
                "timestamp": log.timestamp.isoformat(),
                "module": log.module,
                "action": log.action_type,
                "description": log.description,
                "performed_by": log.performed_by.username if log.performed_by else "System"
            })

        return data
