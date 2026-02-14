from permissions.roles import RolePermission

class IsFinanceOrAdmin(RolePermission):
    """
    Allows access only to FINANCE and ADMIN roles.
    """
    allowed_roles = ['FINANCE', 'ADMIN']
