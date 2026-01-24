from rest_framework.permissions import BasePermission

# =====================================================
# GENERIC ROLE CHECK HELPER
# =====================================================
def _get_user_role(user):
    """Safely resolve the user's role string from the linked profile or a direct attr.
    Returns an upper-cased role value or None.
    """
    # Prefer profile.role if the project uses a UserProfile relation
    try:
        profile = getattr(user, 'profile', None)
        role = getattr(profile, 'role', None)
        if role:
            return str(role).upper()
    except Exception:
        pass

    # Fallback to a direct user.role attribute if present
    role = getattr(user, 'role', None)
    return str(role).upper() if role else None


def has_role(user, roles):
    """
    Check if the user has any of the roles listed.
    - Requires an authenticated user
    - Superusers are always allowed
    - Reads role from user.profile.role or user.role
    """
    if not getattr(user, 'is_authenticated', False):
        return False

    # Superuser bypass: full access
    if getattr(user, 'is_superuser', False):
        return True

    user_role = _get_user_role(user)
    target_roles = {r.upper() for r in roles}
    return bool(user_role and user_role in target_roles)


# =====================================================
# DEPARTMENT PERMISSIONS
# =====================================================
class HRDepartmentAccess(BasePermission):
    """
    Access control for Department viewset.
    Only HR and Admin roles can access.
    """
    def has_permission(self, request, view):
        return has_role(request.user, ['HR', 'ADMIN'])


# =====================================================
# EMPLOYEE PERMISSIONS
# =====================================================
class HREmployeeAccess(BasePermission):
    """
    Access control for Employee viewset.
    Only HR and Admin roles can access.
    """
    def has_permission(self, request, view):
        return has_role(request.user, ['HR', 'ADMIN'])


# =====================================================
# EMPLOYMENT HISTORY PERMISSIONS
# =====================================================
class HREmploymentHistoryAccess(BasePermission):
    """
    Access control for EmploymentHistory viewset.
    Only HR and Admin roles can access.
    """
    def has_permission(self, request, view):
        return has_role(request.user, ['HR', 'ADMIN'])


# =====================================================
# PAYROLL RUN PERMISSIONS
# =====================================================
class HRPayrollRunAccess(BasePermission):
    """
    Access control for PayrollRun viewset.
    HR, Admin, and Finance roles allowed.
    """
    def has_permission(self, request, view):
        return has_role(request.user, ['HR', 'ADMIN', 'FINANCE'])


# =====================================================
# PAYROLL DEDUCTION PERMISSIONS
# =====================================================
class HRPayrollDeductionAccess(BasePermission):
    """
    Access control for PayrollDeduction viewset.
    HR and Admin roles allowed.
    """
    def has_permission(self, request, view):
        return has_role(request.user, ['HR', 'ADMIN'])
