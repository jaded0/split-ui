from flask import Flask, render_template, request, jsonify, Response
from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

app = Flask(__name__)
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Configuration for the two prompts
PROMPTS = {
    "prompt1": {
        "id": "pmpt_696ec24443588190a1210918635871ca029afd4ddd5c244e",
        "version": "1",
        "vector_store_id": "vs_696ebfb5250081919704b76c1ce86a80"
    },
    "prompt2": {
        "id": "pmpt_696ec1c95dac8195b6bca8a5c6dc37d6043d06e9d7f7c479",  # Replace with second prompt ID
        "version": "1",
        "vector_store_id": "vs_696ebed79c588191beee05844e5396e7"  # Replace with second vector store ID
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    prompt_key = data.get('prompt_key')
    user_message = data.get('message', '')
    conversation_history = data.get('history', [])

    if prompt_key not in PROMPTS:
        return jsonify({'error': 'Invalid prompt key'}), 400

    prompt_config = PROMPTS[prompt_key]

    # Build input array from conversation history
    input_messages = []
    for msg in conversation_history:
        input_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })

    # Add the new user message
    if user_message:
        input_messages.append({
            "role": "user",
            "content": user_message
        })

    try:
        response = client.responses.create(
            prompt={
                "id": prompt_config["id"],
                "version": prompt_config["version"]
            },
            input=input_messages,
            text={
                "format": {
                    "type": "text"
                }
            },
            reasoning={},
            tools=[
                {
                    "type": "file_search",
                    "vector_store_ids": [
                        prompt_config["vector_store_id"]
                    ]
                }
            ],
            max_output_tokens=2048,
            store=True,
            include=["web_search_call.action.sources"]
        )

        # Extract the assistant's response
        assistant_message = ""
        if hasattr(response, 'output') and response.output:
            if isinstance(response.output, list):
                for item in response.output:
                    # Handle message objects with content array
                    if hasattr(item, 'content') and isinstance(item.content, list):
                        for content_item in item.content:
                            if hasattr(content_item, 'text'):
                                assistant_message += content_item.text
                    # Handle simple content
                    elif hasattr(item, 'content'):
                        assistant_message += str(item.content)
                    elif isinstance(item, dict) and 'content' in item:
                        assistant_message += str(item['content'])
            elif hasattr(response.output, 'content'):
                assistant_message = response.output.content

        return jsonify({
            'response': assistant_message,
            'full_response': response.model_dump() if hasattr(response, 'model_dump') else {}
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/config')
def get_config():
    """Endpoint to update prompt configurations"""
    return jsonify({
        'prompts': {
            'prompt1': {
                'id': PROMPTS['prompt1']['id'],
                'version': PROMPTS['prompt1']['version']
            },
            'prompt2': {
                'id': PROMPTS['prompt2']['id'],
                'version': PROMPTS['prompt2']['version']
            }
        }
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
