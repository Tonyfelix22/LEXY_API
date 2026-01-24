# users/permissions.py

from rest_framework.permissions import BasePermission

class SuperuserGlobalAccess(BasePermission):
    """
    Superusers bypass all permissions.
    All other users fall through to the next permission class.
    """

    def has_permission(self, request, view):
        user = request.user
        if user and user.is_authenticated and user.is_superuser:
            return True

        # allow pipeline to continue to next permission class
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user and user.is_authenticated and user.is_superuser:
            return True

        return True
