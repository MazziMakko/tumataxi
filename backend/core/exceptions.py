"""
MAKKO INTELLIGENCE - ULTRA-SECURE EXCEPTION HANDLING
Comprehensive error handling with security-first approach
Zero information leakage, maximum protection
"""

import traceback
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog

logger = structlog.get_logger(__name__)

class BaseSecurityException(Exception):
    """Base security exception with enhanced logging"""
    
    def __init__(
        self,
        message: str,
        error_code: str = "SECURITY_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        self.user_id = user_id
        self.request_id = request_id or str(uuid.uuid4())
        self.timestamp = datetime.now(timezone.utc)
        
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for logging"""
        return {
            "error_code": self.error_code,
            "message": self.message,
            "status_code": self.status_code,
            "details": self.details,
            "user_id": self.user_id,
            "request_id": self.request_id,
            "timestamp": self.timestamp.isoformat()
        }
    
    def get_public_message(self) -> str:
        """Get sanitized message safe for public consumption"""
        # Override in subclasses for specific public messages
        return "An error occurred while processing your request"

class AuthenticationException(BaseSecurityException):
    """Authentication-related exceptions"""
    
    def __init__(self, message: str = "Authentication failed", **kwargs):
        super().__init__(
            message=message,
            error_code="AUTH_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return "Authentication required"

class AuthorizationException(BaseSecurityException):
    """Authorization-related exceptions"""
    
    def __init__(self, message: str = "Access denied", **kwargs):
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN,
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return "Access denied"

class ValidationException(BaseSecurityException):
    """Input validation exceptions"""
    
    def __init__(self, message: str = "Validation failed", field_errors: Optional[List[Dict]] = None, **kwargs):
        self.field_errors = field_errors or []
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"field_errors": self.field_errors},
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return "Invalid input data"

class RateLimitException(BaseSecurityException):
    """Rate limiting exceptions"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = 300, **kwargs):
        self.retry_after = retry_after
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"retry_after": retry_after},
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return f"Rate limit exceeded. Try again in {self.retry_after} seconds"

class SecurityThreatException(BaseSecurityException):
    """Security threat detection exceptions"""
    
    def __init__(self, message: str = "Security threat detected", threat_type: str = "unknown", **kwargs):
        self.threat_type = threat_type
        super().__init__(
            message=message,
            error_code="SECURITY_THREAT",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"threat_type": threat_type},
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return "Request blocked for security reasons"

class DatabaseException(BaseSecurityException):
    """Database-related exceptions"""
    
    def __init__(self, message: str = "Database error", operation: str = "unknown", **kwargs):
        self.operation = operation
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"operation": operation},
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return "Service temporarily unavailable"

class ExternalServiceException(BaseSecurityException):
    """External service integration exceptions"""
    
    def __init__(self, message: str = "External service error", service: str = "unknown", **kwargs):
        self.service = service
        super().__init__(
            message=message,
            error_code="EXTERNAL_SERVICE_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": service},
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return "External service temporarily unavailable"

class BusinessLogicException(BaseSecurityException):
    """Business logic validation exceptions"""
    
    def __init__(self, message: str = "Business rule violation", rule: str = "unknown", **kwargs):
        self.rule = rule
        super().__init__(
            message=message,
            error_code="BUSINESS_LOGIC_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"rule": rule},
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return self.message  # Business logic errors can be more specific

class ConfigurationException(BaseSecurityException):
    """Configuration-related exceptions"""
    
    def __init__(self, message: str = "Configuration error", config_key: str = "unknown", **kwargs):
        self.config_key = config_key
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"config_key": config_key},
            **kwargs
        )
    
    def get_public_message(self) -> str:
        return "Service configuration error"

