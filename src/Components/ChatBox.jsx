import { useState } from "react";

export default function ChatBox() {
    const [userMessage, setUserMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');

    const playAudio = (url) => {
        console.log('Attempting to play audio from URL:', url);
        const audio = new Audio(url);
        audio.play()
            .then(() => console.log('Audio is playing successfully'))
            .catch(error => {
                console.error('Error playing audio:', error);
            });
    }
    // Remove all non-alphanumeric characters from the string
    const cleanInput = (input) => {
        return input.replace(/[^\w\s]/gi, '');  
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        // Clean the user's message
        const cleanedMessage = cleanInput(userMessage);
        console.log('Sending request to backend with message:', cleanedMessage);


        // First, update the chat history with the user's message
        setChatHistory((prevHistory) => [
            ...prevHistory, 
            { sender: 'user', message: cleanedMessage }
        ]);

        try {
            // Send user message and selected language to the backend
            // const response = await fetch('https://34.233.90.234:5002/api/chat', {
                const response = await fetch('/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userMessage: cleanedMessage, language: selectedLanguage }),
                // language: selectedLanguage,
            });

            if(!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response received from backend:', data);


            // Update the chat history with the AI's response
            setChatHistory((prevHistory) => [
                ...prevHistory, 
                { sender: 'ai', message: data.aiResponse }
            ]);

            console.log("check", data.s3Url)

         // If there's an audio response (Pre-signed S3 URL), play it
         if (data.s3Url) {
            playAudio(data.s3Url);
        } else {
            console.log('No valid S3 URL for audio playback');
        }
    } catch (error) {
        console.error('Error fetching AI response:', error);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
        
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
                    <option value="fr-FR">French (France)</option>
                    <option value="es-ES">Spanish (Spain)</option>
                    <option value="hi-IN">Hindi (India)</option>
                </select>
            </div>
        </div>
    );
}


