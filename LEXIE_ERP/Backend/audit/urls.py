from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, RegulatoryRequirementViewSet, InternalControlViewSet, ControlTestViewSet

# Initialize router
router = DefaultRouter()
router.register(r'auditlogs', AuditLogViewSet, basename='auditlog')
router.register(r'regulatory-requirements', RegulatoryRequirementViewSet, basename='regulatory-requirement')
router.register(r'internal-controls', InternalControlViewSet, basename='internal-control')
router.register(r'control-tests', ControlTestViewSet, basename='control-test')

urlpatterns = [
    path('', include(router.urls)),
]
