import os
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LEXY_API.settings')
    django.setup()
    
    # Run migrations first
    execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
    
    # Start the server
    port = os.environ.get('PORT', '8000')
    execute_from_command_line(['manage.py', 'runserver', f'0.0.0.0:{port}'])
