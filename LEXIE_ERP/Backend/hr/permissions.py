from rest_framework import permissions

class IsFinanceAdmin(permissions.BasePermission):
    """
    Allows only Finance Admin users to approve or post payroll.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Superusers and users with FINANCE role can do everything in this viewset
        if user.is_superuser or (hasattr(user, 'profile') and user.profile.role == 'FINANCE'):
            return True

        # For other users (regular employees, HR, etc.), only allow listing/retrieving their own records
        # The queryset filtering will happen in the viewset's get_queryset method.
        if view.action in ['list', 'retrieve']:
            return True
            
        return False
