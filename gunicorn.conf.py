# Gunicorn configuration for t3a.micro (1GB RAM)

# Workers
workers = 2
worker_class = "sync"
threads = 1

# Binding
bind = "127.0.0.1:5000"

# Timeouts (OpenAI API calls can be slow)
timeout = 120
graceful_timeout = 30
keepalive = 5

# Logging
accesslog = "/var/log/splitui/access.log"
errorlog = "/var/log/splitui/error.log"
loglevel = "info"

# Process naming
proc_name = "splitui"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