class ErrorHandler:
    """
    Comprehensive error handler with security-first approach
    Prevents information leakage while maintaining detailed internal logging
    """
    
    def __init__(self):
        self.error_stats = {}
        self.sensitive_fields = {
            "password", "token", "secret", "key", "hash", "salt",
            "ssn", "credit_card", "api_key", "private_key"
        }
    
    async def handle_exception(
        self,
        request: Request,
        exc: Exception
    ) -> JSONResponse:
        """Main exception handler"""
        
        request_id = getattr(request.state, 'request_id', str(uuid.uuid4()))
        user_id = getattr(request.state, 'user_id', None)
        
        # Handle different exception types
        if isinstance(exc, BaseSecurityException):
            return await self._handle_security_exception(request, exc, request_id, user_id)
        elif isinstance(exc, RequestValidationError):
            return await self._handle_validation_error(request, exc, request_id, user_id)
        elif isinstance(exc, StarletteHTTPException):
            return await self._handle_http_exception(request, exc, request_id, user_id)
        else:
            return await self._handle_generic_exception(request, exc, request_id, user_id)
    
    async def _handle_security_exception(
        self,
        request: Request,
        exc: BaseSecurityException,
        request_id: str,
        user_id: Optional[str]
    ) -> JSONResponse:
        """Handle security exceptions"""
        
        # Log detailed error internally
        logger.error(
            "Security exception occurred",
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
            details=self._sanitize_details(exc.details),
            user_id=user_id,
            request_id=request_id,
            path=request.url.path,
            method=request.method,
            ip=self._get_client_ip(request)
        )
        
        # Update error statistics
        self._update_error_stats(exc.error_code)
        
        # Return sanitized response
        response_data = {
            "error": {
                "code": exc.error_code,
                "message": exc.get_public_message(),
                "request_id": request_id,
                "timestamp": exc.timestamp.isoformat()
            }
        }
        
        # Add specific headers for certain error types
        headers = {}
        if isinstance(exc, RateLimitException):
            headers["Retry-After"] = str(exc.retry_after)
        
        return JSONResponse(
            status_code=exc.status_code,
            content=response_data,
            headers=headers
        )
    
    async def _handle_validation_error(
        self,
        request: Request,
        exc: RequestValidationError,
        request_id: str,
        user_id: Optional[str]
    ) -> JSONResponse:
        """Handle Pydantic validation errors"""
        
        # Process validation errors
        field_errors = []
        for error in exc.errors():
            field_path = " -> ".join(str(loc) for loc in error["loc"])
            field_errors.append({
                "field": field_path,
                "message": error["msg"],
                "type": error["type"]
            })
        
        # Log validation error
        logger.warning(
            "Validation error occurred",
            field_errors=field_errors,
            user_id=user_id,
            request_id=request_id,
            path=request.url.path,
            method=request.method,
            ip=self._get_client_ip(request)
        )
        
        self._update_error_stats("VALIDATION_ERROR")
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid input data",
                    "field_errors": field_errors,
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    async def _handle_http_exception(
        self,
        request: Request,
        exc: StarletteHTTPException,
        request_id: str,
        user_id: Optional[str]
    ) -> JSONResponse:
        """Handle HTTP exceptions"""
        
        logger.info(
            "HTTP exception occurred",
            status_code=exc.status_code,
            detail=str(exc.detail),
            user_id=user_id,
            request_id=request_id,
            path=request.url.path,
            method=request.method,
            ip=self._get_client_ip(request)
        )
        
        self._update_error_stats(f"HTTP_{exc.status_code}")
        
        # Sanitize error message for security
        public_message = self._get_public_http_message(exc.status_code, str(exc.detail))
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": public_message,
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    async def _handle_generic_exception(
        self,
        request: Request,
        exc: Exception,
        request_id: str,
        user_id: Optional[str]
    ) -> JSONResponse:
        """Handle unexpected exceptions"""
        
        # Log full exception details internally
        logger.error(
            "Unexpected exception occurred",
            exception_type=type(exc).__name__,
            exception_message=str(exc),
            traceback=traceback.format_exc(),
            user_id=user_id,
            request_id=request_id,
            path=request.url.path,
            method=request.method,
            ip=self._get_client_ip(request)
        )
        
        self._update_error_stats("INTERNAL_ERROR")
        
        # Return generic error response
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    
    def _sanitize_details(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from error details"""
        
        if not details:
            return {}
        
        sanitized = {}
        for key, value in details.items():
            if any(sensitive in key.lower() for sensitive in self.sensitive_fields):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_details(value)
            elif isinstance(value, str) and len(value) > 100:
                # Truncate very long strings
                sanitized[key] = value[:100] + "..."
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    def _get_public_http_message(self, status_code: int, detail: str) -> str:
        """Get public-safe HTTP error message"""
        
        public_messages = {
            400: "Bad request",
            401: "Authentication required",
            403: "Access denied",
            404: "Resource not found",
            405: "Method not allowed",
            409: "Conflict",
            413: "Request too large",
            422: "Invalid input data",
            429: "Too many requests",
            500: "Internal server error",
            502: "Bad gateway",
            503: "Service unavailable",
            504: "Gateway timeout"
        }
        
        return public_messages.get(status_code, "An error occurred")
    
    def _update_error_stats(self, error_code: str):
        """Update error statistics"""
        
        current_time = datetime.now(timezone.utc)
        hour_key = current_time.strftime("%Y%m%d%H")
        
        if hour_key not in self.error_stats:
            self.error_stats[hour_key] = {}
        
        if error_code not in self.error_stats[hour_key]:
            self.error_stats[hour_key][error_code] = 0
        
        self.error_stats[hour_key][error_code] += 1
        
        # Clean old statistics (keep last 24 hours)
        cutoff_time = current_time - timedelta(hours=24)
        cutoff_key = cutoff_time.strftime("%Y%m%d%H")
        
        keys_to_remove = [key for key in self.error_stats.keys() if key < cutoff_key]
        for key in keys_to_remove:
            del self.error_stats[key]
    
    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics"""
        
        total_errors = 0
        error_breakdown = {}
        
        for hour_stats in self.error_stats.values():
            for error_code, count in hour_stats.items():
                total_errors += count
                if error_code not in error_breakdown:
                    error_breakdown[error_code] = 0
                error_breakdown[error_code] += count
        
        return {
            "total_errors": total_errors,
            "error_breakdown": error_breakdown,
            "hourly_stats": self.error_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

class InputValidator:
    """
    Comprehensive input validation with security focus
    Prevents injection attacks and validates business rules
    """
    
    def __init__(self):
        self.sql_injection_patterns = [
            r"union\s+select", r"drop\s+table", r"insert\s+into",
            r"delete\s+from", r"update\s+set", r"exec\s*\(",
            r"sp_executesql", r"xp_cmdshell", r"--", r"/\*", r"\*/"
        ]
        
        self.xss_patterns = [
            r"<script[^>]*>", r"javascript:", r"onload\s*=",
            r"onerror\s*=", r"onclick\s*=", r"eval\s*\(",
            r"expression\s*\(", r"vbscript:", r"data:text/html"
        ]
        
        self.path_traversal_patterns = [
            r"\.\.\/", r"\.\.\\", r"%2e%2e%2f", r"%2e%2e%5c",
            r"..%2f", r"..%5c", r"%252e%252e%252f"
        ]
    
    def validate_string_input(
        self,
        value: str,
        field_name: str,
        min_length: int = 0,
        max_length: int = 1000,
        allow_html: bool = False,
        check_sql_injection: bool = True,
        check_xss: bool = True,
        check_path_traversal: bool = True
    ) -> List[str]:
        """Comprehensive string validation"""
        
        errors = []
        
        if not isinstance(value, str):
            errors.append(f"{field_name} must be a string")
            return errors
        
        # Length validation
        if len(value) < min_length:
            errors.append(f"{field_name} must be at least {min_length} characters long")
        
        if len(value) > max_length:
            errors.append(f"{field_name} must be no more than {max_length} characters long")
        
        # Security validations
        if check_sql_injection and self._contains_sql_injection(value):
            errors.append(f"{field_name} contains potentially malicious content")
            logger.warning("SQL injection attempt detected", field=field_name, value=value[:100])
        
        if check_xss and not allow_html and self._contains_xss(value):
            errors.append(f"{field_name} contains potentially malicious content")
            logger.warning("XSS attempt detected", field=field_name, value=value[:100])
        
        if check_path_traversal and self._contains_path_traversal(value):
            errors.append(f"{field_name} contains invalid path characters")
            logger.warning("Path traversal attempt detected", field=field_name, value=value[:100])
        
        return errors
    
    def validate_email(self, email: str, field_name: str = "email") -> List[str]:
        """Validate email address"""
        
        errors = []
        
        if not email:
            errors.append(f"{field_name} is required")
            return errors
        
        # Basic format validation
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            errors.append(f"{field_name} format is invalid")
        
        # Length validation
        if len(email) > 255:
            errors.append(f"{field_name} is too long")
        
        # Security validation
        errors.extend(self.validate_string_input(
            email, field_name, min_length=5, max_length=255,
            check_sql_injection=True, check_xss=True
        ))
        
        return errors
    
    def validate_phone(self, phone: str, field_name: str = "phone") -> List[str]:
        """Validate phone number"""
        
        errors = []
        
        if not phone:
            return errors  # Phone is often optional
        
        # Remove common formatting characters
        cleaned_phone = re.sub(r'[^\d+]', '', phone)
        
        # Basic validation
        if not cleaned_phone:
            errors.append(f"{field_name} format is invalid")
            return errors
        
        # Length validation (international format)
        if len(cleaned_phone) < 7 or len(cleaned_phone) > 15:
            errors.append(f"{field_name} length is invalid")
        
        # Pattern validation
        phone_pattern = r'^\+?[1-9]\d{1,14}$'
        if not re.match(phone_pattern, cleaned_phone):
            errors.append(f"{field_name} format is invalid")
        
        return errors
    
    def validate_password(self, password: str, field_name: str = "password") -> List[str]:
        """Validate password strength"""
        
        from ..core.security import PasswordValidator
        
        validation_result = PasswordValidator.validate_password(password)
        
        if not validation_result["is_valid"]:
            return validation_result["errors"]
        
        return []
    
    def validate_uuid(self, uuid_str: str, field_name: str = "id") -> List[str]:
        """Validate UUID format"""
        
        errors = []
        
        if not uuid_str:
            errors.append(f"{field_name} is required")
            return errors
        
        try:
            uuid.UUID(uuid_str)
        except ValueError:
            errors.append(f"{field_name} format is invalid")
        
        return errors
    
    def _contains_sql_injection(self, value: str) -> bool:
        """Check for SQL injection patterns"""
        
        import re
        value_lower = value.lower()
        
        for pattern in self.sql_injection_patterns:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True
        
        return False
    
    def _contains_xss(self, value: str) -> bool:
        """Check for XSS patterns"""
        
        import re
        value_lower = value.lower()
        
        for pattern in self.xss_patterns:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True
        
        return False
    
    def _contains_path_traversal(self, value: str) -> bool:
        """Check for path traversal patterns"""
        
        import re
        
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                return True
        
        return False

# Global instances
error_handler = ErrorHandler()
input_validator = InputValidator()

# Convenience functions
def raise_auth_error(message: str = "Authentication failed", **kwargs):
    """Raise authentication exception"""
    raise AuthenticationException(message, **kwargs)

def raise_authz_error(message: str = "Access denied", **kwargs):
    """Raise authorization exception"""
    raise AuthorizationException(message, **kwargs)

def raise_validation_error(message: str = "Validation failed", field_errors: List[Dict] = None, **kwargs):
    """Raise validation exception"""
    raise ValidationException(message, field_errors=field_errors, **kwargs)

def raise_rate_limit_error(message: str = "Rate limit exceeded", retry_after: int = 300, **kwargs):
    """Raise rate limit exception"""
    raise RateLimitException(message, retry_after=retry_after, **kwargs)

def raise_security_threat(message: str = "Security threat detected", threat_type: str = "unknown", **kwargs):
    """Raise security threat exception"""
    raise SecurityThreatException(message, threat_type=threat_type, **kwargs)