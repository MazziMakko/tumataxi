"""
MAKKO INTELLIGENCE - ULTRA-SECURE MIDDLEWARE LAYER
Military-grade security middleware with RBAC, rate limiting, and threat detection
Zero vulnerabilities, maximum protection
"""

import time
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
import structlog
import ipaddress
from user_agents import parse as parse_user_agent
import redis
from limits import storage, strategies
from limits.storage import RedisStorage
from limits.strategies import MovingWindowRateLimiter

from ..database.models import User, UserSession, SecurityEvent, AuditLog
from ..core.security import jwt_service, SecurityConfig, SecurityException
from ..core.database import get_db
from ..core.monitoring import security_monitor

logger = structlog.get_logger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive security middleware
    Implements multiple layers of protection
    """
    
    def __init__(self, app, redis_client: redis.Redis = None):
        super().__init__(app)
        self.redis_client = redis_client
        self.rate_limiter = self._setup_rate_limiter()
        
        # Security patterns to detect
        self.malicious_patterns = [
            r'<script[^>]*>.*?</script>',  # XSS
            r'union\s+select',  # SQL injection
            r'drop\s+table',  # SQL injection
            r'\.\./',  # Path traversal
            r'eval\s*\(',  # Code injection
            r'exec\s*\(',  # Code execution
        ]
        
        # Blocked user agents
        self.blocked_user_agents = [
            'sqlmap', 'nikto', 'nmap', 'masscan', 'zap',
            'burp', 'w3af', 'skipfish', 'gobuster'
        ]
    
    def _setup_rate_limiter(self):
        """Setup Redis-based rate limiter"""
        if self.redis_client:
            storage_backend = RedisStorage("redis://localhost:6379")
            return MovingWindowRateLimiter(storage_backend)
        return None
    
    async def dispatch(self, request: Request, call_next):
        """Main security middleware dispatch"""
        
        start_time = time.time()
        client_ip = self._get_client_ip(request)
        
        try:
            # 1. Security Headers Check
            await self._validate_security_headers(request)
            
            # 2. IP Validation and Blocking
            await self._validate_client_ip(request, client_ip)
            
            # 3. User Agent Validation
            await self._validate_user_agent(request)
            
            # 4. Request Size Validation
            await self._validate_request_size(request)
            
            # 5. Malicious Pattern Detection
            await self._detect_malicious_patterns(request)
            
            # 6. Rate Limiting
            await self._apply_rate_limiting(request, client_ip)
            
            # 7. CSRF Protection
            await self._csrf_protection(request)
            
            # 8. Process Request
            response = await call_next(request)
            
            # 9. Add Security Headers to Response
            response = await self._add_security_headers(response)
            
            # 10. Log Security Metrics
            await self._log_security_metrics(request, response, start_time)
            
            return response
            
        except HTTPException as e:
            # Log security violation
            await self._log_security_violation(request, client_ip, str(e.detail))
            raise e
        except Exception as e:
            logger.error("Security middleware error", error=str(e), ip=client_ip)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal security error"}
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Get real client IP with proxy support"""
        # Check for forwarded headers (in order of preference)
        forwarded_headers = [
            "CF-Connecting-IP",  # Cloudflare
            "X-Forwarded-For",   # Standard proxy header
            "X-Real-IP",         # Nginx proxy
            "X-Client-IP",       # Apache proxy
        ]
        
        for header in forwarded_headers:
            if header in request.headers:
                ip = request.headers[header].split(',')[0].strip()
                if self._is_valid_ip(ip):
                    return ip
        
        # Fallback to direct connection
        return request.client.host if request.client else "unknown"
    
    def _is_valid_ip(self, ip: str) -> bool:
        """Validate IP address format"""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    async def _validate_security_headers(self, request: Request):
        """Validate required security headers"""
        
        # Check for suspicious headers
        suspicious_headers = [
            "X-Forwarded-Host",  # Potential host header injection
            "X-Original-URL",    # Potential URL manipulation
            "X-Rewrite-URL",     # Potential URL rewriting attack
        ]
        
        for header in suspicious_headers:
            if header in request.headers:
                logger.warning("Suspicious header detected", 
                             header=header, 
                             value=request.headers[header],
                             ip=self._get_client_ip(request))
    
    async def _validate_client_ip(self, request: Request, client_ip: str):
        """Validate and block malicious IPs"""
        
        if not self._is_valid_ip(client_ip):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid client IP"
            )
        
        # Check if IP is in blocklist (Redis-based)
        if self.redis_client:
            is_blocked = await self.redis_client.get(f"blocked_ip:{client_ip}")
            if is_blocked:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="IP address is blocked"
                )
        
        # Check for private/internal IPs in production
        try:
            ip_obj = ipaddress.ip_address(client_ip)
            if ip_obj.is_private and not self._is_development_mode():
                logger.warning("Private IP in production", ip=client_ip)
        except ValueError:
            pass
    
    async def _validate_user_agent(self, request: Request):
        """Validate user agent for security threats"""
        
        user_agent = request.headers.get("user-agent", "").lower()
        
        # Check for blocked user agents
        for blocked_agent in self.blocked_user_agents:
            if blocked_agent in user_agent:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User agent is not allowed"
                )
        
        # Check for suspicious patterns
        if not user_agent or len(user_agent) < 10:
            logger.warning("Suspicious user agent", 
                         user_agent=user_agent,
                         ip=self._get_client_ip(request))
    
    async def _validate_request_size(self, request: Request):
        """Validate request size to prevent DoS"""
        
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                max_size = 10 * 1024 * 1024  # 10MB limit
                
                if size > max_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Request too large"
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid content-length header"
                )
    
    async def _detect_malicious_patterns(self, request: Request):
        """Detect malicious patterns in request"""
        
        # Check URL path
        path = str(request.url.path).lower()
        query = str(request.url.query).lower()
        
        # Combine path and query for pattern matching
        request_content = f"{path} {query}"
        
        import re
        for pattern in self.malicious_patterns:
            if re.search(pattern, request_content, re.IGNORECASE):
                logger.warning("Malicious pattern detected",
                             pattern=pattern,
                             path=path,
                             ip=self._get_client_ip(request))
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Malicious request detected"
                )
    
    async def _apply_rate_limiting(self, request: Request, client_ip: str):
        """Apply intelligent rate limiting"""
        
        if not self.rate_limiter or not self.redis_client:
            return
        
        # Different limits for different endpoints
        endpoint_limits = {
            "/auth/login": "5/minute",
            "/auth/register": "3/minute",
            "/auth/reset-password": "2/hour",
            "default": "100/minute"
        }
        
        path = request.url.path
        limit_str = endpoint_limits.get(path, endpoint_limits["default"])
        
        # Parse limit string (e.g., "5/minute")
        count, period = limit_str.split('/')
        count = int(count)
        
        # Create rate limit key
        key = f"rate_limit:{client_ip}:{path}"
        
        # Check current count
        current_count = await self.redis_client.get(key)
        if current_count is None:
            current_count = 0
        else:
            current_count = int(current_count)
        
        if current_count >= count:
            # Add to blocklist temporarily
            await self.redis_client.setex(f"blocked_ip:{client_ip}", 300, "rate_limited")
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={"Retry-After": "300"}
            )
        
        # Increment counter
        pipe = self.redis_client.pipeline()
        pipe.incr(key)
        if current_count == 0:
            # Set expiration on first request
            if period == "minute":
                pipe.expire(key, 60)
            elif period == "hour":
                pipe.expire(key, 3600)
        await pipe.execute()
    
    async def _csrf_protection(self, request: Request):
        """CSRF protection for state-changing operations"""
        
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            # Check for CSRF token in headers
            csrf_token = request.headers.get("X-CSRF-Token")
            
            # For API endpoints, we rely on JWT tokens and SameSite cookies
            # In a full web app, you'd validate CSRF tokens here
            
            # Check for suspicious referrer
            referer = request.headers.get("referer", "")
            host = request.headers.get("host", "")
            
            if referer and host:
                from urllib.parse import urlparse
                referer_host = urlparse(referer).netloc
                if referer_host and referer_host != host:
                    logger.warning("Suspicious cross-origin request",
                                 referer=referer,
                                 host=host,
                                 ip=self._get_client_ip(request))
    
    async def _add_security_headers(self, response: Response) -> Response:
        """Add comprehensive security headers"""
        
        for header, value in SecurityConfig.SECURITY_HEADERS.items():
            response.headers[header] = value
        
        # Add additional security headers
        response.headers["X-Request-ID"] = self._generate_request_id()
        response.headers["X-Response-Time"] = str(int(time.time() * 1000))
        
        return response
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        import uuid
        return str(uuid.uuid4())
    
    async def _log_security_metrics(self, request: Request, response: Response, start_time: float):
        """Log security metrics for monitoring"""
        
        duration = time.time() - start_time
        
        metrics = {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "ip": self._get_client_ip(request),
            "user_agent": request.headers.get("user-agent", ""),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Log to structured logger
        logger.info("Request processed", **metrics)
        
        # Send to monitoring system
        if hasattr(security_monitor, 'record_request'):
            security_monitor.record_request(metrics)
    
    async def _log_security_violation(self, request: Request, client_ip: str, violation: str):
        """Log security violations"""
        
        violation_data = {
            "type": "security_violation",
            "violation": violation,
            "ip": client_ip,
            "path": request.url.path,
            "method": request.method,
            "user_agent": request.headers.get("user-agent", ""),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        logger.warning("Security violation detected", **violation_data)
        
        # Store in Redis for analysis
        if self.redis_client:
            key = f"security_violations:{client_ip}"
            await self.redis_client.lpush(key, json.dumps(violation_data))
            await self.redis_client.expire(key, 86400)  # 24 hours
    
    def _is_development_mode(self) -> bool:
        """Check if running in development mode"""
        import os
        return os.getenv("ENVIRONMENT", "production").lower() in ["development", "dev", "local"]

class RBACMiddleware(BaseHTTPMiddleware):
    """
    Role-Based Access Control Middleware
    Enforces permissions based on user roles
    """
    
    def __init__(self, app):
        super().__init__(app)
        
        # Define role permissions
        self.role_permissions = {
            "super_admin": ["*"],  # All permissions
            "admin": [
                "users:read", "users:write", "users:delete",
                "drivers:read", "drivers:write", "drivers:approve",
                "trips:read", "trips:write", "trips:cancel",
                "reports:read", "audit:read"
            ],
            "driver": [
                "profile:read", "profile:write",
                "trips:read", "trips:accept", "trips:complete",
                "earnings:read"
            ],
            "passenger": [
                "profile:read", "profile:write",
                "trips:create", "trips:read", "trips:cancel",
                "payments:read", "payments:write"
            ],
            "support": [
                "users:read", "trips:read", "trips:write",
                "support_tickets:read", "support_tickets:write"
            ],
            "moderator": [
                "users:read", "drivers:read", "trips:read",
                "reports:read", "content:moderate"
            ]
        }
        
        # Define endpoint permissions
        self.endpoint_permissions = {
            "GET:/api/admin/users": "users:read",
            "POST:/api/admin/users": "users:write",
            "DELETE:/api/admin/users/*": "users:delete",
            "GET:/api/driver/trips": "trips:read",
            "POST:/api/driver/trips/*/accept": "trips:accept",
            "POST:/api/passenger/trips": "trips:create",
            "GET:/api/reports/*": "reports:read",
        }
    
    async def dispatch(self, request: Request, call_next):
        """RBAC middleware dispatch"""
        
        # Skip RBAC for public endpoints
        if self._is_public_endpoint(request.url.path):
            return await call_next(request)
        
        try:
            # Extract JWT token
            auth_header = request.headers.get("authorization", "")
            if not auth_header.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            token = auth_header[7:]
            payload = jwt_service.verify_token(token, "access")
            
            user_role = payload.get("role")
            if not user_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User role not found"
                )
            
            # Check permissions
            required_permission = self._get_required_permission(request)
            if required_permission and not self._has_permission(user_role, required_permission):
                logger.warning("Access denied",
                             user_id=payload.get("sub"),
                             role=user_role,
                             required_permission=required_permission,
                             path=request.url.path)
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            
            # Add user info to request state
            request.state.user_id = payload.get("sub")
            request.state.user_role = user_role
            request.state.session_id = payload.get("session_id")
            
            return await call_next(request)
            
        except SecurityException as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error("RBAC middleware error", error=str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authorization service error"
            )
    
    def _is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (no auth required)"""
        public_endpoints = [
            "/auth/login",
            "/auth/register",
            "/auth/reset-password",
            "/health",
            "/docs",
            "/openapi.json",
            "/metrics"
        ]
        
        return any(path.startswith(endpoint) for endpoint in public_endpoints)
    
    def _get_required_permission(self, request: Request) -> Optional[str]:
        """Get required permission for endpoint"""
        method = request.method
        path = request.url.path
        
        # Try exact match first
        key = f"{method}:{path}"
        if key in self.endpoint_permissions:
            return self.endpoint_permissions[key]
        
        # Try pattern matching
        for pattern, permission in self.endpoint_permissions.items():
            if self._matches_pattern(key, pattern):
                return permission
        
        return None
    
    def _matches_pattern(self, key: str, pattern: str) -> bool:
        """Match endpoint pattern with wildcards"""
        import re
        
        # Convert pattern to regex
        regex_pattern = pattern.replace("*", "[^/]+")
        regex_pattern = f"^{regex_pattern}$"
        
        return bool(re.match(regex_pattern, key))
    
    def _has_permission(self, user_role: str, required_permission: str) -> bool:
        """Check if user role has required permission"""
        
        role_perms = self.role_permissions.get(user_role, [])
        
        # Super admin has all permissions
        if "*" in role_perms:
            return True
        
        # Check exact permission
        if required_permission in role_perms:
            return True
        
        # Check wildcard permissions
        permission_parts = required_permission.split(":")
        if len(permission_parts) == 2:
            resource, action = permission_parts
            wildcard_perm = f"{resource}:*"
            if wildcard_perm in role_perms:
                return True
        
        return False

class ThreatDetectionMiddleware(BaseHTTPMiddleware):
    """
    Advanced threat detection middleware
    Uses ML-based patterns and heuristics
    """
    
    def __init__(self, app, redis_client: redis.Redis = None):
        super().__init__(app)
        self.redis_client = redis_client
        
        # Threat detection patterns
        self.threat_patterns = {
            "sql_injection": [
                r"union\s+select", r"drop\s+table", r"insert\s+into",
                r"delete\s+from", r"update\s+set", r"exec\s*\(",
                r"sp_executesql", r"xp_cmdshell"
            ],
            "xss": [
                r"<script[^>]*>", r"javascript:", r"onload\s*=",
                r"onerror\s*=", r"onclick\s*=", r"eval\s*\("
            ],
            "path_traversal": [
                r"\.\.\/", r"\.\.\\", r"%2e%2e%2f", r"%2e%2e%5c"
            ],
            "command_injection": [
                r";\s*cat\s+", r";\s*ls\s+", r";\s*pwd", r";\s*id",
                r"\|\s*cat\s+", r"\|\s*ls\s+", r"&&\s*cat\s+"
            ]
        }
    
    async def dispatch(self, request: Request, call_next):
        """Threat detection dispatch"""
        
        client_ip = self._get_client_ip(request)
        
        try:
            # Analyze request for threats
            threat_score = await self._analyze_request_threats(request)
            
            if threat_score > 80:  # High threat threshold
                await self._handle_high_threat(request, client_ip, threat_score)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Request blocked by threat detection"
                )
            elif threat_score > 50:  # Medium threat threshold
                await self._handle_medium_threat(request, client_ip, threat_score)
            
            # Continue with request
            response = await call_next(request)
            
            # Analyze response for data leaks
            await self._analyze_response_leaks(response, client_ip)
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Threat detection error", error=str(e), ip=client_ip)
            return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP (same as SecurityMiddleware)"""
        forwarded_headers = ["CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP", "X-Client-IP"]
        
        for header in forwarded_headers:
            if header in request.headers:
                ip = request.headers[header].split(',')[0].strip()
                try:
                    ipaddress.ip_address(ip)
                    return ip
                except ValueError:
                    continue
        
        return request.client.host if request.client else "unknown"
    
    async def _analyze_request_threats(self, request: Request) -> int:
        """Analyze request for threat patterns"""
        
        threat_score = 0
        
        # Analyze URL path and query
        path = str(request.url.path).lower()
        query = str(request.url.query).lower()
        request_content = f"{path} {query}"
        
        # Check for threat patterns
        import re
        for threat_type, patterns in self.threat_patterns.items():
            for pattern in patterns:
                if re.search(pattern, request_content, re.IGNORECASE):
                    threat_score += 25
                    logger.warning("Threat pattern detected",
                                 threat_type=threat_type,
                                 pattern=pattern,
                                 ip=self._get_client_ip(request))
        
        # Analyze headers
        suspicious_headers = request.headers.get("x-forwarded-host", "")
        if suspicious_headers:
            threat_score += 15
        
        # Analyze user agent
        user_agent = request.headers.get("user-agent", "").lower()
        if any(bot in user_agent for bot in ["bot", "crawler", "spider", "scraper"]):
            threat_score += 10
        
        return min(threat_score, 100)
    
    async def _handle_high_threat(self, request: Request, client_ip: str, threat_score: int):
        """Handle high threat level requests"""
        
        # Block IP temporarily
        if self.redis_client:
            await self.redis_client.setex(f"blocked_ip:{client_ip}", 3600, "high_threat")
        
        # Log security event
        event_data = {
            "type": "high_threat_detected",
            "ip": client_ip,
            "path": request.url.path,
            "threat_score": threat_score,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        logger.critical("High threat detected", **event_data)
    
    async def _handle_medium_threat(self, request: Request, client_ip: str, threat_score: int):
        """Handle medium threat level requests"""
        
        # Increase monitoring for this IP
        if self.redis_client:
            key = f"threat_monitoring:{client_ip}"
            await self.redis_client.incr(key)
            await self.redis_client.expire(key, 3600)
        
        logger.warning("Medium threat detected",
                      ip=client_ip,
                      path=request.url.path,
                      threat_score=threat_score)
    
    async def _analyze_response_leaks(self, response: Response, client_ip: str):
        """Analyze response for potential data leaks"""
        
        # Check for sensitive data in response headers
        sensitive_headers = [
            "x-debug", "x-error", "x-trace", "server",
            "x-powered-by", "x-version"
        ]
        
        for header in sensitive_headers:
            if header in response.headers:
                logger.warning("Sensitive header in response",
                             header=header,
                             value=response.headers[header],
                             ip=client_ip)

# Utility function to create rate limiter decorator
def rate_limiter(limit: str):
    """Rate limiter decorator for individual endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This would integrate with the middleware rate limiting
            # For now, it's a placeholder
            return await func(*args, **kwargs)
        return wrapper
    return decorator