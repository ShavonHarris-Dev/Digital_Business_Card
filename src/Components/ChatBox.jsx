import { useState } from "react";

export default function ChatBox() {
    const [userMessage, setUserMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');

    const playAudio = (text, lang = 'en-US') => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = lang;
        window.speechSynthesis.speak(speech);
    }


    const handleSendMessage = async (e) => {
        e.preventDefault();
       

        // First, update the chat history with the user's message
        setChatHistory((prevHistory) => [
            ...prevHistory, 
            { sender: 'user', message: userMessage }
        ]);

        try {
            // Send user message to the backend
            const response = await fetch('http://localhost:5002/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userMessage }),
            });

            const data = await response.json();

            // Then, update the chat history with the AI's response
            setChatHistory((prevHistory) => [
                ...prevHistory, 
                { sender: 'ai', message: data.aiResponse }
            ]);

            playAudio(data.aiResponse);
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
                    placeholder="Ask a question..."
                    required
                />
                <button type="submit">Send</button>
            </form>
            <div>
            <label htmlFor="language-select">Choose a language:</label>
                <select
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Korean (Korea)</option>
                    <option value="fr-FR">Arabic (Egypt)</option>
                    <option value="fr-FR">French (French)</option>
                    <option value="es-ES">Spanish (Spain)</option>
                    <option value="es-ES">Hindi (India)</option>
                </select>

            </div>
        </div>
    );
}
