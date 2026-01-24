from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'department', 'is_verified', 'phone_number']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True, required=False, default="STAFF")
    department = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "department"]

    def create(self, validated_data):
        # Remove role and department from validated_data - they're handled in the view
        password = validated_data.pop("password")
        validated_data.pop("role", None)  # Remove role - handled in view
        validated_data.pop("department", None)  # Remove department - handled in view
        
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        
        # Profile will be created in the view with proper role and department mapping
        return user