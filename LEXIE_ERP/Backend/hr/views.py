from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

# Note: Removed invalid imports to non-existent permissions.
# If superuser-only global access is needed, add a valid permission class here.
from hr.permissions import IsFinanceAdmin

from .models import Department, Employee, EmploymentHistory, PayrollRun, PayrollDeduction, LeaveType, LeaveBalance, LeaveRequest, JobPosting, Applicant, PerformanceGoal, PerformanceReview, TravelRequest
from django.db import models # Added for Q objects
from .serializers import (
    DepartmentSerializer,
    EmployeeListSerializer,
    EmployeeDetailSerializer,
    EmploymentHistorySerializer,
    PayrollRunListSerializer,
    PayrollRunDetailSerializer,
    PayrollRunCreateSerializer,
    PayrollDeductionSerializer,
    PayrollPostToFinanceSerializer,
    EmployeeSalaryHistorySerializer,
    PayrollSummarySerializer,
    LeaveTypeSerializer,
    LeaveBalanceSerializer,
    LeaveRequestSerializer,
    JobPostingSerializer,
    ApplicantSerializer,
    PerformanceGoalSerializer,
    PerformanceGoalSerializer,
    PerformanceReviewSerializer,
    TravelRequestSerializer
)


# =====================================================
# DEPARTMENT VIEWSET
# =====================================================
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['code', 'name']
    ordering = ['code']

    @action(detail=True, methods=['get'])
    def employees(self, request, pk=None):
        department = self.get_object()
        employees = department.employees.filter(status='ACTIVE')
        serializer = EmployeeListSerializer(employees, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        department = self.get_object()
        employees = department.employees.filter(status='ACTIVE')

        stats = {
            'total_employees': employees.count(),
            'average_salary': employees.aggregate(Avg('basic_salary'))['basic_salary__avg'] or 0,
            'total_salary_cost': employees.aggregate(Sum('basic_salary'))['basic_salary__sum'] or 0,
            'employment_type_breakdown': dict(
                employees.values('employment_type')
                .annotate(count=Count('id'))
                .values_list('employment_type', 'count')
            ),
        }
        return Response(stats)


# =====================================================
# EMPLOYEE VIEWSET
# =====================================================
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().select_related('department')
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'department', 'employment_type']
    search_fields = ['staff_number', 'first_name', 'last_name', 'email', 'national_id']
    ordering_fields = ['staff_number', 'hire_date', 'basic_salary', 'first_name']
    ordering = ['staff_number']

    def get_serializer_class(self):
        return EmployeeListSerializer if self.action == 'list' else EmployeeDetailSerializer

        history = employee.employment_history.all()
        serializer = EmploymentHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def salary_history(self, request, pk=None):
        employee = self.get_object()
        history = employee.employment_history.filter(
            change_type__in=['SALARY_INCREASE', 'SALARY_DECREASE', 'PROMOTION']
        ).exclude(new_salary__isnull=True)
        serializer = EmployeeSalaryHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def all_employees(self, request):
        employees = Employee.objects.filter(status='ACTIVE').values('id', 'first_name', 'last_name', 'staff_number')
        return Response(employees)

    @action(detail=False, methods=['get'])
    def managers(self, request):
        # Logic: Employees who manage at least one department OR have 'MANAGER' role in UserProfile
        # For simplicity and performance, we'll fetch employees linked to Departments as managers
        # plus check UserProfile roles if needed.
        # Here we'll stick to Department managers + potentially those with "Manager" job title as a heuristic if strict role not available
        
        # Method 1: Get all department managers
        dept_manager_ids = Department.objects.exclude(manager__isnull=True).values_list('manager_id', flat=True)
        
        # Method 2: Get all users with role='MANAGER'
        # This requires traversing User -> UserProfile
        # manager_user_ids = UserProfile.objects.filter(role='MANAGER').values_list('user_id', flat=True)
        # manager_employee_ids = Employee.objects.filter(user__id__in=manager_user_ids).values_list('id', flat=True)

        # distinct ids
        # all_manager_ids = set(list(dept_manager_ids))

        # more simple logic: job title contains "Manager" or is a Dept Manager
        employees = Employee.objects.filter(
            models.Q(id__in=dept_manager_ids) | 
            models.Q(job_title__icontains='Manager') |
            models.Q(job_title__icontains='Head')
        ).filter(status='ACTIVE').distinct().values('id', 'first_name', 'last_name', 'staff_number', 'job_title')

        return Response(employees)


