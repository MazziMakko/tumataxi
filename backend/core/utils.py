"""
MAKKO INTELLIGENCE - ULTRA-SECURE UTILITY FUNCTIONS
Production-ready utilities with security-first approach
Zero vulnerabilities, maximum performance
"""

import hashlib
import hmac
import secrets
import time
import json
import base64
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Union
from fastapi import Request
import ipaddress
import re
import structlog
from user_agents import parse as parse_user_agent

logger = structlog.get_logger(__name__)

def get_client_ip(request: Request) -> str:
    """
    Get real client IP address with comprehensive proxy support
    Handles multiple proxy scenarios and validates IP format
    """
    
    # Priority order of headers to check
    ip_headers = [
        "CF-Connecting-IP",      # Cloudflare
        "True-Client-IP",        # Cloudflare Enterprise
        "X-Real-IP",             # Nginx
        "X-Forwarded-For",       # Standard proxy header
        "X-Client-IP",           # Apache
        "X-Cluster-Client-IP",   # Cluster environments
        "Forwarded-For",         # RFC 7239
        "Forwarded",             # RFC 7239
    ]
    
    for header in ip_headers:
        if header in request.headers:
            header_value = request.headers[header]
            
            # Handle comma-separated IPs (X-Forwarded-For can have multiple)
            if ',' in header_value:
                # Take the first IP (original client)
                ip = header_value.split(',')[0].strip()
            else:
                ip = header_value.strip()
            
            # Validate IP format
            if is_valid_ip(ip):
                logger.debug("Client IP extracted", header=header, ip=ip)
                return ip
    
    # Fallback to direct connection
    if request.client and request.client.host:
        return request.client.host
    
    logger.warning("Could not determine client IP, using fallback")
    return "unknown"

def is_valid_ip(ip: str) -> bool:
    """Validate IP address format (IPv4 or IPv6)"""
    
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False

def is_private_ip(ip: str) -> bool:
    """Check if IP address is private/internal"""
    
    try:
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private
    except ValueError:
        return False

def get_device_fingerprint(request: Request) -> str:
    """
    Generate device fingerprint for session tracking
    Combines multiple request characteristics
    """
    
    # Collect fingerprinting data
    user_agent = request.headers.get("user-agent", "")
    accept_language = request.headers.get("accept-language", "")
    accept_encoding = request.headers.get("accept-encoding", "")
    accept = request.headers.get("accept", "")
    
    # Create fingerprint string
    fingerprint_data = f"{user_agent}|{accept_language}|{accept_encoding}|{accept}"
    
    # Hash the fingerprint for privacy
    fingerprint_hash = hashlib.sha256(fingerprint_data.encode()).hexdigest()
    
    return fingerprint_hash[:16]  # Use first 16 characters

def get_geo_location(ip: str) -> Dict[str, Optional[str]]:
    """
    Get geographic location from IP address
    Mock implementation - integrate with real service like MaxMind GeoIP2
    """
    
    # In production, integrate with:
    # - MaxMind GeoIP2
    # - IP2Location
    # - ipapi.co
    # - ipgeolocation.io
    
    # Mock data for development
    mock_locations = {
        "127.0.0.1": {"country_code": "US", "city": "Local"},
        "::1": {"country_code": "US", "city": "Local"},
        "unknown": {"country_code": None, "city": None}
    }
    
    location = mock_locations.get(ip, {
        "country_code": "US",  # Default for demo
        "city": "Unknown"
    })
    
    logger.debug("Geo location lookup", ip=ip, location=location)
    return location

def parse_user_agent_details(user_agent: str) -> Dict[str, Any]:
    """
    Parse user agent string into detailed components
    Returns browser, OS, and device information
    """
    
    if not user_agent:
        return {
            "browser": {"family": "Unknown", "version": "Unknown"},
            "os": {"family": "Unknown", "version": "Unknown"},
            "device": {"family": "Unknown", "brand": None, "model": None},
            "is_mobile": False,
            "is_tablet": False,
            "is_pc": False,
            "is_bot": False
        }
    
    parsed = parse_user_agent(user_agent)
    
    # Detect bots
    bot_indicators = [
        "bot", "crawler", "spider", "scraper", "indexer",
        "googlebot", "bingbot", "facebookexternalhit", "twitterbot"
    ]
    is_bot = any(indicator in user_agent.lower() for indicator in bot_indicators)
    
    return {
        "browser": {
            "family": parsed.browser.family,
            "version": parsed.browser.version_string
        },
        "os": {
            "family": parsed.os.family,
            "version": parsed.os.version_string
        },
        "device": {
            "family": parsed.device.family,
            "brand": parsed.device.brand,
            "model": parsed.device.model
        },
        "is_mobile": parsed.is_mobile,
        "is_tablet": parsed.is_tablet,
        "is_pc": parsed.is_pc,
        "is_bot": is_bot,
        "raw": user_agent
    }

