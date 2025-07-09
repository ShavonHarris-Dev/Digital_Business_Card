/* eslint-disable no-undef */
import validator from 'validator';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
// import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
// import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

// Add this validation function
const validateAndSanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: Message must be a non-empty string');
  }
  
  if (input.length > 1000) {
    throw new Error('Message too long. Please keep messages under 1000 characters.');
  }
  
  let sanitized = validator.trim(input);
  sanitized = validator.escape(sanitized);
  
  // Check for suspicious patterns
  const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Invalid input: Potentially malicious content detected');
    }
  }
  
  return validator.unescape(sanitized);
};

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://getdowntobusinesscard.netlify.app'] // Replace with your actual domain
    : ['http://localhost:5173', 'http://localhost:8888'],
  credentials: true,
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Load Profile Data
const profileData = JSON.parse(fs.readFileSync(path.resolve('shavon_profile.json'), 'utf-8'));


// AWS Clients Configuration
// const s3Client = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
//   },
//   // endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
// });


// const pollyClient = new PollyClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
//   },
// });

// OpenAI Configuration
const openai = new OpenAI({ apiKey: process.env.MY_OPENAI_API_KEY });

// const generatePreSignedUrl = async (bucketName, key, expiresIn = 3600) => {
//   const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
//   try {
//     const url = await getSignedUrl(s3Client, command, { expiresIn });
//     return url;
//   } catch (error) {
//     console.error('Error generating pre-signed URL:', error);
//     throw error;
//   }
// };

// Helper Function to Generate Speech and Upload to S3
// const getSpeech = async (text, languageCode) => {
//   const languageMap = {
//     'en-US': { voiceId: 'Joanna' },
//     'fr-FR': { voiceId: 'Celine' },
//     'es-ES': { voiceId: 'Lucia' },
//     'hi-IN': { voiceId: 'Aditi' },
//     'ar-SA': { voiceId: 'Zeina' },
//     'ko-KR': { voiceId: 'Seoyeon' },
//     // Add more mappings as needed
//   };

//   const voiceId = languageMap[languageCode]?.voiceId || 'Joanna';

//   const pollyParams = {
//     Text: text,
//     OutputFormat: 'mp3',
//     VoiceId: voiceId,
//     LanguageCode: languageCode,
//   };

//   try {
//     // Generate speech using Polly
//     const pollyResponse = await pollyClient.send(new SynthesizeSpeechCommand(pollyParams));
//     if (!pollyResponse.AudioStream) throw new Error('AudioStream is empty');

//     // Convert AudioStream to Buffer
//     const audioBuffer = Buffer.from(await pollyResponse.AudioStream.transformToByteArray());

//     // Define S3 upload parameters
//     const bucketName = process.env.MY_AWS_S3_BUCKET;
//     const key = `audio/${Date.now()}.mp3`;

//     const uploadParams = {
//       Bucket: bucketName,
//       Key: key,
//       Body: audioBuffer,
//       ContentType: 'audio/mpeg',
//     };

//     // Upload the audio file to S3
//     await s3Client.send(new PutObjectCommand(uploadParams));

//     // Generate Pre-Signed URL
//     const presignedUrl = await generatePreSignedUrl(bucketName, key, 3600); // Expires in 1 hour

//     return presignedUrl;
//   } catch (error) {
//     console.error('Error in getSpeech:', error);
//     throw error;
//   }
// };



// Test Route to Verify AWS Credentials
// app.get('/api/test-aws', async (req, res) => {
//   try {
//     const params = {
//       Bucket: process.env.MY_AWS_S3_BUCKET,
//       Key: 'test.txt',
//       Body: 'Hello, AWS S3!',
//     };

//     await s3Client.send(new PutObjectCommand(params));
//     res.status(200).send('AWS credentials are working!');
//   } catch (error) {
//     console.error('AWS test failed:', error);
//     res.status(500).send('AWS test failed');
//   }
// });


// Chat Endpoint to Generate AI Response, Speech, and Return Pre-Signed URL
app.post('/api/chat', async (req, res) => {
  try {
    const { userMessage } = req.body;

    // Validate and sanitize input
    const sanitizedMessage = validateAndSanitizeInput(userMessage);
   
    if (!sanitizedMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    // Construct System Message using Profile Data
    const systemMessage = `You are Shavon's personal assistant, here to highlight their exceptional skills as a React/JavaScript Developer.
        Your role is to truthfully represent Shavon's abilities while actively promoting them to potential recruiters. 
        Focus on practical achievements, leadership in projects, and passion for innovation.
        Here is their profile information: ${JSON.stringify(profileData)}`;

    // Generate AI Response using OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: sanitizedMessage }, // Use sanitized message
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiMessage = aiResponse.choices[0].message.content;

    // Sanitize AI response for safe display
    const sanitizedResponse = validator.escape(aiMessage);

    // Generate Speech and Upload to S3, then get Pre-Signed URL
    // const presignedUrl = await getSpeech(aiMessage, languageCode);

    // Respond with the AI message and Pre-Signed URL
    // res.status(200).json({ aiResponse: aiMessage, s3Url: presignedUrl });
    res.status(200).json({ 
      response: sanitizedResponse, // Changed from aiResponse to response to match frontend
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    
    // Handle validation errors specifically
    if (error.message.includes('Invalid input') || 
        error.message.includes('Message too long') || 
        error.message.includes('Message cannot be empty')) {
      return res.status(400).json({ error: error.message });
    }
    
    // Handle OpenAI API errors
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Service is temporarily busy. Please try again in a moment.' 
      });
    }
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: 'An error occurred while processing your request. Please try again.' 
    });
  }
});

// Default Route  
app.get('/', (req, res) => {
  res.send('Welcome to the Chat API');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});




// Export the Serverless Handler
export const handler = serverless(app);

