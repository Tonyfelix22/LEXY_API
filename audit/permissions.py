from permissions.roles import RolePermission

class IsAuditOrAdmin(RolePermission):
    """
    Allows access only to AUDIT and ADMIN roles.
    """
    allowed_roles = ['AUDIT', 'ADMIN']