# =====================================================
# EMPLOYMENT HISTORY VIEWSET
# =====================================================
class EmploymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmploymentHistory.objects.all()
    serializer_class = EmploymentHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'change_type', 'effective_date']
    ordering_fields = ['effective_date', 'created_at']
    ordering = ['-effective_date']


# =====================================================
# PAYROLL RUN VIEWSET
# =====================================================
class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.select_related('employee', 'employee__department')
    permission_classes = [permissions.IsAuthenticated, IsFinanceAdmin]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'status', 'period_start', 'period_end', 'is_posted_to_finance']
    ordering_fields = ['pay_date', 'period_end', 'created_at']
    ordering = ['-period_end', '-pay_date']

    def get_serializer_class(self):
        if self.action == 'create':
            return PayrollRunCreateSerializer
        elif self.action == 'list':
            return PayrollRunListSerializer
        return PayrollRunDetailSerializer

    @action(detail=True, methods=['post'])
    def calculate(self, request, pk=None):
        payroll = self.get_object()
        if payroll.is_posted_to_finance:
            return Response({'error': 'Cannot recalculate posted payroll'}, status=status.HTTP_400_BAD_REQUEST)
        payroll.calculate_totals()
        payroll.status = 'CALCULATED'
        payroll.calculated_by = request.user.username
        payroll.save()
        return Response(PayrollRunDetailSerializer(payroll).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status != 'CALCULATED':
            return Response({'error': 'Payroll must be calculated before approval'}, status=status.HTTP_400_BAD_REQUEST)
        payroll.status = 'APPROVED'
        payroll.approved_by = request.user.username
        payroll.save()
        return Response(PayrollRunDetailSerializer(payroll).data)

    @action(detail=True, methods=['post'])
    def post_to_finance(self, request, pk=None):
        payroll = self.get_object()
        serializer = PayrollPostToFinanceSerializer(data=request.data, context={'payroll': payroll})
        serializer.is_valid(raise_exception=True)
        try:
            entry = payroll.post_to_finance(posted_by=request.user.username)
            return Response({
                'message': 'Payroll posted to finance successfully',
                'journal_entry_id': entry.id,
                'payroll_id': payroll.id,
                'employee_name': payroll.employee.get_full_name(),
                'employee_staff_number': payroll.employee.staff_number,
                'net_salary': str(payroll.net_salary),
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        period_start = request.query_params.get('period_start')
        period_end = request.query_params.get('period_end')
        if not period_start or not period_end:
            return Response({'error': 'period_start and period_end are required'}, status=status.HTTP_400_BAD_REQUEST)

        payrolls = self.get_queryset().filter(period_start=period_start, period_end=period_end)
        aggregates = payrolls.aggregate(
            total_gross=Sum('gross_salary'),
            total_net=Sum('net_salary'),
            total_deductions=Sum('total_deductions'),
        )
        status_breakdown = dict(payrolls.values('status').annotate(count=Count('id')).values_list('status', 'count'))
        summary = {
            'period_start': period_start,
            'period_end': period_end,
            'total_employees': payrolls.count(),
            'total_gross_salary': aggregates.get('total_gross') or 0,
            'total_deductions': aggregates.get('total_deductions') or 0,
            'total_net_salary': aggregates.get('total_net') or 0,
            'status_breakdown': status_breakdown,
        }
        return Response(PayrollSummarySerializer(summary).data)


# =====================================================
# PAYROLL DEDUCTION VIEWSET
# =====================================================
class PayrollDeductionViewSet(viewsets.ModelViewSet):
    queryset = PayrollDeduction.objects.select_related('payroll_run')
    serializer_class = PayrollDeductionSerializer
    permission_classes = [permissions.IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['payroll_run', 'deduction_type']
    ordering = ['deduction_type']


# =====================================================
# LEAVE MANAGEMENT VIEWSETS
# =====================================================

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['employee', 'leave_type', 'year']
    search_fields = ['employee__staff_number', 'employee__first_name']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['ADMIN', 'HR', 'MANAGER']:
            return LeaveBalance.objects.all()
        # Robust filtering: Check for direct link first, then fallback to email
        if hasattr(user, 'employee_profile'):
            return LeaveBalance.objects.filter(employee=user.employee_profile)
        return LeaveBalance.objects.filter(employee__email=user.email)

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'status', 'leave_type']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['ADMIN', 'HR']:
            return LeaveRequest.objects.all()
        if hasattr(user, 'profile') and user.profile.role == 'MANAGER':
             # Managers see their own requests AND requests from their department
             # For simplicity in this iteration, returning all for Managers or filtering by department if possible.
             return LeaveRequest.objects.all()
        
        if hasattr(user, 'employee_profile'):
             return LeaveRequest.objects.filter(employee=user.employee_profile)
        return LeaveRequest.objects.filter(employee__email=user.email)

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'employee_profile'):
            serializer.save(employee=user.employee_profile)
        else:
            # Fallback or error if no employee profile
            try:
                employee = Employee.objects.get(email=user.email)
                serializer.save(employee=employee)
            except Employee.DoesNotExist:
                 raise serializers.ValidationError({"detail": "No employee profile found for this user."})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        # Ensure only HR Admin can approve
        if not hasattr(request.user, 'profile') or request.user.profile.role not in ['HR', 'ADMIN']:
            return Response({'error': 'Only HR Admins can approve leave requests'}, status=status.HTTP_403_FORBIDDEN)

        leave_request = self.get_object()
        if leave_request.status != 'PENDING':
            return Response({'error': 'Only pending requests can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Deduct balance
        try:
            balance = LeaveBalance.objects.get(
                employee=leave_request.employee,
                leave_type=leave_request.leave_type,
                year=leave_request.start_date.year
            )
            days = leave_request.duration
            if balance.balance < days:
                 return Response({'error': 'Insufficient leave balance'}, status=status.HTTP_400_BAD_REQUEST)
            
            balance.balance -= days
            balance.used += days
            balance.save()
            
            leave_request.status = 'APPROVED'
            if hasattr(request.user, 'employee_profile'):
                leave_request.approved_by = request.user.employee_profile
            leave_request.manager_comment = request.data.get('comment', '')
            leave_request.save()
            
            return Response(LeaveRequestSerializer(leave_request).data)
            
        except LeaveBalance.DoesNotExist:
            return Response({'error': 'Leave balance not found for this employee/type/year'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        # Ensure only HR Admin can reject
        if not hasattr(request.user, 'profile') or request.user.profile.role not in ['HR', 'ADMIN']:
            return Response({'error': 'Only HR Admins can reject leave requests'}, status=status.HTTP_403_FORBIDDEN)

        leave_request = self.get_object()
        if leave_request.status != 'PENDING':
             return Response({'error': 'Only pending requests can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        leave_request.status = 'REJECTED'
        leave_request.manager_comment = request.data.get('comment', '')
        leave_request.save()
        return Response(LeaveRequestSerializer(leave_request).data)


# =====================================================
# RECRUITMENT VIEWSETS
# =====================================================

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all()
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'department']
    search_fields = ['title', 'job_description']

    def get_queryset(self):
        # Auto-close expired jobs automatically
        expired_jobs = JobPosting.objects.filter(
            status='OPEN',
            closing_date__lt=timezone.now().date()
        )
        if expired_jobs.exists():
            expired_jobs.update(status='CLOSED')
        return super().get_queryset()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ApplicantViewSet(viewsets.ModelViewSet):
    queryset = Applicant.objects.all()
    serializer_class = ApplicantSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'job_posting']
    search_fields = ['first_name', 'last_name', 'email']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['ADMIN', 'HR', 'MANAGER']:
            return Applicant.objects.all()
        # Normal employees only see their own applications
        return Applicant.objects.filter(employee__email=user.email)

    def perform_create(self, serializer):
        # Auto-link employee if applicable
        user = self.request.user
        employee = None
        if hasattr(user, 'profile'):
            # Try to find employee by email
            try:
                employee = Employee.objects.get(email=user.email)
            except Employee.DoesNotExist:
                pass
        
        applicant = serializer.save(employee=employee)
        
        # Send confirmation email
        try:
            send_mail(
                subject=f"Application Received: {applicant.job_posting.title}",
                message=f"Dear {applicant.first_name},\n\nWe have successfully received your application for the {applicant.job_posting.title} position.\n\nThank you,\nHR Team",
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@lexie.com',
                recipient_list=[applicant.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        applicant = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes')
        
        if new_status not in dict(Applicant.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        applicant.status = new_status
        if notes:
            applicant.notes = (applicant.notes or "") + f"\n[{timezone.now().date()}] Status changed to {new_status}: {notes}"
        applicant.save()
        
        # Send status update email
        try:
            send_mail(
                subject=f"Application Status Update: {applicant.job_posting.title}",
                message=f"Dear {applicant.first_name},\n\nYour application status for the {applicant.job_posting.title} position has been updated to: {dict(Applicant.STATUS_CHOICES).get(new_status)}.\n\nThank you,\nHR Team",
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@lexie.com',
                recipient_list=[applicant.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")
        
        return Response(ApplicantSerializer(applicant).data)


# =====================================================
# TRAVEL MANAGEMENT VIEWSETS
# =====================================================

class TravelRequestViewSet(viewsets.ModelViewSet):
    queryset = TravelRequest.objects.all()
    serializer_class = TravelRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'status']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.role in ['ADMIN', 'HR', 'MANAGER']:
            return TravelRequest.objects.all()
        
        # Regular employees only see their own requests
        # Filter by email matching user email
        return TravelRequest.objects.filter(employee__email=user.email)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        # Ensure only HR/Admin/Manager can approve
        if not hasattr(request.user, 'profile') or request.user.profile.role not in ['HR', 'ADMIN', 'MANAGER']:
            return Response({'error': 'Only authorized managers can approve travel requests'}, status=status.HTTP_403_FORBIDDEN)

        travel_request = self.get_object()
        if travel_request.status != 'PENDING':
            return Response({'error': 'Only pending requests can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        travel_request.status = 'APPROVED'
        # Try to link approver to an employee record
        try:
            approver = Employee.objects.get(email=request.user.email)
            travel_request.approved_by = approver
        except Employee.DoesNotExist:
            pass # Approved by system/admin without employee record
            
        travel_request.manager_comment = request.data.get('comment', '')
        travel_request.save()
        
        return Response(TravelRequestSerializer(travel_request).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not hasattr(request.user, 'profile') or request.user.profile.role not in ['HR', 'ADMIN', 'MANAGER']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        travel_request = self.get_object()
        if travel_request.status != 'PENDING':
             return Response({'error': 'Only pending requests can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        travel_request.status = 'REJECTED'
        travel_request.manager_comment = request.data.get('comment', '')
        travel_request.save()
        return Response(TravelRequestSerializer(travel_request).data)


# =====================================================
# PERFORMANCE MANAGEMENT VIEWSETS
# =====================================================

class PerformanceGoalViewSet(viewsets.ModelViewSet):
    queryset = PerformanceGoal.objects.all()
    serializer_class = PerformanceGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'employee']
    search_fields = ['title', 'employee__first_name', 'employee__last_name']


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.all()
    serializer_class = PerformanceReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'employee', 'reviewer']
    search_fields = ['employee__first_name', 'employee__last_name']

