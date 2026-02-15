# LEXIE ERP - Django Backend Only
# Frontend is deployed separately on Vercel

FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY manage.py .
COPY start_server.py .
COPY LEXY_API ./LEXY_API
COPY API ./API
COPY Finance ./Finance
COPY audit ./audit
COPY hr ./hr
COPY users ./users
COPY notifications ./notifications
COPY reports ./reports
COPY permissions ./permissions

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Waiting for PostgreSQL..."\n\
while ! pg_isready -h $DB_HOST -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -q; do\n\
  echo "PostgreSQL unavailable, sleeping..."\n\
  sleep 2\n\
done\n\
echo "PostgreSQL ready!"\n\
\n\
echo "Running migrations..."\n\
python manage.py migrate --noinput\n\
\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput --clear\n\
\n\
echo "Starting server..."\n\
exec python start_server.py\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Environment variables (can be overridden)
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV DOCKER_CONTAINER=true

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/admin/login/?next=/admin/')" || exit 1

# Use entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]