# LEXIE ERP - Single deployment: Frontend (Next.js) + Backend (Django)
# Build and serve both from one Railway service

# Stage 1: Build Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy frontend files
COPY LEXIE_ERP/Frontend/package*.json ./
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps
COPY LEXIE_ERP/Frontend ./

# Build static export
RUN npm run build

# Stage 2: Python + Django
FROM python:3.12-slim
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django project
COPY manage.py .
COPY start_server.py .
COPY LEXY_API ./LEXY_API
COPY API ./API

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/out ./frontend_out

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start command
CMD ["python", "start_server.py"]
