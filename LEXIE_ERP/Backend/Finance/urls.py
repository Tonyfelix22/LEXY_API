from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, JournalEntryViewSet, BudgetViewSet, finance_summary, ContactViewSet, InvoiceViewSet, BankStatementViewSet, BankStatementLineViewSet, PurchaseRequestViewSet

# Router for viewsets (auto CRUD routes)
router = DefaultRouter()
router.register('accounts', AccountViewSet, basename='accounts')
router.register('journals', JournalEntryViewSet, basename='journals')
router.register('budgets', BudgetViewSet, basename='budgets')
router.register('contacts', ContactViewSet, basename='contacts')
router.register('invoices', InvoiceViewSet, basename='invoices')
router.register('bank-statements', BankStatementViewSet, basename='bank-statements')
router.register('bank-statement-lines', BankStatementLineViewSet, basename='bank-statement-lines')
router.register('purchase-requests', PurchaseRequestViewSet, basename='purchase-requests')

# Combine router URLs + custom endpoints
urlpatterns = [
    path('summary/', finance_summary, name='finance-summary'),
]

urlpatterns += router.urls
