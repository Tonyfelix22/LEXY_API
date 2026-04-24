from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.core.mail import send_mail, EmailMultiAlternatives
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


from .serializers import UserSerializer, UserProfileSerializer, RegisterSerializer
from .models import UserProfile


# -------------------------------------------------------------------------
#  Utility function to get or create a user profile
# -------------------------------------------------------------------------
def get_or_create_user_profile(user, role=None, department=None):
    """Ensures a UserProfile always exists for a given user.

    Superusers are always mapped to ADMIN role for consistent frontend checks
    and backend authorization.
    """
    # If superuser, force ADMIN role regardless of provided role
    if getattr(user, 'is_superuser', False):
        role = "ADMIN"

    # If role is provided, normalize it. If not, don't default yet unless creating.
    role_upper = role.upper() if role else None

    # Get or create
    # If creating, we need a default role if none provided. Let's default to STAFF for new profiles.
    defaults = {
        "role": role_upper if role_upper else "STAFF", 
        "department": department
    }
    
    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults=defaults
    )

    # Update role and department if profile already exists and values are provided
    # Ensure superuser's profile is ADMIN even if it existed before
    changed = False
    
    # Only update role if a specific role was requested (and it's different)
    # OR if it's a superuser (already handled by setting role="ADMIN" above)
    if role_upper and profile.role != role_upper:
        profile.role = role_upper
        changed = True
        
    if department and profile.department != department:
        profile.department = department
        changed = True
        
    if changed:
        profile.save()

    return profile


# -------------------------------------------------------------------------
#  List all users — Authenticated
# -------------------------------------------------------------------------
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


# -------------------------------------------------------------------------
#  Retrieve or update a specific user (by ID)
# -------------------------------------------------------------------------
class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


# -------------------------------------------------------------------------
#  Retrieve or update the currently logged-in user's profile
# -------------------------------------------------------------------------
class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        return get_or_create_user_profile(user)


# -------------------------------------------------------------------------
#  Return authenticated user info (for frontend)
# -------------------------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    profile = get_or_create_user_profile(user)
    
    # Try to get employee profile for additional information
    employee = getattr(user, 'employee_profile', None)
    employee_data = None
    if employee:
        employee_data = {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "staff_number": employee.staff_number,
            "department": employee.department.name if employee.department else None,
        }

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "groups": [g.name for g in user.groups.all()],
        "role": profile.role,
        "department": employee.department.name if employee and employee.department else profile.department,
        "is_superuser": user.is_superuser,
        "employee": employee_data,
    })


