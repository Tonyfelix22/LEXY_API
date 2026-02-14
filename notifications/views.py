from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.status = 'READ'
            notification.save()
            return Response(status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, status__in=['PENDING', 'SENT', 'FAILED']).update(status='READ')
        return Response(status=status.HTTP_200_OK)

class NotificationPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        preferences = NotificationPreference.objects.filter(user=request.user)
        serializer = NotificationPreferenceSerializer(preferences, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Update preferences
        data = request.data
        for pref_data in data:
            NotificationPreference.objects.update_or_create(
                user=request.user,
                notification_type=pref_data['notification_type'],
                defaults={
                    'email_enabled': pref_data['email_enabled'],
                    'system_enabled': pref_data['system_enabled']
                }
            )
        return Response(status=status.HTTP_200_OK)
