import fs from 'fs';
import path from 'path';
// import express, { json } from 'express';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';


// Load environment variables from .env file
dotenv.config();
// eslint-disable-next-line no-undef
console.log('API Key:', process.env.OPENAI_API_KEY);

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Allow the React app to connect
}));
app.use(express.json());

const profileData = JSON.parse(fs.readFileSync(path.resolve('shavon_profile.json'), 'utf-8'));



// Configure OpenAI
const openai = new OpenAI({
    // eslint-disable-next-line no-undef
    apiKey: process.env.OPENAI_API_KEY 
});

// Route to interact with OpenAI
app.post('/api/chat', async (req, res) => {
    console.log('Received request:', req.body); 
    const { userMessage } = req.body;
    const systemMessage = `You are Shavon's assistant. Here is their profile information: ${JSON.stringify(profileData)}`;
    
    if (!userMessage) {
        return res.status(400).json({ error: 'userMessage is required' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage }
            ],
            max_tokens: 100,
        });

        console.log('OpenAI response:', response); // Log the OpenAI response

        // Check the structure of the response
        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            const aiResponse = response.choices[0].message.content.trim();
            res.json({ aiResponse });
        } else {
            console.error('Unexpected response structure:', response);
            res.status(500).json({ error: 'Unexpected response structure from OpenAI API' });
        }
    } catch (error) {
        console.error('Error with OpenAI API:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error with OpenAI API', details: error.response ? error.response.data : error.message });
    }
});

// Default route to handle 404
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Start server
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
