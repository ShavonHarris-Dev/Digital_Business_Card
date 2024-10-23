/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Allow the React app to connect
}));
app.use(express.json());

// Load profile data
const profileData = JSON.parse(fs.readFileSync(path.resolve('shavon_profile.json'), 'utf-8'));

// Configure AWS Polly
const polly = new AWS.Polly({
    // eslint-disable-next-line no-undef
    region: process.env.AWS_REGION,
    // eslint-disable-next-line no-undef
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Configure S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Function to upload audio to S3
const uploadObject = async (params) => {
    try {
        const data = await s3Client.send(new PutObjectCommand(params));
        return data;
    } catch (err) {
        console.error('S3 upload error:', err);
        throw err;
    }
};

// Function to synthesize speech using Polly
const getSpeech = async (text, languageCode = 'en-US') => {
    const params = {
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: 'Joanna', // Use the desired voice here
        LanguageCode: languageCode,
    };

    try {
        const pollyResponse = await polly.synthesizeSpeech(params).promise();

        if (pollyResponse.AudioStream) {
            return pollyResponse.AudioStream; // Return the audio stream for further use
        } else {
            throw new Error('No AudioStream from Polly');
        }
    } catch (error) {
        console.error('Polly error:', error);
        throw error;
    }
};

// Configure OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});

// Route to interact with OpenAI and Polly
app.post('/api/chat', async (req, res) => {
    console.log('Received request:', req.body); 
    const { userMessage } = req.body;

    const systemMessage = 
     `You are Shavon's personal assistant, here to highlight their exceptional skills as a React/JavaScript Developer.
     Your role is to truthfully represent Shavon's abilities while actively promoting them to potential recruiters. 
     When asked about Shavon's experience, provide clear, concise, and persuasive answers that emphasize their strengths, such as their expertise in React, TypeScript, REST APIs, and developing accessible, scalable solutions. 
     Focus on practical achievements, leadership in projects, and passion for innovation.
     Here is their profile information: ${JSON.stringify(profileData)}`;

    if (!userMessage) {
        return res.status(400).json({ error: 'userMessage is required' });
    }

    try {
        // Get OpenAI response
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage }
            ],
            max_tokens: 100,
            stop: ['\n', '.', '!'],
        });

        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            const aiResponse = response.choices[0].message.content.trim();
            console.log('OpenAI response:', aiResponse);

            // Use Polly to generate the speech from the AI response
            const audioStream = await getSpeech(aiResponse);

            // Prepare S3 params and upload the audio
            const s3Params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: `audio-files/${Date.now()}.mp3`,
                Body: audioStream,
                ContentType: 'audio/mpeg'
            };
            const uploadResponse = await uploadObject(s3Params);

            // Respond with the audio URL and AI text
            res.json({
                message: 'Audio generated and uploaded successfully!',
                s3Url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`,
                aiResponse,
                s3Details: uploadResponse
            });
        } else {
            console.error('Unexpected response structure from OpenAI:', response);
            res.status(500).json({ error: 'Unexpected response structure from OpenAI API' });
        }
    } catch (error) {
        console.error('Error with OpenAI or Polly:', error);
        res.status(500).json({ error: 'Error with OpenAI or Polly', details: error.message });
    }
});

// Default route to handle 404
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
