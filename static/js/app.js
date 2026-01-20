// Conversation histories for both prompts
const conversations = {
    left: [],
    right: []
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('user-input');

    // Handle Enter key (Shift+Enter for new line)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});

// Clear chat for a specific panel
function clearChat(side) {
    const messagesDiv = document.getElementById(`${side}-messages`);
    messagesDiv.innerHTML = '';
    conversations[side] = [];
}

// Add message to UI
function addMessage(side, role, content) {
    const messagesDiv = document.getElementById(`${side}-messages`);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'message-label';
    labelDiv.textContent = role === 'user' ? 'You' : 'Assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(labelDiv);
    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);

    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    return messageDiv;
}

// Add loading indicator
function addLoading(side) {
    const messagesDiv = document.getElementById(`${side}-messages`);
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.id = `${side}-loading`;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'message-label';
    labelDiv.textContent = 'Assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'loading';
    contentDiv.textContent = 'Thinking';

    loadingDiv.appendChild(labelDiv);
    loadingDiv.appendChild(contentDiv);
    messagesDiv.appendChild(loadingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Remove loading indicator
function removeLoading(side) {
    const loadingDiv = document.getElementById(`${side}-loading`);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Show error message
function showError(side, message) {
    const messagesDiv = document.getElementById(`${side}-messages`);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `Error: ${message}`;
    messagesDiv.appendChild(errorDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send message to OpenAI API
async function sendToAPI(promptKey, message, history) {
    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt_key: promptKey,
            message: message,
            history: history
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
    }

    return await response.json();
}

// Main send message function
async function sendMessage() {
    const input = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const message = input.value.trim();

    if (!message) return;

    // Disable input and button
    input.disabled = true;
    sendBtn.disabled = true;

    // Add user message to both sides
    addMessage('left', 'user', message);
    addMessage('right', 'user', message);

    // Update conversation histories
    conversations.left.push({ role: 'user', content: message });
    conversations.right.push({ role: 'user', content: message });

    // Clear input
    input.value = '';

    // Show loading indicators
    addLoading('left');
    addLoading('right');

    // Send to both prompts in parallel
    try {
        const [leftResponse, rightResponse] = await Promise.allSettled([
            sendToAPI('prompt1', message, conversations.left.slice(0, -1)),
            sendToAPI('prompt2', message, conversations.right.slice(0, -1))
        ]);

        // Handle left response
        removeLoading('left');
        if (leftResponse.status === 'fulfilled') {
            const assistantMessage = leftResponse.value.response || 'No response received';
            addMessage('left', 'assistant', assistantMessage);
            conversations.left.push({ role: 'assistant', content: assistantMessage });
        } else {
            showError('left', leftResponse.reason.message);
            conversations.left.pop(); // Remove the user message that failed
        }

        // Handle right response
        removeLoading('right');
        if (rightResponse.status === 'fulfilled') {
            const assistantMessage = rightResponse.value.response || 'No response received';
            addMessage('right', 'assistant', assistantMessage);
            conversations.right.push({ role: 'assistant', content: assistantMessage });
        } else {
            showError('right', rightResponse.reason.message);
            conversations.right.pop(); // Remove the user message that failed
        }

    } catch (error) {
        removeLoading('left');
        removeLoading('right');
        showError('left', error.message);
        showError('right', error.message);
    } finally {
        // Re-enable input and button
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}
