from rest_framework import serializers
from django.contrib.auth.models import User
from .models import AuditLog, RegulatoryRequirement, InternalControl, ControlTest


class UserSerializer(serializers.ModelSerializer):
    """Simplified nested serializer for user information."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for system audit logs."""

    module_display = serializers.CharField(source="get_module_display", read_only=True)
    action_display = serializers.CharField(source="get_action_type_display", read_only=True)
    performed_by = UserSerializer(read_only=True)  # nested user display
    
    # Frontend compatibility fields
    user = serializers.CharField(source='performed_by.username', read_only=True)
    action = serializers.CharField(source='action_type', read_only=True)
    model = serializers.CharField(source='model_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "module",
            "module_display",
            "action_type",
            "action_display",
            "description",
            "performed_by",
            "timestamp",
            # Frontend fields
            "user",
            "action",
            "model",
            "object_id",
            "changes",
        ]
        read_only_fields = ["timestamp", "performed_by"]

    def create(self, validated_data):
        """
        Automatically attach the current user if available
        when creating audit entries via API.
        """
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["performed_by"] = request.user
        return super().create(validated_data)


# ===============================
# Compliance & Controls
# ===============================

class RegulatoryRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegulatoryRequirement
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class InternalControlSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = InternalControl
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ControlTestSerializer(serializers.ModelSerializer):
    control_name = serializers.CharField(source='control.name', read_only=True)
    tester_name = serializers.CharField(source='tester.get_full_name', read_only=True)

    class Meta:
        model = ControlTest
        fields = '__all__'
        read_only_fields = ['created_at']

