import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LEXY_API.settings')
django.setup()

from django.contrib.auth.models import User

def list_users():
    print("--- DO NOT SHARE THIS OUTPUT WITH USERS IF IT CONTAINS PII ---")
    print("Listing Registered Users (ID: Username - Email):")
    users = User.objects.all()
    if not users.exists():
        print("No users found in database.")
        return

    for u in users:
        print(f"{u.id}: {u.username} - {u.email} (Active: {u.is_active})")

if __name__ == "__main__":
    list_users()
