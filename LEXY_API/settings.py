# Add to your myproject/settings.py:

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-insecure-secret-key')

# Add to INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',  # Add this
    'API'# Your app name
]

# PostgreSQL Database Configuration
# URLs / WSGI
ROOT_URLCONF = 'LEXY_API.urls'
WSGI_APPLICATION = 'LEXY_API.wsgi.application'

# Database Configuration - Supports Railway Postgres environment variables
# Railway provides: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
# Or DATABASE_URL format: postgresql://user:password@host:port/database

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('PGDATABASE') or os.getenv('DB_NAME', 'LEXYDB'),
        'USER': os.getenv('PGUSER') or os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('PGPASSWORD') or os.getenv('DB_PASSWORD', 'Password26'),
        'HOST': os.getenv('PGHOST') or os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('PGPORT') or os.getenv('DB_PORT', '5432'),
    }
}

# If DATABASE_URL is provided (Railway sometimes uses this), parse it
database_url = os.getenv('DATABASE_URL')
if database_url:
    # Parse DATABASE_URL format: postgresql://user:password@host:port/database
    import urllib.parse
    result = urllib.parse.urlparse(database_url)
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': result.path[1:] if result.path else os.getenv('PGDATABASE', 'postgres'),
        'USER': result.username or os.getenv('PGUSER', 'postgres'),
        'PASSWORD': result.password or os.getenv('PGPASSWORD', ''),
        'HOST': result.hostname or os.getenv('PGHOST', 'localhost'),
        'PORT': result.port or os.getenv('PGPORT', '5432'),
    }

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