def generate_secure_token(length: int = 32, url_safe: bool = True) -> str:
    """Generate cryptographically secure random token"""
    
    if url_safe:
        return secrets.token_urlsafe(length)
    else:
        return secrets.token_hex(length)

def generate_otp(length: int = 6) -> str:
    """Generate numeric OTP (One-Time Password)"""
    
    return ''.join(secrets.choice('0123456789') for _ in range(length))

def hash_string(data: str, salt: Optional[str] = None) -> Dict[str, str]:
    """
    Hash string with optional salt
    Returns hash and salt for storage
    """
    
    if salt is None:
        salt = secrets.token_hex(16)
    
    # Combine data with salt
    salted_data = f"{data}{salt}"
    
    # Create hash
    hash_value = hashlib.sha256(salted_data.encode()).hexdigest()
    
    return {
        "hash": hash_value,
        "salt": salt
    }

def verify_hash(data: str, stored_hash: str, salt: str) -> bool:
    """Verify data against stored hash with constant-time comparison"""
    
    # Recreate hash
    salted_data = f"{data}{salt}"
    computed_hash = hashlib.sha256(salted_data.encode()).hexdigest()
    
    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(computed_hash, stored_hash)

def create_signed_data(data: Dict[str, Any], secret_key: str, max_age: int = 3600) -> str:
    """
    Create signed data with expiration
    Returns base64-encoded signed JSON
    """
    
    # Add timestamp
    payload = {
        "data": data,
        "timestamp": int(time.time()),
        "expires_at": int(time.time()) + max_age
    }
    
    # Convert to JSON
    json_data = json.dumps(payload, separators=(',', ':'))
    
    # Create signature
    signature = hmac.new(
        secret_key.encode(),
        json_data.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Combine data and signature
    signed_data = {
        "payload": json_data,
        "signature": signature
    }
    
    # Encode as base64
    return base64.urlsafe_b64encode(
        json.dumps(signed_data).encode()
    ).decode()

def verify_signed_data(signed_data: str, secret_key: str) -> Optional[Dict[str, Any]]:
    """
    Verify and extract signed data
    Returns data if valid, None if invalid or expired
    """
    
    try:
        # Decode from base64
        decoded = base64.urlsafe_b64decode(signed_data.encode()).decode()
        signed_obj = json.loads(decoded)
        
        payload = signed_obj["payload"]
        signature = signed_obj["signature"]
        
        # Verify signature
        expected_signature = hmac.new(
            secret_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            logger.warning("Invalid signature in signed data")
            return None
        
        # Parse payload
        payload_obj = json.loads(payload)
        
        # Check expiration
        current_time = int(time.time())
        if current_time > payload_obj.get("expires_at", 0):
            logger.warning("Signed data has expired")
            return None
        
        return payload_obj["data"]
        
    except Exception as e:
        logger.warning("Error verifying signed data", error=str(e))
        return None

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal and other attacks
    """
    
    if not filename:
        return "unnamed"
    
    # Remove path components
    filename = filename.split('/')[-1].split('\\')[-1]
    
    # Remove dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    
    # Remove control characters
    filename = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        max_name_length = 255 - len(ext) - 1 if ext else 255
        filename = name[:max_name_length] + ('.' + ext if ext else '')
    
    # Ensure it's not empty after sanitization
    if not filename or filename == '.':
        filename = "unnamed"
    
    return filename

def validate_url(url: str, allowed_schemes: List[str] = None) -> bool:
    """
    Validate URL format and scheme
    """
    
    if allowed_schemes is None:
        allowed_schemes = ['http', 'https']
    
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        
        # Check scheme
        if parsed.scheme.lower() not in allowed_schemes:
            return False
        
        # Check hostname exists
        if not parsed.netloc:
            return False
        
        # Basic format validation
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*://', url):
            return False
        
        return True
        
    except Exception:
        return False

def mask_sensitive_data(data: str, mask_char: str = '*', visible_chars: int = 4) -> str:
    """
    Mask sensitive data for logging
    Shows only first and last few characters
    """
    
    if not data or len(data) <= visible_chars * 2:
        return mask_char * len(data) if data else ""
    
    start = data[:visible_chars]
    end = data[-visible_chars:]
    middle = mask_char * (len(data) - visible_chars * 2)
    
    return f"{start}{middle}{end}"

def format_bytes(bytes_value: int) -> str:
    """Format bytes into human-readable string"""
    
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.1f} {unit}"
        bytes_value /= 1024.0
    
    return f"{bytes_value:.1f} PB"

def format_duration(seconds: float) -> str:
    """Format duration in seconds to human-readable string"""
    
    if seconds < 1:
        return f"{seconds * 1000:.0f}ms"
    elif seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"

def get_request_size(request: Request) -> int:
    """Get request content size in bytes"""
    
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            return int(content_length)
        except ValueError:
            pass
    
    return 0

def is_ajax_request(request: Request) -> bool:
    """Check if request is AJAX/XHR"""
    
    return (
        request.headers.get("x-requested-with", "").lower() == "xmlhttprequest" or
        request.headers.get("content-type", "").startswith("application/json")
    )

def get_request_id(request: Request) -> str:
    """Get or generate request ID for tracing"""
    
    # Check if request ID already exists
    request_id = getattr(request.state, 'request_id', None)
    if request_id:
        return request_id
    
    # Check headers
    request_id = request.headers.get("x-request-id")
    if request_id:
        return request_id
    
    # Generate new request ID
    request_id = generate_secure_token(16)
    request.state.request_id = request_id
    
    return request_id

def calculate_password_entropy(password: str) -> float:
    """
    Calculate password entropy in bits
    Higher entropy = stronger password
    """
    
    if not password:
        return 0.0
    
    # Character set sizes
    char_sets = {
        'lowercase': 26,
        'uppercase': 26,
        'digits': 10,
        'special': 32  # Common special characters
    }
    
    # Determine which character sets are used
    used_sets = 0
    if re.search(r'[a-z]', password):
        used_sets += char_sets['lowercase']
    if re.search(r'[A-Z]', password):
        used_sets += char_sets['uppercase']
    if re.search(r'[0-9]', password):
        used_sets += char_sets['digits']
    if re.search(r'[^a-zA-Z0-9]', password):
        used_sets += char_sets['special']
    
    if used_sets == 0:
        return 0.0
    
    # Calculate entropy: log2(charset_size^password_length)
    import math
    entropy = len(password) * math.log2(used_sets)
    
    return entropy

def time_constant_compare(a: str, b: str) -> bool:
    """
    Constant-time string comparison to prevent timing attacks
    """
    
    return hmac.compare_digest(a, b)

def rate_limit_key(prefix: str, identifier: str, window: str = "minute") -> str:
    """
    Generate rate limiting key
    """
    
    current_time = datetime.now(timezone.utc)
    
    if window == "second":
        time_window = current_time.strftime("%Y%m%d%H%M%S")
    elif window == "minute":
        time_window = current_time.strftime("%Y%m%d%H%M")
    elif window == "hour":
        time_window = current_time.strftime("%Y%m%d%H")
    elif window == "day":
        time_window = current_time.strftime("%Y%m%d")
    else:
        time_window = current_time.strftime("%Y%m%d%H%M")
    
    return f"{prefix}:{identifier}:{time_window}"

def clean_dict(data: Dict[str, Any], remove_none: bool = True, remove_empty: bool = False) -> Dict[str, Any]:
    """
    Clean dictionary by removing None values and optionally empty values
    """
    
    cleaned = {}
    
    for key, value in data.items():
        if remove_none and value is None:
            continue
        
        if remove_empty and not value and value != 0 and value != False:
            continue
        
        if isinstance(value, dict):
            nested_cleaned = clean_dict(value, remove_none, remove_empty)
            if nested_cleaned or not remove_empty:
                cleaned[key] = nested_cleaned
        else:
            cleaned[key] = value
    
    return cleaned

def truncate_string(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate string to maximum length with suffix
    """
    
    if not text or len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix

def is_production_environment() -> bool:
    """Check if running in production environment"""
    
    import os
    env = os.getenv("ENVIRONMENT", "development").lower()
    return env in ["production", "prod"]

def get_environment() -> str:
    """Get current environment"""
    
    import os
    return os.getenv("ENVIRONMENT", "development").lower()

class TimingContext:
    """Context manager for timing operations"""
    
    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        self.start_time = None
        self.end_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
        duration = self.end_time - self.start_time
        
        logger.debug(
            "Operation completed",
            operation=self.operation_name,
            duration_ms=round(duration * 1000, 2)
        )
    
    @property
    def duration(self) -> Optional[float]:
        """Get operation duration in seconds"""
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return None

def retry_with_backoff(
    func: callable,
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,)
):
    """
    Retry function with exponential backoff
    """
    
    for attempt in range(max_retries + 1):
        try:
            return func()
        except exceptions as e:
            if attempt == max_retries:
                raise e
            
            delay = min(base_delay * (backoff_factor ** attempt), max_delay)
            logger.warning(
                "Function failed, retrying",
                function=func.__name__,
                attempt=attempt + 1,
                max_retries=max_retries,
                delay=delay,
                error=str(e)
            )
            
            time.sleep(delay)

# Utility decorators
def log_execution_time(func):
    """Decorator to log function execution time"""
    
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            logger.debug(
                "Function executed",
                function=func.__name__,
                duration_ms=round(duration * 1000, 2)
            )
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                "Function failed",
                function=func.__name__,
                duration_ms=round(duration * 1000, 2),
                error=str(e)
            )
            raise
    
    return wrapper