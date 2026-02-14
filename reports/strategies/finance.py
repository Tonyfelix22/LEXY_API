from typing import Dict, Any, List
from django.db.models import Sum
from .base import ReportStrategy
from Finance.models import Account, JournalLine
from django.utils import timezone
from datetime import datetime

class BalanceSheetReport(ReportStrategy):
    def get_name(self) -> str:
        return "balance_sheet"

    def get_display_name(self) -> str:
        return "Balance Sheet"

    def get_category(self) -> str:
        return "FINANCE"

    def get_parameters(self) -> List[Dict[str, Any]]:
        return [
            {"name": "as_of_date", "type": "date", "label": "As of Date", "required": True, "default": timezone.now().date().isoformat()}
        ]

    def generate_data(self, params: Dict[str, Any]) -> Any:
        as_of_date = params.get("as_of_date")
        
        # Assets
        assets = Account.objects.filter(type='ASSET')
        asset_data = []
        total_assets = 0
        for account in assets:
            balance = JournalLine.objects.filter(
                account=account, 
                entry__date__lte=as_of_date
            ).aggregate(
                balance=Sum('debit') - Sum('credit')
            )['balance'] or 0
            asset_data.append({"code": account.code, "name": account.name, "balance": float(balance)})
            total_assets += balance

        # Liabilities
        liabilities = Account.objects.filter(type='LIABILITY')
        liability_data = []
        total_liabilities = 0
        for account in liabilities:
            balance = JournalLine.objects.filter(
                account=account, 
                entry__date__lte=as_of_date
            ).aggregate(
                balance=Sum('credit') - Sum('debit')
            )['balance'] or 0
            liability_data.append({"code": account.code, "name": account.name, "balance": float(balance)})
            total_liabilities += balance

        # Equity
        equity = Account.objects.filter(type='EQUITY')
        equity_data = []
        total_equity = 0
        for account in equity:
            balance = JournalLine.objects.filter(
                account=account, 
                entry__date__lte=as_of_date
            ).aggregate(
                balance=Sum('credit') - Sum('debit')
            )['balance'] or 0
            equity_data.append({"code": account.code, "name": account.name, "balance": float(balance)})
            total_equity += balance

        return {
            "assets": asset_data,
            "total_assets": float(total_assets),
            "liabilities": liability_data,
            "total_liabilities": float(total_liabilities),
            "equity": equity_data,
            "total_equity": float(total_equity),
            "check": float(total_assets) == float(total_liabilities + total_equity)
        }

class IncomeStatementReport(ReportStrategy):
    def get_name(self) -> str:
        return "income_statement"

    def get_display_name(self) -> str:
        return "Income Statement"

    def get_category(self) -> str:
        return "FINANCE"

    def get_parameters(self) -> List[Dict[str, Any]]:
        return [
            {"name": "start_date", "type": "date", "label": "Start Date", "required": True},
            {"name": "end_date", "type": "date", "label": "End Date", "required": True, "default": timezone.now().date().isoformat()}
        ]

    def generate_data(self, params: Dict[str, Any]) -> Any:
        start_date = params.get("start_date")
        end_date = params.get("end_date")

        # Income
        income = Account.objects.filter(type='INCOME')
        income_data = []
        total_income = 0
        for account in income:
            balance = JournalLine.objects.filter(
                account=account, 
                entry__date__range=[start_date, end_date]
            ).aggregate(
                balance=Sum('credit') - Sum('debit')
            )['balance'] or 0
            income_data.append({"code": account.code, "name": account.name, "balance": float(balance)})
            total_income += balance

        # Expenses
        expenses = Account.objects.filter(type='EXPENSE')
        expense_data = []
        total_expenses = 0
        for account in expenses:
            balance = JournalLine.objects.filter(
                account=account, 
                entry__date__range=[start_date, end_date]
            ).aggregate(
                balance=Sum('debit') - Sum('credit')
            )['balance'] or 0
            expense_data.append({"code": account.code, "name": account.name, "balance": float(balance)})
            total_expenses += balance

        net_income = total_income - total_expenses

        return {
            "income": income_data,
            "total_income": float(total_income),
            "expenses": expense_data,
            "total_expenses": float(total_expenses),
            "net_income": float(net_income)
        }
