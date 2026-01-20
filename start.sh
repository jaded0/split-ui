#!/bin/bash

echo "Starting Split UI - Prompt Comparison Tool"
echo "=========================================="
echo ""
echo "Installing/Updating dependencies..."
pip install -q -r requirements.txt

echo ""
echo "Starting Flask server..."
echo "The application will be available at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python app.py
