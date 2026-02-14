#!/usr/bin/env python
"""
Startup script for Django on Railway.
Handles migrations gracefully and starts Gunicorn.
"""
import os
import sys
import subprocess

def run_migrations():
    """Run Django migrations, but don't crash if DB is not ready."""
    print("Running database migrations...")
    try:
        result = subprocess.run(
            [sys.executable, 'manage.py', 'migrate', '--noinput'],
            check=False,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✓ Migrations completed successfully")
            return True
        else:
            print(f"⚠ Migration warning (exit code {result.returncode}):")
            print(result.stdout)
            print(result.stderr)
            # Don't fail - maybe DB will be ready later
            return False
    except Exception as e:
        print(f"⚠ Migration error (continuing anyway): {e}")
        return False

def collect_static():
    """Collect static files."""
    print("Collecting static files...")
    try:
        result = subprocess.run(
            [sys.executable, 'manage.py', 'collectstatic', '--noinput'],
            check=False,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✓ Static files collected")
        else:
            print(f"⚠ Static collection warning: {result.stderr}")
    except Exception as e:
        print(f"⚠ Static collection error: {e}")

def start_gunicorn():
    """Start Gunicorn server."""
    port = os.getenv('PORT', '8000')
    print(f"Starting Gunicorn on port {port}...")
    
    # Use gunicorn to start the Django app
    os.execvp('gunicorn', [
        'gunicorn',
        '--bind', f'0.0.0.0:{port}',
        '--workers', '2',
        '--timeout', '120',
        'LEXY_API.wsgi:application'
    ])

if __name__ == '__main__':
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'LEXY_API.settings')
    
    # Try migrations (non-blocking)
    run_migrations()
    
    # Collect static files
    collect_static()
    
    # Start server
    start_gunicorn()
