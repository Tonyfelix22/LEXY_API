from django.urls import path
from .views import (
    UserListView,
    UserDetailView,
    MyProfileView,
    current_user,
    register_user,
    login_user,
    logout_user,
    reset_password,
)

urlpatterns = [
    # 👥 User Management
    path('', UserListView.as_view(), name='user-list'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('me/', MyProfileView.as_view(), name='user-profile'),
    path('user/', current_user, name='current-user'),

    # 🔐 Authentication Endpoints
    path('register/', register_user, name='register-user'),
    path('login/', login_user, name='login-user'),
    path('logout/', logout_user, name='logout-user'),
    path('reset_password/', reset_password, name='reset-password'),
]
