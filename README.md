# Split UI - Prompt Comparison Tool

A side-by-side chat interface for comparing responses from two different OpenAI prompts using the Responses API.

## Features

- Split-screen interface showing two prompts side by side ("Context" and "Knowledge")
- Send the same message to both prompts simultaneously
- Full conversation history for each prompt
- Uses OpenAI's Responses API with file search capabilities
- Secure API key storage using environment variables

## Quick Start (Local Development)

The easiest way to start the application:

```bash
./start.sh
```

Or manually:

```bash
pip install -r requirements.txt
python app.py
```

Then open `http://localhost:5000` in your browser.

---

## Deployment to AWS EC2 (t3a.micro)

This guide covers deploying to a **t3a.micro** instance (~$6.55/mo) running Ubuntu.

### Prerequisites

- AWS account
- SSH key pair for EC2
- Your OpenAI API key

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose:
   - **AMI**: Ubuntu Server 24.04 LTS (or latest LTS)
   - **Instance type**: t3a.micro
   - **Key pair**: Select/create your SSH key
3. **Security Group** - Allow these inbound rules:
   | Type | Port | Source |
   |------|------|--------|
   | SSH | 22 | Your IP (or 0.0.0.0/0) |
   | HTTP | 80 | 0.0.0.0/0 |
4. **Storage**: 8 GB gp3 is fine
5. Launch the instance

### Step 2: Connect and Deploy

SSH into your new instance:

```bash
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
```

Run the deployment script:

```bash
# Download and run setup script
curl -sL https://raw.githubusercontent.com/jaded0/split-ui/main/deploy/setup.sh | sudo bash
```

Or clone and run manually:

```bash
git clone https://github.com/jaded0/split-ui.git
cd split-ui
sudo bash deploy/setup.sh
```

### Step 3: Configure API Key

```bash
sudo nano /opt/splitui/.env
```

Replace `your-api-key-here` with your actual OpenAI API key:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

### Step 4: Start the Application

```bash
sudo systemctl start splitui
```

### Step 5: Access the App

Open in your browser:
```
http://<your-ec2-public-ip>
```

That's it! Share this URL with your client.

---

## Managing the Deployment

### Service Commands

```bash
# Check status
sudo systemctl status splitui

# Start/stop/restart
sudo systemctl start splitui
sudo systemctl stop splitui
sudo systemctl restart splitui

# View live logs
sudo journalctl -u splitui -f

# View recent logs
sudo journalctl -u splitui --since "1 hour ago"
```

### Updating the Application

```bash
cd /opt/splitui
sudo -u splitui git pull origin main
sudo systemctl restart splitui
```

### Nginx Commands

```bash
# Check nginx status
sudo systemctl status nginx

# Test config
sudo nginx -t

# Reload config
sudo systemctl reload nginx

# View access logs
sudo tail -f /var/log/nginx/splitui_access.log
```

---

## Architecture

```
Client Browser
      │
      ▼ (port 80)
┌─────────────────┐
│     Nginx       │  ← Reverse proxy, serves static files
└────────┬────────┘
         │ (localhost:5000)
         ▼
┌─────────────────┐
│    Gunicorn     │  ← Production WSGI server (2 workers)
│  (Flask app)    │
└─────────────────┘
         │
         ▼
    OpenAI API
```

### Files Created by Deployment

| File | Purpose |
|------|---------|
| `/opt/splitui/` | Application directory |
| `/opt/splitui/.env` | Environment variables (API key) |
| `/opt/splitui/venv/` | Python virtual environment |
| `/etc/systemd/system/splitui.service` | systemd service |
| `/etc/nginx/sites-available/splitui` | Nginx config |
| `/var/log/splitui/` | Application logs |

---

## Troubleshooting Deployment

### App won't start

```bash
# Check service status
sudo systemctl status splitui

# Check logs for errors
sudo journalctl -u splitui -n 50

# Common issues:
# - Missing or invalid OPENAI_API_KEY in .env
# - Python dependency issues
# - Permission problems
```

