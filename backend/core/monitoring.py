"""
MAKKO INTELLIGENCE - ULTRA-SECURE MONITORING & OBSERVABILITY
Real-time threat detection, performance monitoring, and security analytics
Military-grade observability with predictive threat intelligence
"""

import time
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import structlog
import redis
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest
import psutil
import threading
from collections import defaultdict, deque
import statistics

logger = structlog.get_logger(__name__)

class AlertSeverity(str, Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MetricType(str, Enum):
    """Metric types for monitoring"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    TIMER = "timer"

@dataclass
class SecurityEvent:
    """Security event data structure"""
    event_type: str
    severity: AlertSeverity
    source_ip: str
    user_id: Optional[str]
    timestamp: datetime
    details: Dict[str, Any]
    risk_score: int  # 0-100
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class PerformanceMetric:
    """Performance metric data structure"""
    metric_name: str
    metric_type: MetricType
    value: float
    timestamp: datetime
    labels: Dict[str, str]
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

class ThreatIntelligence:
    """
    Advanced threat intelligence system
    Analyzes patterns and predicts threats
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.threat_patterns = {}
        self.ip_reputation = {}
        self.anomaly_detectors = {}
        
    async def analyze_ip_reputation(self, ip: str) -> Dict[str, Any]:
        """Analyze IP reputation and threat level"""
        
        # Get historical data for IP
        history_key = f"ip_history:{ip}"
        history = await self.redis_client.lrange(history_key, 0, -1)
        
        events = []
        for event_data in history:
            try:
                event = json.loads(event_data)
                events.append(event)
            except json.JSONDecodeError:
                continue
        
        if not events:
            return {
                "reputation_score": 50,  # Neutral
                "threat_level": "unknown",
                "confidence": 0,
                "reasons": []
            }
        
        # Calculate reputation score
        reputation_score = 50  # Start neutral
        reasons = []
        
        # Analyze event patterns
        failed_logins = sum(1 for e in events if e.get("type") == "failed_login")
        security_violations = sum(1 for e in events if e.get("type") == "security_violation")
        successful_logins = sum(1 for e in events if e.get("type") == "successful_login")
        
        # Negative factors
        if failed_logins > 10:
            reputation_score -= 20
            reasons.append("Multiple failed login attempts")
        
        if security_violations > 5:
            reputation_score -= 30
            reasons.append("Security violations detected")
        
        # Check for rapid requests (potential bot)
        recent_events = [e for e in events if 
                        datetime.fromisoformat(e.get("timestamp", "")).replace(tzinfo=timezone.utc) > 
                        datetime.now(timezone.utc) - timedelta(minutes=5)]
        
        if len(recent_events) > 50:
            reputation_score -= 25
            reasons.append("Excessive request rate")
        
        # Positive factors
        if successful_logins > failed_logins and successful_logins > 0:
            reputation_score += 10
            reasons.append("Successful authentication history")
        
        # Determine threat level
        if reputation_score >= 80:
            threat_level = "low"
        elif reputation_score >= 60:
            threat_level = "medium"
        elif reputation_score >= 40:
            threat_level = "high"
        else:
            threat_level = "critical"
        
        confidence = min(len(events) * 2, 100)  # More events = higher confidence
        
        return {
            "reputation_score": max(0, min(100, reputation_score)),
            "threat_level": threat_level,
            "confidence": confidence,
            "reasons": reasons,
            "event_count": len(events),
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    async def detect_anomalies(self, user_id: str, event_data: Dict[str, Any]) -> List[str]:
        """Detect anomalies in user behavior"""
        
        anomalies = []
        
        # Get user's historical behavior
        history_key = f"user_behavior:{user_id}"
        history = await self.redis_client.lrange(history_key, 0, 99)  # Last 100 events
        
        if len(history) < 10:  # Need baseline
            return anomalies
        
        historical_events = []
        for event_json in history:
            try:
                event = json.loads(event_json)
                historical_events.append(event)
            except json.JSONDecodeError:
                continue
        
        # Analyze login times
        current_hour = datetime.now(timezone.utc).hour
        historical_hours = [
            datetime.fromisoformat(e.get("timestamp", "")).hour 
            for e in historical_events 
            if e.get("type") == "login"
        ]
        
        if historical_hours:
            avg_hour = statistics.mean(historical_hours)
            if abs(current_hour - avg_hour) > 6:  # More than 6 hours difference
                anomalies.append("Unusual login time")
        
        # Analyze location
        current_country = event_data.get("country")
        historical_countries = [
            e.get("country") for e in historical_events 
            if e.get("country")
        ]
        
        if current_country and historical_countries:
            if current_country not in historical_countries:
                anomalies.append("New country login")
        
        # Analyze device patterns
        current_device = event_data.get("device_type")
        historical_devices = [
            e.get("device_type") for e in historical_events 
            if e.get("device_type")
        ]
        
        if current_device and historical_devices:
            if current_device not in historical_devices:
                anomalies.append("New device type")
        
        return anomalies
    
    async def update_threat_patterns(self, event: SecurityEvent):
        """Update threat patterns based on new events"""
        
        pattern_key = f"threat_pattern:{event.event_type}"
        
        # Store event for pattern analysis
        event_data = {
            "timestamp": event.timestamp.isoformat(),
            "source_ip": event.source_ip,
            "risk_score": event.risk_score,
            "details": event.details
        }
        
        await self.redis_client.lpush(pattern_key, json.dumps(event_data))
        await self.redis_client.ltrim(pattern_key, 0, 999)  # Keep last 1000 events
        await self.redis_client.expire(pattern_key, 86400 * 7)  # 7 days

class SecurityMonitor:
    """
    Comprehensive security monitoring system
    Real-time threat detection and alerting
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.threat_intelligence = ThreatIntelligence(redis_client)
        
        # Prometheus metrics
        self.registry = CollectorRegistry()
        self.setup_metrics()
        
        # Alert thresholds
        self.alert_thresholds = {
            "failed_logins_per_minute": 10,
            "security_violations_per_hour": 20,
            "high_risk_events_per_hour": 5,
            "blocked_ips_per_hour": 50
        }
        
        # Real-time counters
        self.event_counters = defaultdict(int)
        self.ip_counters = defaultdict(int)
        self.user_counters = defaultdict(int)
        
        # Start background monitoring
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(target=self._background_monitoring)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
    
    def setup_metrics(self):
        """Setup Prometheus metrics"""
        
        self.metrics = {
            "security_events_total": Counter(
                "security_events_total",
                "Total security events",
                ["event_type", "severity", "source"],
                registry=self.registry
            ),
            "authentication_attempts_total": Counter(
                "authentication_attempts_total",
                "Total authentication attempts",
                ["result", "method"],
                registry=self.registry
            ),
            "request_duration_seconds": Histogram(
                "request_duration_seconds",
                "Request duration in seconds",
                ["method", "endpoint", "status"],
                registry=self.registry
            ),
            "active_sessions": Gauge(
                "active_sessions",
                "Number of active user sessions",
                registry=self.registry
            ),
            "threat_score": Histogram(
                "threat_score",
                "Threat scores for requests",
                ["source_ip"],
                registry=self.registry
            ),
            "system_cpu_usage": Gauge(
                "system_cpu_usage",
                "System CPU usage percentage",
                registry=self.registry
            ),
            "system_memory_usage": Gauge(
                "system_memory_usage",
                "System memory usage percentage",
                registry=self.registry
            ),
            "database_connections": Gauge(
                "database_connections",
                "Number of database connections",
                registry=self.registry
            )
        }
    
    async def record_security_event(self, event: SecurityEvent):
        """Record a security event"""
        
        # Update Prometheus metrics
        self.metrics["security_events_total"].labels(
            event_type=event.event_type,
            severity=event.severity.value,
            source=event.source_ip
        ).inc()
        
        # Store in Redis for analysis
        event_key = f"security_events:{datetime.now(timezone.utc).strftime('%Y%m%d')}"
        await self.redis_client.lpush(event_key, json.dumps(event.to_dict()))
        await self.redis_client.expire(event_key, 86400 * 30)  # 30 days
        
        # Update IP history
        ip_history_key = f"ip_history:{event.source_ip}"
        await self.redis_client.lpush(ip_history_key, json.dumps({
            "type": event.event_type,
            "timestamp": event.timestamp.isoformat(),
            "risk_score": event.risk_score,
            "details": event.details
        }))
        await self.redis_client.ltrim(ip_history_key, 0, 999)
        await self.redis_client.expire(ip_history_key, 86400 * 7)  # 7 days
        
        # Update threat patterns
        await self.threat_intelligence.update_threat_patterns(event)
        
        # Check for immediate alerts
        await self._check_alert_conditions(event)
        
        logger.info("Security event recorded",
                   event_type=event.event_type,
                   severity=event.severity.value,
                   source_ip=event.source_ip,
                   risk_score=event.risk_score)
    
    async def record_authentication_attempt(self, success: bool, method: str, user_id: Optional[str] = None):
        """Record authentication attempt"""
        
        result = "success" if success else "failure"
        self.metrics["authentication_attempts_total"].labels(
            result=result,
            method=method
        ).inc()
        
        # Track failed login patterns
        if not success:
            self.event_counters["failed_logins"] += 1
    
    async def record_request(self, request_data: Dict[str, Any]):
        """Record request metrics"""
        
        # Update request duration metric
        self.metrics["request_duration_seconds"].labels(
            method=request_data.get("method", "unknown"),
            endpoint=self._normalize_endpoint(request_data.get("path", "")),
            status=str(request_data.get("status_code", 0))
        ).observe(request_data.get("duration_ms", 0) / 1000)
        
        # Record threat score if available
        if "threat_score" in request_data:
            self.metrics["threat_score"].labels(
                source_ip=request_data.get("ip", "unknown")
            ).observe(request_data["threat_score"])
    
    def _normalize_endpoint(self, path: str) -> str:
        """Normalize endpoint path for metrics"""
        import re
        
        # Replace UUIDs and IDs with placeholders
        path = re.sub(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '/{uuid}', path)
        path = re.sub(r'/\d+', '/{id}', path)
        
        return path
    
    async def _check_alert_conditions(self, event: SecurityEvent):
        """Check if event triggers any alerts"""
        
        current_time = datetime.now(timezone.utc)
        
        # High-risk event alert
        if event.risk_score >= 80:
            await self._send_alert(
                AlertSeverity.HIGH,
                f"High-risk security event: {event.event_type}",
                {
                    "event": event.to_dict(),
                    "recommendation": "Investigate immediately"
                }
            )
        
        # Check rate-based alerts
        await self._check_rate_based_alerts(event, current_time)
    
    async def _check_rate_based_alerts(self, event: SecurityEvent, current_time: datetime):
        """Check rate-based alert conditions"""
        
        # Failed login rate
        if event.event_type == "failed_login":
            minute_key = f"failed_logins:{current_time.strftime('%Y%m%d%H%M')}"
            count = await self.redis_client.incr(minute_key)
            await self.redis_client.expire(minute_key, 60)
            
            if count >= self.alert_thresholds["failed_logins_per_minute"]:
                await self._send_alert(
                    AlertSeverity.MEDIUM,
                    f"High failed login rate: {count} attempts in 1 minute",
                    {"source_ip": event.source_ip, "count": count}
                )
        
        # Security violation rate
        if event.event_type in ["security_violation", "malicious_request"]:
            hour_key = f"security_violations:{current_time.strftime('%Y%m%d%H')}"
            count = await self.redis_client.incr(hour_key)
            await self.redis_client.expire(hour_key, 3600)
            
            if count >= self.alert_thresholds["security_violations_per_hour"]:
                await self._send_alert(
                    AlertSeverity.HIGH,
                    f"High security violation rate: {count} violations in 1 hour",
                    {"count": count}
                )
    
    async def _send_alert(self, severity: AlertSeverity, message: str, details: Dict[str, Any]):
        """Send security alert"""
        
        alert_data = {
            "severity": severity.value,
            "message": message,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "alert_id": f"alert_{int(time.time() * 1000)}"
        }
        
        # Store alert
        alerts_key = f"security_alerts:{datetime.now(timezone.utc).strftime('%Y%m%d')}"
        await self.redis_client.lpush(alerts_key, json.dumps(alert_data))
        await self.redis_client.expire(alerts_key, 86400 * 30)  # 30 days
        
        # Log alert
        logger.warning("Security alert triggered",
                      severity=severity.value,
                      message=message,
                      **details)
        
        # In production, integrate with alerting systems like:
        # - Slack/Discord webhooks
        # - Email notifications
        # - PagerDuty
        # - SMS alerts for critical events
    
    def _background_monitoring(self):
        """Background monitoring thread"""
        
        while self.monitoring_active:
            try:
                # Update system metrics
                self.metrics["system_cpu_usage"].set(psutil.cpu_percent())
                self.metrics["system_memory_usage"].set(psutil.virtual_memory().percent)
                
                # Reset event counters every minute
                self.event_counters.clear()
                
                time.sleep(60)  # Update every minute
                
            except Exception as e:
                logger.error("Background monitoring error", error=str(e))
                time.sleep(60)
    
    async def get_security_dashboard_data(self) -> Dict[str, Any]:
        """Get data for security dashboard"""
        
        current_time = datetime.now(timezone.utc)
        today_key = current_time.strftime('%Y%m%d')
        
        # Get today's events
        events_key = f"security_events:{today_key}"
        events_data = await self.redis_client.lrange(events_key, 0, -1)
        
        events = []
        event_counts = defaultdict(int)
        severity_counts = defaultdict(int)
        
        for event_json in events_data:
            try:
                event = json.loads(event_json)
                events.append(event)
                event_counts[event.get("event_type", "unknown")] += 1
                severity_counts[event.get("severity", "unknown")] += 1
            except json.JSONDecodeError:
                continue
        
        # Get recent alerts
        alerts_key = f"security_alerts:{today_key}"
        alerts_data = await self.redis_client.lrange(alerts_key, 0, 9)  # Last 10 alerts
        
        alerts = []
        for alert_json in alerts_data:
            try:
                alert = json.loads(alert_json)
                alerts.append(alert)
            except json.JSONDecodeError:
                continue
        
        return {
            "total_events_today": len(events),
            "event_counts": dict(event_counts),
            "severity_counts": dict(severity_counts),
            "recent_alerts": alerts,
            "system_metrics": {
                "cpu_usage": psutil.cpu_percent(),
                "memory_usage": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent
            },
            "timestamp": current_time.isoformat()
        }
    
    async def get_ip_analysis(self, ip: str) -> Dict[str, Any]:
        """Get comprehensive IP analysis"""
        
        reputation = await self.threat_intelligence.analyze_ip_reputation(ip)
        
        # Get recent events for this IP
        ip_history_key = f"ip_history:{ip}"
        history_data = await self.redis_client.lrange(ip_history_key, 0, 49)  # Last 50 events
        
        events = []
        for event_json in history_data:
            try:
                event = json.loads(event_json)
                events.append(event)
            except json.JSONDecodeError:
                continue
        
        return {
            "ip_address": ip,
            "reputation": reputation,
            "recent_events": events,
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def get_prometheus_metrics(self) -> str:
        """Get Prometheus metrics"""
        return generate_latest(self.registry).decode('utf-8')
    
    def shutdown(self):
        """Shutdown monitoring"""
        self.monitoring_active = False
        if self.monitoring_thread.is_alive():
            self.monitoring_thread.join(timeout=5)

class PerformanceMonitor:
    """
    Application performance monitoring
    Tracks response times, throughput, and resource usage
    """
    
    def __init__(self):
        self.request_times = deque(maxlen=1000)  # Last 1000 requests
        self.endpoint_stats = defaultdict(lambda: {"count": 0, "total_time": 0, "errors": 0})
        
    def record_request_time(self, endpoint: str, duration_ms: float, status_code: int):
        """Record request timing"""
        
        self.request_times.append(duration_ms)
        
        stats = self.endpoint_stats[endpoint]
        stats["count"] += 1
        stats["total_time"] += duration_ms
        
        if status_code >= 400:
            stats["errors"] += 1
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        
        if not self.request_times:
            return {"message": "No data available"}
        
        avg_response_time = statistics.mean(self.request_times)
        p95_response_time = statistics.quantiles(self.request_times, n=20)[18]  # 95th percentile
        
        # Calculate endpoint statistics
        endpoint_stats = {}
        for endpoint, stats in self.endpoint_stats.items():
            if stats["count"] > 0:
                endpoint_stats[endpoint] = {
                    "requests": stats["count"],
                    "avg_response_time": stats["total_time"] / stats["count"],
                    "error_rate": stats["errors"] / stats["count"] * 100,
                    "errors": stats["errors"]
                }
        
        return {
            "avg_response_time_ms": round(avg_response_time, 2),
            "p95_response_time_ms": round(p95_response_time, 2),
            "total_requests": len(self.request_times),
            "endpoint_stats": endpoint_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

# Global monitoring instances
security_monitor: Optional[SecurityMonitor] = None
performance_monitor: Optional[PerformanceMonitor] = None

def initialize_monitoring(redis_client: redis.Redis):
    """Initialize monitoring systems"""
    global security_monitor, performance_monitor
    
    security_monitor = SecurityMonitor(redis_client)
    performance_monitor = PerformanceMonitor()
    
    logger.info("Monitoring systems initialized successfully")