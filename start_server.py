#!/usr/bin/env python
"""
Startup script for Django on Railway.
Handles migrations gracefully and starts Gunicorn.
"""
import os
import sys
import subprocess
import time

def run_migrations():
    """Run Django migrations, but don't crash if DB is not ready."""
    print("Running database migrations...")
    max_attempts = int(os.getenv('MIGRATE_MAX_ATTEMPTS', '12'))
    delay_seconds = float(os.getenv('MIGRATE_RETRY_DELAY_SECONDS', '5'))

    last_stdout = ""
    last_stderr = ""
    for attempt in range(1, max_attempts + 1):
        try:
            result = subprocess.run(
                [sys.executable, 'manage.py', 'migrate', '--noinput'],
                check=False,
                capture_output=True,
                text=True,
            )
            last_stdout = result.stdout or ""
            last_stderr = result.stderr or ""

            if result.returncode == 0:
                print("✓ Migrations completed successfully")
                return True

            print(f"⚠ Migration attempt {attempt}/{max_attempts} failed (exit code {result.returncode}).")
            if last_stdout.strip():
                print(last_stdout)
            if last_stderr.strip():
                print(last_stderr)

        except Exception as e:
            print(f"⚠ Migration attempt {attempt}/{max_attempts} raised an exception: {e}")

        if attempt < max_attempts:
            time.sleep(delay_seconds)

    print("✗ Migrations did not succeed; refusing to start server to avoid runtime 500s due to missing tables.")
    if last_stdout.strip():
        print(last_stdout)
    if last_stderr.strip():
        print(last_stderr)
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
    
    # Run migrations (blocking with retries). If DB isn't ready, fail fast so Railway restarts.
    if not run_migrations():
        raise SystemExit(1)
    
    # Collect static files
    collect_static()
    
    # Start server
    start_gunicorn()
