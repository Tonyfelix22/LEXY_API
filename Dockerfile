# LEXIE ERP - Django Backend Only
# Frontend is deployed separately on Vercel

FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django project files
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

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start command
CMD ["python", "start_server.py"]
