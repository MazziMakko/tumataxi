"""
MAKKO INTELLIGENCE - ULTRA-SECURE DATABASE LAYER
Production-ready database configuration with connection pooling and security
"""

import os
from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import redis
import structlog

logger = structlog.get_logger(__name__)

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/tumataxi_auth")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create SQLAlchemy engine with optimized settings
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,          # Number of connections to maintain
    max_overflow=30,       # Additional connections when pool is full
    pool_pre_ping=True,    # Validate connections before use
    pool_recycle=3600,     # Recycle connections every hour
    echo=False,            # Set to True for SQL debugging
    future=True            # Use SQLAlchemy 2.0 style
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

# Base class for models
Base = declarative_base()

# Redis client
redis_client = None

def get_redis_client() -> redis.Redis:
    """Get Redis client instance"""
    global redis_client
    
    if redis_client is None:
        redis_client = redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
    
    return redis_client

def get_db() -> Generator[Session, None, None]:
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database event listeners for security and monitoring
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set database connection parameters for security"""
    if "sqlite" in str(engine.url):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

@event.listens_for(engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log SQL queries in development"""
    if os.getenv("ENVIRONMENT", "development").lower() in ["development", "dev"]:
        logger.debug("SQL Query", statement=statement[:200])

# Initialize database
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)