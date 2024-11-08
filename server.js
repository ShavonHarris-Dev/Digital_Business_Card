/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Load environment variables from .env file
dotenv.config();


const app = express();
app.use(express.json());

app.get('/', (req, res) => { 
    res.send('Welcome to Shavon\'s Personal Assistant API!');
    });

//route to test the API
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Allow the React app to connect
}));

// Load profile data
const profileData = JSON.parse(fs.readFileSync(path.resolve('shavon_profile.json'), 'utf-8'));

// Configure OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});

// Configure AWS Polly
const pollyClient = new PollyClient({ region: process.env.AWS_REGION });

// Configure S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Generate Pre-Signed URL for S3 Object
const generatePreSignedUrl = async (bucketName, key, expiresIn = 3600) => {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        return url;
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        throw error;
    }
};

// Function to translate text using OpenAI
const translateText = async (text, targetLanguage) => {
    const translationPrompt = `Translate the following text to ${targetLanguage}: ${text}`;
    const translationResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
            { role: "system", content: "You are a helpful assistant who translates text." },
            { role: "user", content: translationPrompt }
        ],
        max_tokens: 200
    });

    const translatedText = translationResponse.choices[0].message.content.trim();
    return translatedText;
};

// Function to synthesize speech using Polly and transform to byte array
const getSpeech = async (text, languageCode = 'en-US') => {

    if (!text || text.trim().length === 0) {
        throw new Error('Text is empty or too short');
    }

    // Map of language codes to Polly voices
    const languageMap = {
        'en-US': { voiceId: 'Joanna', translateTo: 'English' },
        'fr-FR': { voiceId: 'Celine', translateTo: 'French' },  // French
        'es-ES': { voiceId: 'Lucia', translateTo: 'Spanish' },  // Spanish
        'hi-IN': { voiceId: 'Aditi', translateTo: 'Hindi' },    // Hindi
        'ar-SA': { voiceId: 'Zeina', translateTo: 'Arabic' },   // Arabic
        'ko-KR': { voiceId: 'Seoyeon', translateTo: 'Korean' }  // Korean
    };

    let translatedText = text;
    let voiceId = 'Joanna'; // Default English voice

    // Handle translation and voice selection based on language
    if (languageCode in languageMap) {
        const languageConfig = languageMap[languageCode];
        translatedText = await translateText(text, languageConfig.translateTo);
        voiceId = languageConfig.voiceId;
    }

    const params = {
        Text: translatedText,
        OutputFormat: 'mp3',
        VoiceId: voiceId,
        LanguageCode: languageCode,
        Engine: 'standard',
    };

    try {
        console.log("Polly params:", params);
        const pollyResponse = await pollyClient.send(new SynthesizeSpeechCommand(params));

        if (!pollyResponse.AudioStream) {
            console.error('Polly AudioStream is empty or invalid.');
            throw new Error('AudioStream is empty');
        }

        // Use transformToByteArray to handle the AudioStream
        const audioBytes = await pollyResponse.AudioStream.transformToByteArray();
        const audioBuffer = Buffer.from(audioBytes);

        const bucketName = process.env.AWS_S3_BUCKET;
        const key = `audio/${Date.now()}.mp3`;

        // Upload the audio file to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: audioBuffer,
            ContentType: 'audio/mpeg',
        }));

        // Generate a pre-signed URL for the audio file
        const s3Url = await generatePreSignedUrl(bucketName, key);
        return s3Url;

    } catch (error) {
        console.error('Error synthesizing speech with Polly:', error);
        throw error;
    }
};


// Route to interact with OpenAI and Polly
app.post('/api/chat', async (req, res) => {
    console.log('Received request:', req.body); 
    const { userMessage, language } = req.body;
    
    const systemMessage = 
     `You are Shavon's personal assistant, here to highlight their exceptional skills as a React/JavaScript Developer.
     Your role is to truthfully represent Shavon's abilities while actively promoting them to potential recruiters. 
     Focus on practical achievements, leadership in projects, and passion for innovation.
     Here is their profile information: ${JSON.stringify(profileData)}`;

    if (!userMessage) {
        console.error('No userMessage provided');
        return res.status(400).json({ error: 'userMessage is required' });
    }

    try {
        // Get OpenAI response
        console.log('Sending request to OpenAI');
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
            console.log('Sending request to AWS Polly');
            const s3Url = await getSpeech(aiResponse, language);
            console.log('Generated S3 URL:', s3Url);

            // Respond with the audio URL and AI text
            res.json({
                message: 'Audio generated and uploaded successfully!',
                s3Url,
                aiResponse
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

// Example of where to test getSpeech
const testText = "Hello, this is a longer test of AWS Polly in English. Let's see how it performs with a longer input.";
const testLanguageCode = 'en-US';

getSpeech(testText, testLanguageCode).then(url => {
    console.log("Generated speech URL:", url);
}).catch(error => {
    console.error("Error during speech generation:", error);
});









