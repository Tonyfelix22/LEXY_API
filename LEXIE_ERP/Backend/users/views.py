from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.conf import settings


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
#  List all users — Admin only
# -------------------------------------------------------------------------
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


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
        "department": profile.department,
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
            "department": profile.department,
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
    email = request.data.get("email")
    if not email:
        return Response({"message": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # For security, don't reveal that the user doesn't exist
        return Response({"message": "If an account exists, a reset link has been sent."}, status=status.HTTP_200_OK)

    token_generator = PasswordResetTokenGenerator()
    token = token_generator.make_token(user)
    
    # In a real app, this would link to the frontend reset page with uid and token
    # For now, we'll just send a simple message or link to the reset page
    # Assuming frontend route: /reset-password/{uid}/{token}
    reset_link = f"http://localhost:3000/reset-password?uid={user.id}&token={token}"
    
    try:
        send_mail(
            subject="Password Reset Request",
            message=f"Click the link to reset your password: {reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"Error sending email: {e}")

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
