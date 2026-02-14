from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.tokens import PasswordResetTokenGenerator

class PasswordResetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpassword123'
        )
        self.reset_url = reverse('reset-password')
        self.confirm_url = reverse('reset-password-confirm')

    def test_request_password_reset(self):
        """Test requesting a password reset email."""
        response = self.client.post(self.reset_url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # In a real test we'd check if mail.outbox has an email, 
        # but here we mainly check the view logic.

    def test_reset_password_confirm_success(self):
        """Test successfully resetting the password with a valid token."""
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(self.user)
        
        data = {
            'uid': self.user.id,
            'token': token,
            'new_password': 'newpassword123'
        }
        
        response = self.client.post(self.confirm_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))

    def test_reset_password_confirm_invalid_token(self):
        """Test resetting password with an invalid token."""
        data = {
            'uid': self.user.id,
            'token': 'invalid-token',
            'new_password': 'newpassword123'
        }
        
        response = self.client.post(self.confirm_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify password did NOT change
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpassword123'))
