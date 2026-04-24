"""
URL configuration for LEXY_API project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

# ============================================
from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from API.views import health_check

urlpatterns = [
    path('', health_check, name='root_health'),
    path('health/', health_check, name='health_check'),
    path('status/', health_check, name='status_check'),
    path('admin/', admin.site.urls),

    # 🌐 App Endpoints
    path('api/', include('API.urls')),
    path('api/finance/', include('Finance.urls')),
    path('api/users/', include('users.urls')),
    path('api/hr/', include('hr.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/notifications/', include('notifications.urls')),

    # 🛠️ DRF Auth for browseable API
    path('api-auth/', include('rest_framework.urls')),
]

