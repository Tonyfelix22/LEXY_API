#!/bin/bash
set -e

# Install Python dependencies
pip install --upgrade pip
pip install -r LEXIE_ERP/Backend/requirements.txt

# Run database migrations
python manage.py migrate --noinput

# Collect static files (Django)
python manage.py collectstatic --noinput

# Start the Django app with Gunicorn
gunicorn LEXY_API.wsgi:application --bind "0.0.0.0:${PORT:-8000}"

