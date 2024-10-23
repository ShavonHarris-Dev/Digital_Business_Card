import { useState } from "react";

export default function ChatBox() {
    const [userMessage, setUserMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');

    // Remove all non-alphanumeric characters from the string
    const cleanInput = (input) => {
        return input.replace(/[^\w\s]/gi, '');  
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        // Clean the user's message
        const cleanedMessage = cleanInput(userMessage);

        // First, update the chat history with the user's message
        setChatHistory((prevHistory) => [
            ...prevHistory, 
            { sender: 'user', message: cleanedMessage }
        ]);

        try {
            // Send user message and selected language to the backend
            const response = await fetch('http://localhost:5002/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userMessage: cleanedMessage, language: selectedLanguage }),
            });

            const data = await response.json();

            // Update the chat history with the AI's response
            setChatHistory((prevHistory) => [
                ...prevHistory, 
                { sender: 'ai', message: data.aiResponse }
            ]);

            // If there's an audio response (S3 URL), play it
            if (data.s3Url) {
                const audio = new Audio(data.s3Url);
                audio.play();
            }

        } catch (error) {
            console.error('Error fetching AI response:', error);
        }

        // Clear the input field
        setUserMessage('');
    };

    return (
        <div className="chat-box">
            <div className="chat-history">
                {chatHistory.map((chat, index) => (
                    <div key={index} className={chat.sender === 'user' ? 'user-message' : 'ai-message'}>
                        {chat.message}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ask me about my experience as a developer!"
                    required
                />
                <button type="submit">Send</button>
            </form>
            <div className="select-container">
                <label className="select-label" htmlFor="language">Choose a language:</label>
                <select
                    id="language"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                    <option value="en-US">English (US)</option>
                    <option value="ko-KR">Korean (Korea)</option>
                    <option value="ar-EG">Arabic (Egypt)</option>
                    <option value="fr-FR">French (French)</option>
                    <option value="es-ES">Spanish (Spain)</option>
                    <option value="hi-IN">Hindi (India)</option>
                </select>
            </div>
        </div>
    );
}

