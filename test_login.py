import os
import django
import sys

# Setup Django environment
sys.path.append(r'd:\pycharm\PythonProject\LEXIE_ERP\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LEXY_API.settings')
django.setup()

from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from users.views import get_or_create_user_profile
from django.contrib.auth.models import User

def test_login_logic():
    print("--- Testing Login Logic ---")
    
    # Try to find an existing user or create a test one
    username = "admin"
    password = "adminpassword" # This might not work if it's not the actual password
    
    print(f"Checking for user: {username}...")
    user = User.objects.filter(username=username).first()
    
    if not user:
        print(f"User {username} not found. Creating test user...")
        user = User.objects.create_superuser(username=username, email="admin@example.com", password=password)
        print("Test superuser created.")
    
    # Test authenticate
    print("Testing authenticate()...")
    # Note: authenticate() might fail in this script if passwords don't match, 
    # but we want to see if it RAISES an exception (which causes 500).
    try:
        auth_user = authenticate(username=username, password=password)
        print(f"Authenticate result: {'Success' if auth_user else 'Failed (Invalid credentials)'}")
    except Exception as e:
        print(f"ERROR in authenticate(): {e}")
        import traceback
        traceback.print_exc()

    # Test token generation
    print("Testing Token.objects.get_or_create()...")
    try:
        token, created = Token.objects.get_or_create(user=user)
        print(f"Token: {token.key} (Created: {created})")
    except Exception as e:
        print(f"ERROR in Token.objects.get_or_create(): {e}")
        import traceback
        traceback.print_exc()

    # Test profile generation
    print("Testing get_or_create_user_profile()...")
    try:
        profile = get_or_create_user_profile(user)
        print(f"Profile role: {profile.role}")
    except Exception as e:
        print(f"ERROR in get_or_create_user_profile(): {e}")
        import traceback
        traceback.print_exc()

    print("--- Login Logic Test Complete ---")

if __name__ == "__main__":
    test_login_logic()
