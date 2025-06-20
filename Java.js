
const userId = 'user_' + Math.random().toString(36).substr(2, 9);
console.log("User ID:", userId);


const messagesDiv = document.getElementById('messages');
const conversationList = document.getElementById('conversationList');
const typingIndicator = document.getElementById('typingIndicator');
const newConversationButton = document.getElementById('newConversationButton');
const userInput = document.getElementById('userInput');


let currentConversationId = null;
let conversations = JSON.parse(localStorage.getItem('conversations')) || {};

function initConversation() {
    if (!conversations[userId]) {
        conversations[userId] = [];
    }
    
    if (conversations[userId].length === 0) {
        createNewConversation();
    } else {
        currentConversationId = conversations[userId][0].id;
        loadConversation(currentConversationId);
        updateConversationList();
    }
}


function createNewConversation() {
    const conversationId = 'conv_' + Date.now();
    const newConversation = {
        id: conversationId,
        messages: [],
        createdAt: new Date().toISOString()
    };
    
    conversations[userId].unshift(newConversation);
    currentConversationId = conversationId;
    
    localStorage.setItem('conversations', JSON.stringify(conversations));
    updateConversationList();
    clearMessages();
    

    addMessage('assistant', 'Hello! How can I help you today?', true);
    
    return conversationId;
}


function loadConversation(conversationId) {
    const conversation = conversations[userId].find(conv => conv.id === conversationId);
    if (conversation) {
        currentConversationId = conversationId;
        clearMessages();
        
        conversation.messages.forEach(msg => {
            addMessage(msg.role, msg.text, false);
        });
        
        // Mark this conversation as active in the sidebar
        document.querySelectorAll('.conversation-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.conversationId === conversationId);
        });
    }
}

// Clear the messages display
function clearMessages() {
    messagesDiv.innerHTML = '';
}

// Add a message to the display and conversation history
function addMessage(role, text, saveToHistory = true) {
    const timestamp = new Date().toLocaleTimeString();
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${role}`;
    messageElement.innerHTML = `
        <span class="material-symbols-rounded icon">${role === 'user' ? 'person' : 'smart_toy'}</span>
        ${text}
        <div class="timestamp">${timestamp}</div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Save to conversation history
    if (saveToHistory) {
        const conversation = conversations[userId].find(conv => conv.id === currentConversationId);
        if (conversation) {
            conversation.messages.push({ role, text, timestamp });
            localStorage.setItem('conversations', JSON.stringify(conversations));
        }
    }
}

// Update the conversation list in the sidebar
function updateConversationList() {
    conversationList.innerHTML = '';
    
    conversations[userId].forEach(conv => {
        const li = document.createElement('li');
        li.textContent = `Conversation ${conv.messages.length > 0 ? conv.messages[0].text.substring(0, 20) + '...' : 'New'}`;
        li.dataset.conversationId = conv.id;
        li.onclick = () => loadConversation(conv.id);
        
        if (conv.id === currentConversationId) {
            li.classList.add('active');
        }
        
        conversationList.appendChild(li);
    });
}

// Show/hide typing indicator
function showTypingIndicator(show) {
    typingIndicator.style.display = show ? 'block' : 'none';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send message to the server
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    userInput.value = '';
    addMessage('user', message);
    
    // Show typing indicator after a short delay
    setTimeout(() => showTypingIndicator(true), 500);
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: message,
                user_id: userId
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        const assistantMessage = data.response;
        
        // Add assistant message with typing animation
        showTypingIndicator(false);
        addMessage('assistant', assistantMessage);
        
    } catch (error) {
        console.error('Error:', error);
        showTypingIndicator(false);
        addMessage('assistant', 'Error: Could not reach the server. Please try again.');
    }
}

// Start a new conversation
function startNewConversation() {
    createNewConversation();
}

// Event listeners
newConversationButton.addEventListener('click', startNewConversation);

// Initialize on load
document.addEventListener('DOMContentLoaded', initConversation);

// Allow pressing Enter to send message (but Shift+Enter for new line)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});