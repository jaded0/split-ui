#!/bin/bash
#
# Split UI Deployment Script for Ubuntu on AWS t3a.micro
# Run this as root or with sudo on a fresh EC2 instance
#
# Usage: sudo bash setup.sh
#

set -e  # Exit on any error

echo "============================================"
echo "  Split UI Deployment Script"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: Please run as root (sudo bash setup.sh)"
    exit 1
fi

# Variables
APP_DIR="/opt/splitui"
APP_USER="splitui"
REPO_URL="https://github.com/jaded0/split-ui.git"

echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

echo "[2/8] Installing dependencies..."
apt install -y python3 python3-pip python3-venv nginx git

echo "[3/8] Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --shell /bin/false --home-dir "$APP_DIR" "$APP_USER"
    echo "Created user: $APP_USER"
else
    echo "User $APP_USER already exists"
fi

echo "[4/8] Setting up application directory..."
if [ -d "$APP_DIR" ]; then
    echo "Updating existing installation..."
    cd "$APP_DIR"
    sudo -u "$APP_USER" git pull origin main || git pull origin main
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
fi

echo "[5/8] Setting up Python virtual environment..."
cd "$APP_DIR"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    chown -R "$APP_USER:$APP_USER" venv
fi

# Install Python packages
sudo -u "$APP_USER" venv/bin/pip install --upgrade pip
sudo -u "$APP_USER" venv/bin/pip install -r requirements.txt
sudo -u "$APP_USER" venv/bin/pip install gunicorn

echo "[6/8] Setting up environment file..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Creating .env file template..."
    cat > "$APP_DIR/.env" << 'EOF'
# Split UI Environment Configuration
# IMPORTANT: Add your OpenAI API key below
OPENAI_API_KEY=your-api-key-here
EOF
    chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo ""
    echo "WARNING: You must edit $APP_DIR/.env and add your OPENAI_API_KEY!"
    echo ""
else
    echo ".env file already exists"
fi

echo "[7/8] Setting up logging directory..."
mkdir -p /var/log/splitui
chown "$APP_USER:$APP_USER" /var/log/splitui

echo "[8/8] Configuring systemd and nginx..."

# Install systemd service
cp "$APP_DIR/deploy/splitui.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable splitui

# Install nginx config
cp "$APP_DIR/deploy/nginx-splitui.conf" /etc/nginx/sites-available/splitui
ln -sf /etc/nginx/sites-available/splitui /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default site

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Edit the environment file with your OpenAI API key:"
echo "   sudo nano $APP_DIR/.env"
echo ""
echo "2. Start the application:"
echo "   sudo systemctl start splitui"
echo ""
echo "3. Check status:"
echo "   sudo systemctl status splitui"
echo ""
echo "4. View logs:"
echo "   sudo journalctl -u splitui -f"
echo ""
echo "5. Access the app at: http://<your-ec2-public-ip>"
echo ""
echo "============================================"
