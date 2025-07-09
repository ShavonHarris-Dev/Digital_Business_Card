import { useState } from "react";

export default function ChatBox() {
    const [userMessage, setUserMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [rateLimitInfo, setRateLimitInfo] = useState(null);

    // Input validation and sanitization
    const validateInput = (input) => {
        if (!input || typeof input !== 'string') {
            return 'Please enter a valid message';
        }
        
        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return 'Please enter a message';
        }
        
        if (trimmed.length > 1000) {
            return 'Message is too long. Please keep it under 1000 characters.';
        }
        
        if (trimmed.length < 2) {
            return 'Message is too short. Please enter at least 2 characters.';
        }
        
        return null;
    };

    // Basic client-side sanitization
    const cleanInput = (input) => {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove basic HTML brackets
            .replace(/\s+/g, ' '); // Normalize whitespace
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setUserMessage(value);
        
        // Clear error when user starts typing
        if (error) {
            setError('');
        }
        
        // Clear rate limit info when user types
        if (rateLimitInfo) {
            setRateLimitInfo(null);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        setError('');
        setRateLimitInfo(null);

        // Validate input
        const validationError = validateInput(userMessage);
        if (validationError) {
            setError(validationError);
            return;
        }

        const cleanedMessage = cleanInput(userMessage);
        console.log('Sending request to backend with message:', cleanedMessage);

        // Add user message to chat history
        setChatHistory((prevHistory) => [
            ...prevHistory, 
            { sender: 'user', message: cleanedMessage, timestamp: new Date().toISOString() }
        ]);

        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userMessage: cleanedMessage }),
            });

            // Handle rate limiting specifically
            if (response.status === 429) {
                const errorData = await response.json();
                
                setRateLimitInfo({
                    retryAfter: errorData.retryAfter || 60,
                    limit: errorData.limit || 10,
                    remaining: errorData.remaining || 0
                });

                setError(`Rate limit exceeded. Please wait ${errorData.retryAfter || 60} seconds before trying again.`);
                
                // Add rate limit error to chat
                setChatHistory((prevHistory) => [
                    ...prevHistory, 
                    { 
                        sender: 'system', 
                        message: `⚠️ Too many requests. Please wait ${errorData.retryAfter || 60} seconds before sending another message.`,
                        timestamp: new Date().toISOString(),
                        isError: true
                    }
                ]);
                
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response received from backend:', data);

            // Update the chat history with the AI's response
            setChatHistory((prevHistory) => [
                ...prevHistory, 
                { 
                    sender: 'ai', 
                    message: data.response || data.aiResponse, // Handle both response formats
                    timestamp: data.timestamp || new Date().toISOString()
                }
            ]);

        } catch (error) {
            console.error('Error fetching AI response:', error);
            
            let errorMessage = 'Failed to send message. Please try again.';
            
            // Handle specific error types
            if (error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('Invalid input')) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            
            // Add error message to chat
            setChatHistory((prevHistory) => [
                ...prevHistory, 
                { 
                    sender: 'system', 
                    message: `❌ ${errorMessage}`,
                    timestamp: new Date().toISOString(),
                    isError: true
                }
            ]);
        } finally {
            setIsLoading(false);
        }

        // Clear the input field
        setUserMessage('');
    };

    return (
        <div className="chat-box">
            <div className="chat-header">
                <h3>💬 Chat with Shavon&apos;s AI Assistant</h3>
                <p>Ask me anything about Shavon&apos;s background and experience!</p>
                {rateLimitInfo && (
                    <div className="rate-limit-info">
                        <span className="rate-limit-icon">⏱️</span>
                        Rate limit: {rateLimitInfo.remaining}/{rateLimitInfo.limit} requests remaining
                    </div>
                )}
            </div>

            <div className="chat-history">
                {chatHistory.map((chat, index) => (
                    <div key={index} className={`chat-message ${chat.sender}-message ${chat.isError ? 'error-message' : ''}`}>
                        <div className="message-content">
                            {chat.message}
                        </div>
                        {chat.timestamp && (
                            <div className="message-timestamp">
                                {new Date(chat.timestamp).toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                ))}
                
                {isLoading && (
                    <div className="chat-message ai-message loading">
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className={`chat-error ${rateLimitInfo ? 'rate-limit-error' : ''}`}>
                    <span className="error-icon">
                        {rateLimitInfo ? '🕐' : '❌'}
                    </span>
                    {error}
                    {rateLimitInfo && (
                        <div className="retry-info">
                            You can try again in {rateLimitInfo.retryAfter} seconds.
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSendMessage}>
                <div className="input-group">
                    <input
                        type="text"
                        value={userMessage}
                        onChange={handleInputChange}
                        placeholder="Ask me about Shavon's experience..."
                        disabled={isLoading || !!rateLimitInfo}
                        maxLength={1000}
                        autoComplete="off"
                        className={`chat-input ${error && !rateLimitInfo ? 'error' : ''}`}
                        aria-label="Chat message input"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !userMessage.trim() || !!validateInput(userMessage) || !!rateLimitInfo}
                        className="chat-button"
                        aria-label="Send message"
                    >
                        {isLoading ? '⏳' : '📤'}
                    </button>
                </div>
                <div className="input-hint">
                    {userMessage.length}/1000 characters
                    {rateLimitInfo && (
                        <span className="rate-limit-warning">
                            • Rate limited - wait {rateLimitInfo.retryAfter}s
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}


