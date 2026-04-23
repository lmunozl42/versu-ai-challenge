from prometheus_client import Gauge, Histogram

ws_active_connections = Gauge(
    "ws_active_connections",
    "Number of active WebSocket connections",
)

ai_api_duration = Histogram(
    "ai_api_request_duration_seconds",
    "Duration of AI API (Groq) requests in seconds",
    buckets=[0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
)
