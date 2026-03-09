# permissions/audit.py

from .roles import RolePermission

class AuditPermission(RolePermission):
    allowed_roles = ["audit", "audit_manager", "admin"]
