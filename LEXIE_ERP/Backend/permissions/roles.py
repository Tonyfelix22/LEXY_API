# permissions/roles.py

from rest_framework.permissions import BasePermission

class RolePermission(BasePermission):
    """
    Base class for module-based role permissions.
    Each module permission extends this and defines:
        allowed_roles = ["role1", "role2"]
    """

    allowed_roles: list[str] = []

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # Superusers have global access
        if user.is_superuser:
            return True

        # Check if user has a profile and a role
        if not hasattr(user, "profile") or not user.profile.role:
            return False

        return user.profile.role in self.allowed_roles
