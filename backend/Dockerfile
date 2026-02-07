# MAKKO INTELLIGENCE - ULTRA-SECURE AUTHENTICATION SYSTEM
# Production-ready Docker image with security hardening
# Multi-stage build for minimal attack surface

# Build stage
FROM python:3.11-slim as builder

# Security: Create non-root user
RUN groupadd -r makko && useradd -r -g makko makko

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY auth_requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r auth_requirements.txt

# Production stage
FROM python:3.11-slim

# Security: Create non-root user
RUN groupadd -r makko && useradd -r -g makko makko

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy Python packages from builder
COPY --from=builder /root/.local /home/makko/.local

# Set working directory
WORKDIR /app

# Copy application code
COPY backend/ ./backend/
COPY auth_requirements.txt .

# Create necessary directories
RUN mkdir -p /app/logs /app/data && \
    chown -R makko:makko /app

# Security: Switch to non-root user
USER makko

# Set environment variables
ENV PYTHONPATH=/app
ENV PATH=/home/makko/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]