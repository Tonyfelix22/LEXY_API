from permissions.roles import RolePermission

class IsFinanceOrAdmin(RolePermission):
    """
    Allows access only to FINANCE and ADMIN roles, or any employee within the Finance department.
    """
    allowed_roles = ['FINANCE', 'ADMIN']

    def has_permission(self, request, view):
        # First check standard superuser/role permissions
        if super().has_permission(request, view):
            return True
            
        user = request.user
        if not user or not user.is_authenticated:
            return False
            
        # Check if the user's legacy UserProfile indicates Finance
        if hasattr(user, "profile") and user.profile.department and 'finance' in user.profile.department.lower():
            return True
            
        # Check if the user's actual Employee record is in the Finance department
        if hasattr(user, "employee_profile") and user.employee_profile and user.employee_profile.department:
            if 'finance' in user.employee_profile.department.name.lower():
                return True
                
        return False