### 502 Bad Gateway

This means Nginx can't reach Gunicorn:

```bash
# Is the app running?
sudo systemctl status splitui

# Check if port 5000 is listening
sudo ss -tlnp | grep 5000

# Start the app if it's not running
sudo systemctl start splitui
```

### Permission denied errors

```bash
# Fix ownership
sudo chown -R splitui:splitui /opt/splitui
sudo chown -R splitui:splitui /var/log/splitui
```

### Out of memory (t3a.micro has only 1GB)

```bash
# Check memory usage
free -h

# If needed, reduce Gunicorn workers in /opt/splitui/gunicorn.conf.py
# Change: workers = 2  →  workers = 1
sudo systemctl restart splitui
```

---

## Requirements

- Python 3.7+
- OpenAI API key
- OpenAI Python SDK 2.15.0 or higher (the Responses API requires version 2.0+)

## Configuration

The prompts are already configured in [app.py](app.py):

- **Context** (prompt1): LutherBot - Christ the Servant Lutheran Church assistant
- **Knowledge** (prompt2): Your second prompt configuration

To change prompt configurations, edit the `PROMPTS` dictionary in [app.py](app.py):

```python
PROMPTS = {
    "prompt1": {
        "id": "pmpt_696ec24443588190a1210918635871ca029afd4ddd5c244e",
        "version": "1",
        "vector_store_id": "vs_696ebfb5250081919704b76c1ce86a80"
    },
    "prompt2": {
        "id": "pmpt_696ec1c95dac8195b6bca8a5c6dc37d6043d06e9d7f7c479",
        "version": "1",
        "vector_store_id": "vs_696ebed79c588191beee05844e5396e7"
    }
}
```

## Local Usage

1. Type your message in the text area at the bottom
2. Click "Send to Both" or press Enter to send the message to both prompts
3. View responses side by side
4. Use the "Clear" button on each panel to reset that conversation
5. Press Shift+Enter in the input field to add a new line without sending

## Stopping the Local Server

If you started the server in the background, stop it with:

```bash
pkill -f "python app.py"
```

Or if you know the process ID:

```bash
kill <process_id>
```

## Project Structure

```
split_ui/
├── app.py                  # Flask backend server
├── gunicorn.conf.py        # Gunicorn production config
├── start.sh                # Local startup script
├── .env                    # API key storage (not in git)
├── .gitignore              # Git ignore file
├── requirements.txt        # Python dependencies
├── deploy/
│   ├── setup.sh            # EC2 deployment script
│   ├── splitui.service     # systemd service file
│   └── nginx-splitui.conf  # Nginx configuration
├── templates/
│   └── index.html          # Main HTML template
└── static/
    ├── css/
    │   └── styles.css      # Styling
    └── js/
        └── app.js          # Frontend JavaScript
```

## API Key Security

The OpenAI API key is stored in [.env](.env) and is excluded from git via [.gitignore](.gitignore). Never commit your API key to version control.

## Troubleshooting (Local)

- **'OpenAI' object has no attribute 'responses'**: You need OpenAI SDK version 2.0 or higher. Run `pip install --upgrade openai` to update.
- **Connection errors**: Ensure your OpenAI API key is valid and properly set in [.env](.env)
- **Prompt failures**: Verify the prompt IDs and vector store IDs are correct in [app.py](app.py)
- **JavaScript errors**: Check the browser console (F12)
- **Backend errors**: Check the Flask console output or `server.log` file

## Customization

You can customize:
- **Prompt labels**: Currently "Context" and "Knowledge". Edit the `<h2>` tags in [templates/index.html](templates/index.html) lines 20 and 29
- **Colors and styling**: Modify [static/css/styles.css](static/css/styles.css)
- **API parameters**: Adjust settings in [app.py](app.py) like `max_output_tokens`, `temperature`, etc.
- **Prompt configurations**: Update the `PROMPTS` dictionary in [app.py](app.py) with different prompt IDs and vector stores
