# Split UI - Prompt Comparison Tool

A side-by-side chat interface for comparing responses from two different OpenAI prompts using the Responses API.

## Features

- Split-screen interface showing two prompts side by side ("Context" and "Knowledge")
- Send the same message to both prompts simultaneously
- Full conversation history for each prompt
- Uses OpenAI's Responses API with file search capabilities
- Secure API key storage using environment variables

## Quick Start

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

## Usage

1. Type your message in the text area at the bottom
2. Click "Send to Both" or press Enter to send the message to both prompts
3. View responses side by side
4. Use the "Clear" button on each panel to reset that conversation
5. Press Shift+Enter in the input field to add a new line without sending

## Stopping the Server

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
├── start.sh               # Startup script
├── .env                    # API key storage (not in git)
├── .gitignore             # Git ignore file
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html         # Main HTML template
└── static/
    ├── css/
    │   └── styles.css     # Styling
    └── js/
        └── app.js         # Frontend JavaScript
```

## API Key Security

The OpenAI API key is stored in [.env](.env) and is excluded from git via [.gitignore](.gitignore). Never commit your API key to version control.

## Troubleshooting

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
