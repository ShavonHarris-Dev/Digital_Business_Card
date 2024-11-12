/* eslint-disable no-undef */
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';


const app = express();
app.use(cors());
// app.use(
//   cors({
//     origin: 'https://getdowntobusinesscard.netlify.app/api/chat', // Replace with your deployed URL
//     methods: ['GET', 'POST'],
//     allowedHeaders: ['Content-Type'],
//   })
// );

app.use(express.json());

// AWS Clients Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  },
});


app.get('/api/test-aws', async (req, res) => {
  console.log('Test AWS endpoint hit!');
  console.log('Environment variables:', {
    MY_AWS_ACCESS_KEY_ID: process.env.MY_AWS_ACCESS_KEY_ID,
    MY_AWS_REGION: process.env.MY_AWS_REGION,
    MY_AWS_S3_BUCKET: process.env.MY_AWS_S3_BUCKET,
  });

  try {
    const bucketName = process.env.MY_AWS_S3_BUCKET;
    const params = {
      Bucket: bucketName,
      Key: 'test.txt',
      Body: 'Hello, AWS S3!',
    };

    await s3Client.send(new PutObjectCommand(params));
    res.status(200).send('AWS credentials are working!');
  } catch (error) {
    console.error('AWS test failed:', error);
    res.status(500).send('AWS test failed');
  }
});

// Load Profile Data
const profileData = JSON.parse(fs.readFileSync(path.resolve('shavon_profile.json'), 'utf-8'));

// OpenAI Configuration
const openai = new OpenAI({ apiKey: process.env.MY_OPENAI_API_KEY });


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

// Helper: Generate Speech with Polly
const getSpeech = async (text, languageCode = 'en-US') => {
  const languageMap = {
    'en-US': { voiceId: 'Joanna' },
    'fr-FR': { voiceId: 'Celine' },
    'es-ES': { voiceId: 'Lucia' },
    'hi-IN': { voiceId: 'Aditi' },
    'ar-SA': { voiceId: 'Zeina' },
    'ko-KR': { voiceId: 'Seoyeon' },
  };

  const voiceId = languageMap[languageCode]?.voiceId || 'Joanna';

  const params = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: voiceId,
    LanguageCode: languageCode,
  };

  try {
    const pollyResponse = await pollyClient.send(new SynthesizeSpeechCommand(params));
    if (!pollyResponse.AudioStream) throw new Error('AudioStream is empty');

    const audioBuffer = Buffer.from(await pollyResponse.AudioStream.transformToByteArray());
    const bucketName = process.env.MY_AWS_S3_BUCKET;
    const key = `audio/${Date.now()}.mp3`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
      })
    );

    return await generatePreSignedUrl(bucketName, key);
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
};

// Express Route: Chat
app.post('/api/chat', async (req, res) => {
  const { userMessage, language } = req.body;
  console.log('Received request:', req.body);
  console.log('Headers:', req.headers);
  console.log('userMessage:', userMessage);
  console.log('language:', language)

  if (!userMessage) {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  try {
    // System prompt including profile data for RAG logic
    const systemMessage = `
      You are Shavon's personal assistant, here to highlight their exceptional skills as a React/JavaScript Developer.
      Your role is to truthfully represent Shavon's abilities while actively promoting them to potential recruiters. 
      Focus on practical achievements, leadership in projects, and passion for innovation.
      Here is their profile information: ${JSON.stringify(profileData)}`;

    // Get AI Response
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 300,
    });

    console.log('AI response:', aiResponse);

    const aiMessage = aiResponse.choices[0]?.message?.content?.trim() || 'No response received';

    // Generate Audio
    const s3Url = await getSpeech(aiMessage, language);

    res.json({
      message: 'Audio generated successfully!',
      aiResponse: aiMessage,
      s3Url,
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
  
});




// Export the Serverless Handler
export const handler = serverless(app);

