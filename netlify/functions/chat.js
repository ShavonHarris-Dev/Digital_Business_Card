/* eslint-disable no-undef */
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
  // const { userMessage, language } = req.body;
  // const languageCode = language; // Ensure this maps correctly to 'languageMap'
  // const text = userMessage;
  const { userMessage } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  // Construct System Message using Profile Data
  const systemMessage = `You are Shavon's personal assistant, here to highlight their exceptional skills as a React/JavaScript Developer.
      Your role is to truthfully represent Shavon's abilities while actively promoting them to potential recruiters. 
      Focus on practical achievements, leadership in projects, and passion for innovation.
      Here is their profile information: ${JSON.stringify(profileData)}`;

  try {
    // Generate AI Response using OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        // { role: "user", content: text },
        { role: "user", content: userMessage },
      ],
      max_tokens: 150,
    });

    const aiMessage = aiResponse.choices[0].message.content;

    // Generate Speech and Upload to S3, then get Pre-Signed URL
    // const presignedUrl = await getSpeech(aiMessage, languageCode);

    // Respond with the AI message and Pre-Signed URL
    // res.status(200).json({ aiResponse: aiMessage, s3Url: presignedUrl });
    res.status(200).json({ aiResponse: aiMessage });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).send('Error processing chat request');
  }
});

// Default Route  
app.get('/', (req, res) => {
  res.send('Welcome to the Chat API');
});




// Export the Serverless Handler
export const handler = serverless(app);

