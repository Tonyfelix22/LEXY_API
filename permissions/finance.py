# permissions/finance.py

from .roles import RolePermission

class FinancePermission(RolePermission):
    allowed_roles = ["finance", "finance_manager", "admin"]
