from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from .utils import set_current_user, clear_current_user

class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to store the current user in thread-local storage.
    Supports both Session Auth (Django) and JWT Auth (DRF).
    """
    def process_request(self, request):
        user = getattr(request, 'user', None)

        # If standard Django auth didn't find a user, try JWT
        if not user or not user.is_authenticated:
            try:
                auth = JWTAuthentication()
                # authenticate() returns (user, token) or None
                auth_result = auth.authenticate(request)
                if auth_result:
                    user, _ = auth_result
                    request.user = user # Set on request for consistency
            except Exception:
                # Token might be invalid, expired, or missing
                pass

        if user and user.is_authenticated:
            set_current_user(user)
        else:
            set_current_user(None)

    def process_response(self, request, response):
        clear_current_user()
        return response

    def process_exception(self, request, exception):
        clear_current_user()
