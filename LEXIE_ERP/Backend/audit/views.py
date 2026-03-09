from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog, RegulatoryRequirement, InternalControl, ControlTest
from .serializers import AuditLogSerializer, RegulatoryRequirementSerializer, InternalControlSerializer, ControlTestSerializer
from .permissions import IsAuditOrAdmin


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for system audit logs.
    - Only authenticated users can access.
    - Superusers, Admins, and Audit Admins can view all.
    - Other roles can only view their own actions.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuditOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # Only include real model fields in filterset_fields. 'action' is searchable but
    # not a concrete model field here, so keep it in search_fields.
    filterset_fields = ['performed_by', 'module']
    search_fields = ['action', 'module', 'details']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return AuditLog.objects.all().order_by('-timestamp')

        # Fetch user's role safely
        role = getattr(user.profile, 'role', None)

        # Admin and Audit Admin can see all logs
        if role in ['ADMIN', 'AUDIT']:
            return AuditLog.objects.all().order_by('-timestamp')

        # Others can only see their own actions
        return AuditLog.objects.filter(performed_by=user).order_by('-timestamp')


# =====================================================
# COMPLIANCE & CONTROLS VIEWSETS
# =====================================================

class RegulatoryRequirementViewSet(viewsets.ModelViewSet):
    queryset = RegulatoryRequirement.objects.all()
    serializer_class = RegulatoryRequirementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuditOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'authority']


class InternalControlViewSet(viewsets.ModelViewSet):
    queryset = InternalControl.objects.all()
    serializer_class = InternalControlSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuditOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['control_type', 'frequency']
    search_fields = ['name']


class ControlTestViewSet(viewsets.ModelViewSet):
    queryset = ControlTest.objects.all()
    serializer_class = ControlTestSerializer
    permission_classes = [permissions.IsAuthenticated, IsAuditOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['result', 'control']
    search_fields = ['control__name', 'tester__first_name']