# -------------------------------------------------------------------------
#  Register new user
# -------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    """
    Registers a new user.
    - Super Admin can register HR, FINANCE, AUDIT admins.
    - HR Admin can register STAFF/EMPLOYEES.
    - Public/Self-registration defaults to STAFF (if allowed).
    """
    # 1. Validate permissions for specific roles
    frontend_role = request.data.get("role", "employee").lower()
    
    # Map frontend roles to backend roles
    role_mapping = {
        "employee": "STAFF",
        "staff": "STAFF",
        "hr": "HR",
        "finance": "FINANCE",
        "audit": "AUDIT",
        "admin": "ADMIN",
        "administrator": "ADMIN",
        "manager": "MANAGER",
    }
    backend_role = role_mapping.get(frontend_role, "STAFF")

    # Permission Checks
    # Permission Checks
    if backend_role in ["HR", "FINANCE", "AUDIT", "ADMIN"]:
        # Only Super Admin can create these roles
        if not request.user.is_authenticated or not request.user.is_superuser:
             return Response(
                {"message": "Only Super Admins can register HR, Finance, or Audit Admins."},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # HR Admin creating Employees
    if backend_role == "STAFF":
         if not request.user.is_authenticated:
             # If public registration is disabled, uncomment below:
             # return Response({"message": "Authentication required."}, status=status.HTTP_403_FORBIDDEN)
             pass 
         else:
             # If authenticated, MUST be HR Admin
             # Super Admin is explicitly NOT allowed to create STAFF (Employees)
             is_hr = request.user.profile.role == 'HR' or request.user.groups.filter(name='HR').exists()
             
             if not is_hr:
                 return Response(
                    {"message": "Only HR Admins can register new employees."},
                    status=status.HTTP_403_FORBIDDEN
                )

    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    # Auto-assign department based on role if not provided
    department = request.data.get("department")
    if not department:
        department_mapping = {
            "hr": "Human Resources",
            "finance": "Finance",
            "audit": "Audit Department",
            "admin": "Administration",
            "manager": "Management",
        }
        department = department_mapping.get(frontend_role)

    user = serializer.save()
    
    # Create or update profile with role and department
    profile = get_or_create_user_profile(user, backend_role, department)
    
    token, _ = Token.objects.get_or_create(user=user)

    # If the creator is logged in (e.g. Super Admin creating another Admin), 
    # we might not want to return the *new user's* token for auto-login, 
    # or the frontend should handle it. 
    # Standard behavior is to return the new user's info.
    
    return Response({
        "success": True,
        "message": "Registration successful.",
        "token": token.key,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": profile.role,
            "department": profile.department,
            "groups": [g.name for g in user.groups.all()],
            "is_superuser": user.is_superuser,
        },
    }, status=status.HTTP_201_CREATED)


# -------------------------------------------------------------------------
#  Login user and return token
# -------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    """
    Authenticates user credentials and returns their token.
    """
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"message": "Username and password are required."},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({"message": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.is_active:
        return Response({"message": "This account is inactive. Contact admin."},
                        status=status.HTTP_403_FORBIDDEN)

    try:
        token, _ = Token.objects.get_or_create(user=user)
        profile = get_or_create_user_profile(user)
        employee = getattr(user, 'employee_profile', None)
        department_name = employee.department.name if employee and employee.department else profile.department
    except Exception:
        return Response(
            {
                "success": False,
                "message": "Login failed due to a server configuration/database error. Try again in a moment.",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response({
        "success": True,
        "message": "Login successful.",
        "token": token.key,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": profile.role,
            "department": department_name,
            "groups": [g.name for g in user.groups.all()],
            "is_superuser": user.is_superuser,
        },
    }, status=status.HTTP_200_OK)


# -------------------------------------------------------------------------
#  Logout user by deleting their token
# -------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """
    Logs out the authenticated user by deleting their token.
    """
    try:
        request.user.auth_token.delete()
        return Response({"success": True, "message": "Logged out successfully."},
                        status=status.HTTP_200_OK)
    except Exception:
        return Response({"success": False, "message": "Logout failed or token not found."},
                        status=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------------------------------
#  Password Reset
# -------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    user_email = request.data.get("email")
    if not user_email:
        return Response({"message": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=user_email)
    except User.DoesNotExist:
        # For security, don't reveal that the user doesn't exist
        return Response({"message": "If an account exists, a reset link has been sent."}, status=status.HTTP_200_OK)

    token_generator = PasswordResetTokenGenerator()
    token = token_generator.make_token(user)

    # Build frontend reset link using configured FRONTEND_URL
    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
    reset_link = f"{frontend_url}/reset-password?uid={user.id}&token={token}"

    # Render email templates
    context = {
        'user': user,
        'reset_link': reset_link,
    }
    html_content = render_to_string('users/password_reset_email.html', context)
    text_content = render_to_string('users/password_reset_email.txt', context)

    # Send email with both HTML and plain text
    try:
        email_message = EmailMultiAlternatives(
            subject="Password Reset Request - LEXIE ERP",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user_email],
        )
        email_message.attach_alternative(html_content, "text/html")
        email_message.send(fail_silently=False)
    except Exception as e:
        print(f"Error sending email: {e}")
        return Response({"message": "Failed to send reset email. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"message": "If an account exists, a reset link has been sent."}, status=status.HTTP_200_OK)


# -------------------------------------------------------------------------
#  Password Reset Confirm
# -------------------------------------------------------------------------
@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    """
    Validates the token and updates the user's password.
    Expected payload:
    {
        "uid": "...",
        "token": "...",
        "new_password": "..."
    }
    """
    uid = request.data.get("uid")
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not uid or not token or not new_password:
        return Response({"message": "UID, token, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and PasswordResetTokenGenerator().check_token(user, token):
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
    else:
        return Response({"message": "Invalid token or user ID."}, status=status.HTTP_400_BAD_REQUEST)
