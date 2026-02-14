from django.test import TestCase, RequestFactory
from django.contrib.auth.models import User
from hr.models import Department
from audit.models import AuditLog
from audit.middleware import AuditMiddleware
from audit.utils import get_current_user, clear_current_user

class AuditLogTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.factory = RequestFactory()
        self.middleware = AuditMiddleware(lambda r: None)

    def tearDown(self):
        clear_current_user()

    def test_middleware_sets_user(self):
        request = self.factory.get('/')
        request.user = self.user
        self.middleware.process_request(request)
        self.assertEqual(get_current_user(), self.user)

    def test_create_audit_log(self):
        # Simulate request with user
        request = self.factory.get('/')
        request.user = self.user
        self.middleware.process_request(request)

        # Create Department
        dept = Department.objects.create(name='Test Dept', code='TD01')

        # Check log
        log = AuditLog.objects.filter(module='HR', action_type='CREATE').last()
        self.assertIsNotNone(log)
        self.assertIn('Test Dept', log.description)
        self.assertEqual(log.performed_by, self.user)

    def test_update_audit_log(self):
        # Setup
        request = self.factory.get('/')
        request.user = self.user
        self.middleware.process_request(request)
        dept = Department.objects.create(name='Update Dept', code='UD01')
        
        # Update
        dept.name = 'Updated Dept Name'
        dept.save()

        # Check log
        log = AuditLog.objects.filter(module='HR', action_type='UPDATE').last()
        self.assertIsNotNone(log)
        self.assertIn('Updated Dept Name', log.description)
        self.assertEqual(log.performed_by, self.user)

    def test_delete_audit_log(self):
        # Setup
        request = self.factory.get('/')
        request.user = self.user
        self.middleware.process_request(request)
        dept = Department.objects.create(name='Delete Dept', code='DD01')
        
        # Delete
        dept.delete()

        # Check log
        log = AuditLog.objects.filter(module='HR', action_type='DELETE').last()
        self.assertIsNotNone(log)
        self.assertIn('Delete Dept', log.description)
        self.assertEqual(log.performed_by, self.user)
