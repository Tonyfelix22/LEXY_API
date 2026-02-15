# Add to your myproject/settings.py:
import os
# Must define before any use (line 288); deploy may use older copy without later definitions
IS_RAILWAY = os.getenv('RAILWAY_ENVIRONMENT') is not None or os.getenv('RAILWAY_PROJECT_ID') is not None
IS_DOCKER = bool(os.path.exists('/.dockerenv') or os.path.exists('/run/.containerenv') or str(os.getenv('DOCKER_CONTAINER') or '').lower() in ('true', '1', 'yes'))

from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-insecure-secret-key')

# Frontend URL configuration - define early to avoid NameError
FRONTEND_URL = os.getenv('FRONTEND_URL', None)

# Add to INSTALLED_APPS
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
        'HOST': os.getenv('PGHOST') or os.getenv('DB_HOST', 'host.docker.internal'),
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
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.TokenAuthentication',  # Add TokenAuth support for DRF tokens
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
        "users.permissions.SuperuserGlobalAccess",
    ),
}

AUTH_USER_MODEL = 'auth.User'





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
# Debug mode - disable in production
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

# FORCE CORS for Railway deployment - always allow all origins
# This ensures CORS works regardless of environment detection
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_ALL_HEADERS = True
CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
    "HEAD",
]

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


# Consolidate Frontend URL detection

# CORS Configuration - Support both local development and Railway deployment
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",  # React local dev
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.0.105:3000",
    "http://192.168.0.105:8000",
    "http://192.168.0.105:3001",
    "http://192.168.2.23:3000",
    "https://lexy-api.vercel.app",  # Production Vercel
    "https://lexy-api-git-main-tonyfelix22s-projects.vercel.app", # Vercel main branch
    "https://lexy-cm77r8g3c-tonyfelix22s-projects.vercel.app",  # Current Vercel preview
    "https://lexyapi-production.up.railway.app",  # Railway backend itself
]

# Add frontend URL from environment variable if provided
if FRONTEND_URL:
    for url in FRONTEND_URL.split(','):
        url = url.strip()
        if url and url not in CORS_ALLOWED_ORIGINS:
            if url.startswith('http'):
                CORS_ALLOWED_ORIGINS.append(url)
            else:
                CORS_ALLOWED_ORIGINS.extend([f"https://{url}", f"http://{url}"])

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

# Allow Vercel preview deployments (*.vercel.app)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://[a-z0-9-]+\.vercel\.app$",
    r"^https://[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$",
]
# CSRF Configuration
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://lexy-api.vercel.app",
    "https://lexyapi-production.up.railway.app",
]

# Also trust the FRONTEND_URL for CSRF if provided
if FRONTEND_URL:
    for url in FRONTEND_URL.split(','):
        url = url.strip()
        if url:
            if url.startswith('http'):
                if url not in CSRF_TRUSTED_ORIGINS:
                    CSRF_TRUSTED_ORIGINS.append(url)
            else:
                for proto in ['https://', 'http://']:
                    if proto + url not in CSRF_TRUSTED_ORIGINS:
                        CSRF_TRUSTED_ORIGINS.append(proto + url)


# CSRF Configuration - Use secure cookies in production (Railway uses HTTPS)
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False').lower() == 'true' or not DEBUG
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to access CSRF token
CSRF_COOKIE_SAMESITE = 'Lax'


STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# JWT Authentication Settings
SIMPLE_JWT = {
    # Token lifetimes
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=90),

    # Rotation and blacklisting
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,

    # Auth & signing
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,  # Explicit for clarity & key management
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),

    # ERP audit & usability
    "UPDATE_LAST_LOGIN": True,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# ==============================================================================
# FINAL CONFIGURATION OVERRIDES
# ==============================================================================
# IS_RAILWAY / IS_DOCKER defined at top of file (lines 3-4)
if IS_RAILWAY:
    print("--- RAILWAY DEPLOYMENT DETECTED ---")
elif IS_DOCKER:
    print("\n" + "!"*60)
    print("!!! LOCAL DOCKER DETECTED - FORCING HOST TO host.docker.internal !!!")
    print("!"*60 + "\n")
    current_host = DATABASES['default'].get('HOST')
    if current_host in ['localhost', '127.0.0.1', '::1', None]:
        print(f"DEBUG: Overriding local DB_HOST '{current_host}' -> 'host.docker.internal'")
        DATABASES['default']['HOST'] = 'host.docker.internal'
        os.environ['PGHOST'] = 'host.docker.internal'
    print(f"DEBUG: Final Host set to: {DATABASES['default']['HOST']}")
