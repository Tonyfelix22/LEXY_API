from typing import Dict, Any, List
from django.db.models import Sum, Count
from .base import ReportStrategy
from hr.models import Employee, PayrollRun, Department
from django.utils import timezone

class EmployeeListReport(ReportStrategy):
    def get_name(self) -> str:
        return "employee_list"

    def get_display_name(self) -> str:
        return "Employee List"

    def get_category(self) -> str:
        return "HR"

    def get_parameters(self) -> List[Dict[str, Any]]:
        departments = Department.objects.all().values('id', 'name')
        dept_options = [{"value": d['id'], "label": d['name']} for d in departments]
        
        return [
            {"name": "department_id", "type": "select", "label": "Department", "options": dept_options, "required": False},
            {"name": "status", "type": "select", "label": "Status", "options": [
                {"value": "ACTIVE", "label": "Active"},
                {"value": "ON_LEAVE", "label": "On Leave"},
                {"value": "TERMINATED", "label": "Terminated"},
                {"value": "ALL", "label": "All"}
            ], "required": False, "default": "ACTIVE"}
        ]

    def generate_data(self, params: Dict[str, Any]) -> Any:
        department_id = params.get("department_id")
        status = params.get("status")

        employees = Employee.objects.all()

        if department_id:
            employees = employees.filter(department_id=department_id)
        
        if status and status != "ALL":
            employees = employees.filter(status=status)

        data = []
        for emp in employees:
            data.append({
                "staff_number": emp.staff_number,
                "name": emp.get_full_name(),
                "department": emp.department.name if emp.department else "N/A",
                "job_title": emp.job_title,
                "status": emp.status,
                "hire_date": emp.hire_date.isoformat()
            })
        
        return data

class PayrollSummaryReport(ReportStrategy):
    def get_name(self) -> str:
        return "payroll_summary"

    def get_display_name(self) -> str:
        return "Payroll Summary"

    def get_category(self) -> str:
        return "HR"

    def get_parameters(self) -> List[Dict[str, Any]]:
        return [
            {"name": "start_date", "type": "date", "label": "Start Date", "required": True},
            {"name": "end_date", "type": "date", "label": "End Date", "required": True}
        ]

    def generate_data(self, params: Dict[str, Any]) -> Any:
        start_date = params.get("start_date")
        end_date = params.get("end_date")

        payrolls = PayrollRun.objects.filter(period_end__range=[start_date, end_date])

        summary = payrolls.aggregate(
            total_gross=Sum('gross_salary'),
            total_net=Sum('net_salary'),
            total_paye=Sum('paye_tax'),
            total_nssf=Sum('nssf_deduction'),
            total_sha=Sum('sha_deduction'),
            count=Count('id')
        )

        # Breakdown by department
        dept_summary = payrolls.values('employee__department__name').annotate(
            total_gross=Sum('gross_salary'),
            count=Count('id')
        ).order_by('employee__department__name')

        return {
            "summary": {k: float(v or 0) for k, v in summary.items()},
            "department_breakdown": list(dept_summary)
        }
