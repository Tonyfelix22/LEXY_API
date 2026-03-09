# users/utils.py
from rest_framework.response import Response
from rest_framework import status
from functools import wraps
from typing import Callable, Iterable


def role_required(allowed_roles: Iterable[str]) -> Callable:
    """
    Decorator to restrict view access based on user role.

    Works for both function-based views and DRF class-based views/viewsets.
    If decorating a method on a class-based view, the first arg is `self` and
    the request is available as `self.request`.
    """

    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            # Support both function views (request is first arg)
            # and method views (self, request, ...)
            if args and hasattr(args[0], 'request'):
                # Method on a class-based view
                self = args[0]
                request = self.request
                remaining_args = args
            else:
                # Function-based view
                request = args[0]
                remaining_args = args

            user = getattr(request, 'user', None)
            if not user or not getattr(user, 'is_authenticated', False):
                return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

            # Ensure profile exists
            profile = getattr(user, 'profile', None)
            if profile is None:
                return Response({'detail': 'User profile not found.'}, status=status.HTTP_403_FORBIDDEN)

            role = getattr(profile, 'role', None)
            if role not in allowed_roles:
                return Response({'detail': f'Access denied for role: {role}'}, status=status.HTTP_403_FORBIDDEN)

            return view_func(*remaining_args, **kwargs)

        return wrapper

    return decorator
