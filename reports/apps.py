from django.apps import AppConfig

class ReportsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reports'

    def ready(self):
        from .registry import ReportRegistry
        from .strategies.finance import BalanceSheetReport, IncomeStatementReport
        from .strategies.hr import EmployeeListReport, PayrollSummaryReport
        from .strategies.audit import AuditLogReport

        ReportRegistry.register(BalanceSheetReport)
        ReportRegistry.register(IncomeStatementReport)
        ReportRegistry.register(EmployeeListReport)
        ReportRegistry.register(PayrollSummaryReport)
        ReportRegistry.register(AuditLogReport)
