"""
Simple health check view for Railway deployment
"""
from django.http import HttpResponse


def health_check(request):
    """Simple health check endpoint"""
    return HttpResponse("LEXY API Backend - Running", content_type="text/plain")
