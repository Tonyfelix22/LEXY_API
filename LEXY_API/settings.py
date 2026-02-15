import os
import urllib.parse
from pathlib import Path
from datetime import timedelta

# Environment detection (must be first)
IS_RAILWAY = os.getenv('RAILWAY_ENVIRONMENT') is not None or os.getenv('RAILWAY_PROJECT_ID') is not None
IS_DOCKER = bool(os.path.exists('/.dockerenv') or os.path.exists('/run/.containerenv') or str(os.getenv('DOCKER_CONTAINER') or '').lower() in ('true', '1', 'yes'))

# Base settings
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-insecure-secret-key')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

# Frontend URL
FRONTEND_URL = os.getenv('FRONTEND_URL', None)

# Installed apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'django_filters',
    'rest_framework.authtoken',
    'corsheaders',
    'users.apps.UsersConfig',
    'API',
    'Finance.apps.FinanceConfig',
    'audit.apps.AuditConfig',
    'hr.apps.HrConfig',
    'reports',
    'notifications',
]

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'audit.middleware.AuditMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# URL configuration
ROOT_URLCONF = 'LEXY_API.urls'
WSGI_APPLICATION = 'LEXY_API.wsgi.application'

# Templates
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

# Database configuration - Matching your Railway Service Variables
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME') or os.getenv('PGDATABASE', 'LEXYDB'),
        'USER': os.getenv('DB_USER') or os.getenv('PGUSER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD') or os.getenv('PGPASSWORD', 'Password26'),
        'HOST': os.getenv('DB_HOST') or os.getenv('PGHOST', 'localhost'),
        'PORT': os.getenv('DB_PORT') or os.getenv('PGPORT', '5432'),
    }
}

# Parse DATABASE_URL if provided
database_url = os.getenv('DATABASE_URL')
if database_url:
    result = urllib.parse.urlparse(database_url)
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': result.path[1:] if result.path else os.getenv('PGDATABASE', 'postgres'),
        'USER': result.username or os.getenv('PGUSER', 'postgres'),
        'PASSWORD': result.password or os.getenv('PGPASSWORD', ''),
        'HOST': result.hostname or os.getenv('PGHOST', 'localhost'),
        'PORT': result.port or os.getenv('PGPORT', '5432'),
    }

# Override host for Docker or Railway rescue
if IS_DOCKER and not IS_RAILWAY:
    current_host = DATABASES['default']['HOST']
    if current_host in ['localhost', '127.0.0.1', '::1']:
        DATABASES['default']['HOST'] = 'host.docker.internal'

# Railway Rescue: If on Railway and host is 'localhost', try to use internal PGHOST
if IS_RAILWAY and DATABASES['default'].get('HOST') in ['localhost', '127.0.0.1', None]:
    pghost = os.getenv('PGHOST')
    if pghost and pghost not in ['localhost', '127.0.0.1']:
        DATABASES['default']['HOST'] = pghost
        # Also update os.environ so other tools (manage.py) see it
        os.environ['PGHOST'] = pghost

# CORS configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.0.105:3000",
    "http://192.168.0.105:8000",
    "http://192.168.0.105:3001",
    "http://192.168.2.23:3000",
    "https://lexy-api.vercel.app",
    "https://lexy-api-git-main-tonyfelix22s-projects.vercel.app",
    "https://lexy-cm77r8g3c-tonyfelix22s-projects.vercel.app",
    "https://lexyapi-production.up.railway.app",
]

# Add frontend URL from environment
if FRONTEND_URL:
    for url in FRONTEND_URL.split(','):
        url = url.strip()
        if url and url not in CORS_ALLOWED_ORIGINS:
            if url.startswith('http'):
                CORS_ALLOWED_ORIGINS.append(url)
            else:
                CORS_ALLOWED_ORIGINS.extend([f"https://{url}", f"http://{url}"])

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://[a-z0-9-]+\.vercel\.app$",
    r"^https://[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
]

# CSRF configuration
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://lexy-api.vercel.app",
    "https://lexyapi-production.up.railway.app",
]

if FRONTEND_URL:
    for url in FRONTEND_URL.split(','):
        url = url.strip()
        if url:
            if url.startswith('http'):
                if url not in CSRF_TRUSTED_ORIGINS:
                    CSRF_TRUSTED_ORIGINS.append(url)
            else:
                for proto in ['https://', 'http://']:
                    full_url = proto + url
                    if full_url not in CSRF_TRUSTED_ORIGINS:
                        CSRF_TRUSTED_ORIGINS.append(full_url)

CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False').lower() == 'true' or not DEBUG
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
        "users.permissions.SuperuserGlobalAccess",
    ),
}

AUTH_USER_MODEL = 'auth.User'

# JWT settings
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=90),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "UPDATE_LAST_LOGIN": True,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Debug & Environment Output - Aligned with your Railway Dashboard
print("\n" + "="*60)
print("LEXIE ERP - ENVIRONMENT DIAGNOSTICS")
print("="*60)
print(f"IS_RAILWAY: {IS_RAILWAY}")
print(f"IS_DOCKER:  {IS_DOCKER}")

if IS_RAILWAY:
    print("\nRAILWAY SERVICE VARIABLES (From Dashboard):")
    print(f"  DB_HOST:     {os.getenv('DB_HOST')}")
    print(f"  DB_NAME:     {os.getenv('DB_NAME')}")
    print(f"  DB_USER:     {os.getenv('DB_USER')}")
    print(f"  DB_PORT:     {os.getenv('DB_PORT')}")
    print("\nRAILWAY PLUGIN VARIABLES (Standard):")
    print(f"  PGHOST:      {os.getenv('PGHOST')}")
    print(f"  PGDATABASE:  {os.getenv('PGDATABASE')}")

print("\nFINAL DJANGO DATABASE CONFIG:")
print(f"  HOST:        {DATABASES['default'].get('HOST')}")
print(f"  PORT:        {DATABASES['default'].get('PORT')}")
print(f"  NAME:        {DATABASES['default'].get('NAME')}")
print(f"  USER:        {DATABASES['default'].get('USER')}")

if IS_RAILWAY and DATABASES['default'].get('HOST') in ['localhost', '127.0.0.1']:
    print("\n" + "!"*60)
    print("CRITICAL WARNING: App is on Railway but pointing to 'localhost'!")
    print("This will definitely fail unless your DB is in the same container.")
    print("Please update DB_HOST in Railway to your database hostname.")
    print("!"*60)

print("="*60 + "\n")