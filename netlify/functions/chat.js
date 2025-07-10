/* eslint-disable no-undef */
import validator from 'validator';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { ElevenLabsClient } from 'elevenlabs';
// import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
// import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

// CSRF Token Management
const CSRF_SECRET = process.env.CSRF_SECRET || 'digital-business-card-secret-key-2024';
const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Validate CSRF token
const validateCSRFToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    const parts = token.split(':');
    if (parts.length !== 3) {
      return false;
    }

    const [timestamp, random, signature] = parts;
    const payload = `${timestamp}:${random}`;
    
    // Check if token has expired
    const tokenTime = parseInt(timestamp, 10);
    if (Date.now() - tokenTime > TOKEN_EXPIRY) {
      return false;
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', CSRF_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
};

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

// Configure Express to trust Netlify proxy with specific settings
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

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
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8888'],
  credentials: true,
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting configuration - Disabled for development
const chatLimiter = (req, res, next) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // Enable rate limiting in production
  return rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
      error: 'Too many chat requests from this IP. Please wait a minute before trying again.',
      retryAfter: 60
    }
  })(req, res, next);
};

// Global rate limiter for all endpoints (disabled in development)
const globalLimiter = (req, res, next) => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // Enable rate limiting in production
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: {
      error: 'Too many requests from this IP. Please try again later.',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
  })(req, res, next);
};

// Apply global rate limiting to all routes
app.use(globalLimiter);

// Request logging middleware for monitoring
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || 
             req.headers['x-forwarded-for']?.split(',')[0] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             'unknown';
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);
  
  // Log rate limit headers if they exist
  if (req.rateLimit) {
    console.log(`Rate limit info - Remaining: ${req.rateLimit.remaining}/${req.rateLimit.limit}, Reset: ${new Date(req.rateLimit.resetTime).toISOString()}`);
  }
  
  next();
});

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
if (!process.env.MY_OPENAI_API_KEY || process.env.MY_OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.warn('Warning: OpenAI API key is not configured. Please set MY_OPENAI_API_KEY in your .env file.');
}
const openai = new OpenAI({ apiKey: process.env.MY_OPENAI_API_KEY });

// ElevenLabs Configuration
if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
  console.warn('Warning: ElevenLabs API key is not configured. Audio generation will be disabled.');
}
const elevenlabs = process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here' 
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;

// Helper Function to Generate Speech with ElevenLabs
const generateSpeech = async (text, voiceId = "21m00Tcm4TlvDq8ikWAM") => {
  if (!elevenlabs) {
    throw new Error('ElevenLabs is not configured. Please set ELEVENLABS_API_KEY in your environment.');
  }

  try {
    // Generate speech using ElevenLabs textToSpeech.convert method
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });

    // Convert audio stream to buffer
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Return the audio buffer as base64
    const audioBase64 = audioBuffer.toString('base64');
    
    return {
      audioData: audioBase64,
      contentType: 'audio/mpeg'
    };
  } catch (error) {
    console.error('ElevenLabs speech generation error:', error);
    throw new Error('Failed to generate speech');
  }
};

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
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { userMessage } = req.body;
    
    // Extract CSRF token from header or body
    const csrfToken = req.headers['x-csrf-token'] || req.body.csrfToken;

    // CSRF Token Validation
    if (!csrfToken) {
      console.log(`[${new Date().toISOString()}] CSRF token missing from IP: ${req.ip}`);
      return res.status(403).json({ 
        error: 'CSRF token required. Please refresh the page and try again.',
        code: 'CSRF_TOKEN_MISSING'
      });
    }

    if (!validateCSRFToken(csrfToken)) {
      console.log(`[${new Date().toISOString()}] Invalid CSRF token from IP: ${req.ip}`);
      return res.status(403).json({ 
        error: 'Invalid or expired CSRF token. Please refresh the page and try again.',
        code: 'CSRF_TOKEN_INVALID'
      });
    }

    // Validate and sanitize input
    const sanitizedMessage = validateAndSanitizeInput(userMessage);
   
    if (!sanitizedMessage) {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    // Check if OpenAI API key is configured
    if (!process.env.MY_OPENAI_API_KEY || process.env.MY_OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(500).json({ 
        error: 'OpenAI API key is not configured. Please contact the administrator.',
        code: 'API_KEY_NOT_CONFIGURED'
      });
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

    // Generate speech with ElevenLabs (optional - can be disabled with query parameter)
    let audioData = null;
    const includeAudio = req.query.includeAudio !== 'false'; // Default to true
    
    if (includeAudio && elevenlabs) {
      try {
        const speechResult = await generateSpeech(aiMessage);
        audioData = speechResult.audioData;
        console.log(`[${new Date().toISOString()}] Speech generated successfully for IP: ${req.ip}`);
      } catch (speechError) {
        console.error('Speech generation failed:', speechError);
        // Continue without audio if speech generation fails
      }
    } else if (includeAudio && !elevenlabs) {
      console.log('Audio requested but ElevenLabs is not configured');
    }

    // Generate Speech and Upload to S3, then get Pre-Signed URL
    // const presignedUrl = await getSpeech(aiMessage, languageCode);

    // Respond with the AI message and audio data
    // res.status(200).json({ aiResponse: aiMessage, s3Url: presignedUrl });
    res.status(200).json({ 
      response: sanitizedResponse, // Changed from aiResponse to response to match frontend
      timestamp: new Date().toISOString(),
      audioData: audioData, // Base64 encoded audio from ElevenLabs
      hasAudio: !!audioData
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

