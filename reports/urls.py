from django.urls import path
from .views import ReportTypeListView, ReportGenerateView

urlpatterns = [
    path('types/', ReportTypeListView.as_view(), name='report-types'),
    path('generate/', ReportGenerateView.as_view(), name='report-generate'),
]
