from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet,
    EmployeeViewSet,
    EmploymentHistoryViewSet,
    PayrollRunViewSet,
    PayrollDeductionViewSet,
    LeaveTypeViewSet,
    LeaveBalanceViewSet,
    LeaveRequestViewSet,
    JobPostingViewSet,
    ApplicantViewSet,
    PerformanceGoalViewSet,
    PerformanceReviewViewSet,
    TravelRequestViewSet
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'employment-history', EmploymentHistoryViewSet, basename='employment-history')
router.register(r'payroll_runs', PayrollRunViewSet, basename='payroll-run')
router.register(r'payroll-deductions', PayrollDeductionViewSet, basename='payroll-deduction')
router.register(r'leave-types', LeaveTypeViewSet, basename='leave-type')
router.register(r'leave-balances', LeaveBalanceViewSet, basename='leave-balance')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leave-request')
router.register(r'job-postings', JobPostingViewSet, basename='job-posting')
router.register(r'applicants', ApplicantViewSet, basename='applicant')
router.register(r'performance-goals', PerformanceGoalViewSet, basename='performance-goal')
router.register(r'performance-reviews', PerformanceReviewViewSet, basename='performance-review')
router.register(r'travel-requests', TravelRequestViewSet, basename='travel-request')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]