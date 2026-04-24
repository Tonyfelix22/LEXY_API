from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from users.models import UserProfile
from audit.models import AuditLog  # optional, if you have auditing
from .models import Product
from .serializers import ProductSerializer


# ------------------------------
# Health Check API
# ------------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Standard health check endpoint.
    """
    return Response({
        "status": "healthy",
        "timestamp": timezone.now(),
        "message": "LEXY ERP API is running smoothly (Root)"
    }, status=status.HTTP_200_OK)



# ------------------------------
# Authentication / Login API
# ------------------------------
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    """
    Secure login endpoint with role + verification checks.
    Returns auth token and user metadata.
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'message': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {'message': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Ensure user has a profile
        profile = getattr(user, 'profile', None)
        if not profile:
            return Response(
                {'message': 'User profile not found. Contact admin.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Enforce verification
        if not profile.is_verified:
            return Response(
                {'message': 'Account not verified yet.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate or reuse existing token
        token, _ = Token.objects.get_or_create(user=user)

        # Optional: Create audit log entry
        try:
            AuditLog.objects.create(
                action="LOGIN",
                module="Authentication",
                details=f"{user.username} logged in.",
                performed_by=user,
                timestamp=timezone.now()
            )
        except Exception:
            pass  # fail-safe if audit not available

        # Construct response payload
        data = {
            'success': True,
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': profile.role,
                'department': profile.department,
                'is_verified': profile.is_verified,
                'is_superuser': user.is_superuser,
            }
        }
        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'success': False, 'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ------------------------------
# Product API
# ------------------------------
class ProductViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Products
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def perform_create(self, serializer):
        """
        Optional: Add audit logging for product creation
        """
        product = serializer.save()
        try:
            AuditLog.objects.create(
                action="CREATE",
                module="Product",
                details=f"Product '{product.name}' created.",
                performed_by=getattr(self.request.user, 'profile', None),
                timestamp=timezone.now()
            )
        except Exception:
            pass


# ------------------------------
# Dashboard Stats API
# ------------------------------
from rest_framework.views import APIView
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from hr.models import Employee, PayrollRun
from Finance.models import Budget, Account, JournalEntry
from audit.models import AuditLog

class DashboardStatsView(APIView):
    permission_classes = [AllowAny]  # Adjust permissions as needed

    def get(self, request):
        # 1. Total Employees
        total_employees = Employee.objects.filter(status='ACTIVE').count()

        # 2. Total Payroll Cost (Last Month)
        # For simplicity, summing all approved payrolls. Ideally filter by current month.
        total_payroll_cost = PayrollRun.objects.filter(status='APPROVED').aggregate(
            total=Sum('gross_salary')
        )['total'] or 0

        # 3. Current Budget
        # Sum of all active budgets
        now = timezone.now().date()
        current_budget = Budget.objects.filter(
            start_date__lte=now,
            end_date__gte=now
        ).aggregate(total=Sum('amount'))['total'] or 0

        # 4. Revenue
        # Sum of all Income accounts (Type='INCOME') - usually Credit balance
        # But here we might just sum JournalLines for Income accounts
        # For simplicity, let's assume we have a 'Revenue' account or sum all INCOME types
        # Using Account balance for simplicity if maintained, otherwise sum JournalLines
        # Let's sum balances of all INCOME accounts
        revenue = Account.objects.filter(type='INCOME').aggregate(
            total=Sum('balance')
        )['total'] or 0

        # 5. Financial Overview (Chart Data)
        # Real aggregation for the last 6 months
        financial_overview = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timezone.timedelta(days=i*30)).replace(day=1)
            # Simple approximation for month end, or just filter by month/year
            month_name = month_start.strftime("%b")
            
            # Revenue: Sum of Credits - Debits for INCOME accounts in this month
            # Note: This is a simplified query. Ideally use TruncMonth.
            revenue_val = JournalEntry.objects.filter(
                date__year=month_start.year,
                date__month=month_start.month,
                lines__account__type='INCOME'
            ).aggregate(
                total=Sum('lines__credit') - Sum('lines__debit')
            )['total'] or 0

            # Expenses: Sum of Debits - Credits for EXPENSE accounts in this month
            expenses_val = JournalEntry.objects.filter(
                date__year=month_start.year,
                date__month=month_start.month,
                lines__account__type='EXPENSE'
            ).aggregate(
                total=Sum('lines__debit') - Sum('lines__credit')
            )['total'] or 0

            financial_overview.append({
                "name": month_name,
                "revenue": float(revenue_val),
                "expenses": float(expenses_val)
            })

        # 6. Notifications (Audit Logs)
        recent_logs = AuditLog.objects.all().order_by('-timestamp')[:5]
        notifications = [
            {
                "id": log.id,
                "title": log.action_type.replace('_', ' ').title(),
                "description": log.description,
                "time": log.timestamp.strftime("%H:%M"),
                "icon": "activity" # frontend can map this
            }
            for log in recent_logs
        ]

        # 7. Additional Finance Stats
        total_accounts = Account.objects.count()
        total_journal_entries = JournalEntry.objects.count()
        total_payroll_runs = PayrollRun.objects.count()

        data = {
            "total_employees": total_employees,
            "total_payroll_cost": total_payroll_cost,
            "current_budget": current_budget,
            "revenue": revenue,
            "financial_overview": financial_overview,
            "notifications": notifications,
            "total_accounts": total_accounts,
            "total_journal_entries": total_journal_entries,
            "total_payroll_runs": total_payroll_runs
        }

        return Response(data, status=status.HTTP_200_OK)
