from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ReportExecution(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    FORMAT_CHOICES = [
        ('PDF', 'PDF'),
        ('EXCEL', 'Excel'),
        ('CSV', 'CSV'),
    ]

    report_type = models.CharField(max_length=100)
    parameters = models.JSONField(default=dict)
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    file_path = models.CharField(max_length=500, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='PDF')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.report_type} - {self.status} ({self.created_at})"
