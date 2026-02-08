#!/usr/bin/env python3
"""
Heartbeat Monitoring API

A standalone HTTP server that exposes agent health status via REST API.

Usage:
    python scripts/heartbeat_api.py

The server starts on port 8080 and provides:
- GET /api/health - Returns JSON with agent status

@implements: FR-HEARTBEAT-001
@implements: FR-HEARTBEAT-002
@implements: FR-HEARTBEAT-003
@implements: FR-HEARTBEAT-004
@implements: FR-HEARTBEAT-006
@implements: FR-HEARTBEAT-007
@implements: FR-HEARTBEAT-008
"""

import json
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from typing import Dict, Any

# Configuration
STATUS_FILE_PATH = Path(".opencode/logs/task_status.json")
PORT = 8080


def get_utc_timestamp() -> str:
    """
    Get current UTC timestamp in ISO 8601 format.
    
    Returns:
        ISO 8601 formatted timestamp with 'Z' suffix
    """
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _load_agents() -> Dict[str, Dict[str, Any]]:
    """
    Load agent status from the task status file.
    
    Returns:
        Dictionary of agent IDs to their status information.
        Returns empty dict if file is missing or unreadable.
        
    @implements: FR-HEARTBEAT-003
    """
    try:
        if not STATUS_FILE_PATH.exists():
            return {}
        
        with open(STATUS_FILE_PATH, 'r') as f:
            data = json.load(f)
            return data.get("agents", {})
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading status file: {e}")
        return {}


def _build_response(agents: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Build the health check response JSON.
    
    Args:
        agents: Dictionary of agent status information
        
    Returns:
        Dictionary with status, timestamp, and agents
        
    @implements: FR-HEARTBEAT-004
    @implements: FR-HEARTBEAT-006
    """
    return {
        "status": "healthy",
        "timestamp": get_utc_timestamp(),
        "agents": agents
    }


class HeartbeatHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the heartbeat monitoring API."""
    
    def do_GET(self):
        """
        Handle GET requests.
        
        Routes:
            /api/health - Returns agent health status
            
        @implements: FR-HEARTBEAT-002
        """
        if self.path == '/api/health':
            self._handle_health()
        else:
            self._send_error(404, "Not Found")
    
    def _handle_health(self):
        """
        Handle the /api/health endpoint.
        
        Reads agent status from file and returns JSON response.
        
        @implements: FR-HEARTBEAT-003
        @implements: FR-HEARTBEAT-004
        """
        agents = _load_agents()
        response = _build_response(agents)
        self._send_json(200, response)
    
    def _send_json(self, status_code: int, data: Dict[str, Any]):
        """
        Send a JSON response.
        
        Args:
            status_code: HTTP status code
            data: Dictionary to serialize as JSON
        """
        response_body = json.dumps(data, indent=2)
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response_body)))
        self.end_headers()
        
        self.wfile.write(response_body.encode('utf-8'))
    
    def _send_error(self, status_code: int, message: str):
        """
        Send an error response.
        
        Args:
            status_code: HTTP status code
            message: Error message
        """
        self._send_json(status_code, {"error": message})
    
    def log_message(self, format, *args):
        """Override to provide custom logging."""
        print(f"[Heartbeat API] {args[0]}")


def main():
    """
    Main entry point for the Heartbeat Monitoring API.
    
    Starts an HTTP server on port 8080 and handles graceful shutdown.
    
    @implements: FR-HEARTBEAT-001
    """
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, HeartbeatHandler)
    
    print(f"🚀 Heartbeat Monitoring API starting on port {PORT}")
    print(f"📡 Endpoint: http://localhost:{PORT}/api/health")
    print("📋 Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Shutting down Heartbeat Monitoring API...")
        httpd.shutdown()


if __name__ == "__main__":
    main()
