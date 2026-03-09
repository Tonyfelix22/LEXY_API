# STEP 8: urls.py (api/urls.py)
# ============================================
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet
from . import views

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('', include(router.urls)),
    path('login/', views.login_api, name='login_api'),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
]