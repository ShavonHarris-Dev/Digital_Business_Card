# Digital Business Card - Developer Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development (frontend only)
npm run dev

# Development with serverless functions
npm run start

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📁 Project Structure

```
Digital_Business_Card/
├── src/
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # Entry point + PWA registration
│   ├── Components.css             # All styling with CSS custom properties
│   ├── index.css                  # Base Vite styles (minimal)
│   └── Components/
│       ├── Info.jsx               # Profile header
│       ├── ChatBox.jsx            # AI chat interface (most complex)
│       ├── About.jsx              # Professional summary
│       ├── Interests.jsx          # Personal interests
│       └── Footer.jsx             # Social media links
│
├── netlify/functions/
│   ├── chat.js                    # Main API endpoint (OpenAI + security)
│   └── csrf-token.js              # CSRF token generation
│
├── public/
│   ├── service-worker.js          # PWA caching logic
│   ├── offline.html               # Offline fallback page
│   ├── manifest.json              # PWA configuration
│   └── icons/                     # App icons (192x192, 512x512)
│
├── shavon_profile.json            # Structured profile data for AI
├── netlify.toml                   # Netlify deployment config
├── vite.config.js                 # Vite build configuration
└── package.json                   # Dependencies and scripts
```

## 🔧 Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18.3.1 | Component-based UI |
| **Build** | Vite 5.4.8 | Fast dev server + optimized builds |
| **Backend** | Netlify Functions | Serverless API endpoints |
| **AI** | OpenAI GPT-4 | Conversational responses |
| **Audio** | ElevenLabs | Text-to-speech generation |
| **Security** | Custom CSRF + Helmet.js | Multi-layer protection |
| **PWA** | Service Worker | Offline functionality |
| **Styling** | CSS Custom Properties | Consistent theming |

## 🛡️ Security Features

### CSRF Protection
```javascript
// Token structure: timestamp:random:signature
const csrfToken = "1703123456789:abc123def456:sha256signature";

// Frontend usage
headers: {
  'X-CSRF-Token': csrfToken
}

// Backend validation
if (!validateCSRFToken(csrfToken)) {
  return res.status(403).json({ error: 'Invalid CSRF token' });
}
```

### Input Validation
```javascript
// Client-side
const validateInput = (input) => {
  if (!input || input.length < 2) return "Too short";
  if (input.length > 1000) return "Too long";
  return null;
};

// Server-side
const validateAndSanitizeInput = (input) => {
  let sanitized = validator.escape(validator.trim(input));
  // Check for suspicious patterns
  if (/<script|javascript:|on\w+\s*=/i.test(sanitized)) {
    throw new Error('Potentially malicious content detected');
  }
  return validator.unescape(sanitized);
};
```

### Rate Limiting
```javascript
// Production only - disabled in development
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 10,                // 10 requests per minute per IP
  message: { error: 'Too many requests' }
});
```

## 🎨 Styling System

### CSS Custom Properties
```css
:root {
  /* Brand Colors */
  --primary-orange: #D35400;      /* Burnt orange */
  --secondary-brown: #8C6239;     /* Rich brown */
  --background-cream: #FAF3E0;    /* Soft cream */
  
  /* Spacing Scale */
  --spacing-xs: 0.5rem;   /* 8px */
  --spacing-sm: 1rem;     /* 16px */
  --spacing-md: 1.5rem;   /* 24px */
  --spacing-lg: 2rem;     /* 32px */
  --spacing-xl: 3rem;     /* 48px */
  
  /* Typography */
  --font-family-primary: 'Inter', system-ui, sans-serif;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}
```

### Component Styling Pattern
```css
.component-name {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  
  /* Colors */
  background: var(--background-cream);
  color: var(--text-dark);
  
  /* Spacing */
  padding: var(--spacing-lg);
  margin: var(--spacing-md) 0;
  
  /* Effects */
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}
```

## 🤖 AI Integration

### OpenAI Configuration
```javascript
const openai = new OpenAI({ 
  apiKey: process.env.MY_OPENAI_API_KEY 
});

const systemMessage = `You are Shavon's personal assistant...
  Here is their profile information: ${JSON.stringify(profileData)}`;

const aiResponse = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemMessage },
    { role: "user", content: sanitizedMessage }
  ],
  max_tokens: 500,
  temperature: 0.7
});
```

### Audio Generation (ElevenLabs)
```javascript
const generateSpeech = async (text) => {
  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text: text,
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  });
  
  // Convert to base64 for frontend
  const chunks = [];
  for await (const chunk of audio) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('base64');
};
```

## 📱 PWA Implementation

### Service Worker Cache Strategy
```javascript
const cacheName = "shavon-app-v1";
const assetsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/Components.css",
  "/offline.html"
];

// Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      });
    })
  );
});
```

### App Manifest
```json
{
  "name": "Shavon Harris - Digital Business Card",
  "short_name": "Shavon Harris",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF3E0",
  "theme_color": "#D35400",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔍 Component Deep Dive

### ChatBox.jsx - Key State Variables
```javascript
const [userMessage, setUserMessage] = useState('');        // Current input
const [chatHistory, setChatHistory] = useState([]);        // All messages
const [isLoading, setIsLoading] = useState(false);         // Loading state
const [error, setError] = useState('');                    // Error messages
const [rateLimitInfo, setRateLimitInfo] = useState(null);  // Rate limit status
const [csrfToken, setCsrfToken] = useState(null);          // Security token
const [isPlayingAudio, setIsPlayingAudio] = useState(false); // Audio state
const [audioEnabled, setAudioEnabled] = useState(true);    // Audio preference
```

### API Response Format
```javascript
// Successful chat response
{
  "response": "Sanitized AI response text",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "audioData": "base64_encoded_audio_data",
  "hasAudio": true
}

// Rate limit error
{
  "error": "Too many requests",
  "retryAfter": 60,
  "remaining": 0,
  "limit": 10
}

// CSRF error
{
  "error": "Invalid CSRF token",
  "code": "CSRF_TOKEN_INVALID"
}
```

## 🌐 Environment Variables

### Required
```bash
# OpenAI Integration (Required)
MY_OPENAI_API_KEY=sk-your-openai-key-here

# Security (Recommended)
CSRF_SECRET=your-secure-random-string-here
```

### Optional
```bash
# Audio Generation
ELEVENLABS_API_KEY=your-elevenlabs-key-here

# AWS Integration (Future - Currently Commented Out)
MY_AWS_ACCESS_KEY_ID=your-aws-access-key
MY_AWS_SECRET_ACCESS_KEY=your-aws-secret-key
MY_AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=us-east-1
```

## 🚨 Common Issues & Solutions

### 1. "CSRF token not available" Error
**Cause**: Frontend can't fetch CSRF token from backend
**Solution**: 
- Check if `/api/csrf-token` endpoint is accessible
- Verify Netlify functions are deployed
- Check browser network tab for failed requests

### 2. "Rate limit exceeded" in Development
**Cause**: Rate limiting accidentally enabled in dev
**Solution**: Rate limiting is disabled in development by default
```javascript
if (process.env.NODE_ENV !== 'production') {
  return next(); // Skip rate limiting
}
```

### 3. Audio Not Playing
**Cause**: ElevenLabs API key not configured or audio disabled
**Solution**:
- Set `ELEVENLABS_API_KEY` environment variable
- Check audio toggle in chat interface
- Verify browser allows audio playback

### 4. Build Failures
**Cause**: Missing dependencies or configuration issues
**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist .vite
npm run build
```

## 🔧 Development Workflow

### 1. Local Development
```bash
# Start development server with functions
npm run start

# Or frontend only (faster, but no AI chat)
npm run dev
```

### 2. Testing Changes
```bash
# Lint code
npm run lint

# Build to check for errors
npm run build

# Test production build locally
npm run preview
```

### 3. Deployment
- Push to main branch
- Netlify auto-deploys
- Check deployment logs in Netlify dashboard
- Verify environment variables are set

## 📊 Performance Considerations

### Bundle Size Optimization
- React and dependencies: ~155KB gzipped
- CSS: ~9KB with custom properties
- Images: Optimized profile image ~691KB

### Loading Strategy
- Service Worker caches static assets
- Lazy loading could be added for ChatBox component
- Image optimization with WebP format recommended

### API Optimization
- OpenAI responses cached briefly (could be extended)
- Rate limiting prevents abuse
- Audio generation is optional to reduce latency

## 🔐 Security Checklist

- [x] CSRF protection implemented
- [x] Input validation (client + server)
- [x] Rate limiting (production only)
- [x] Security headers (Helmet.js)
- [x] Input sanitization (HTML escaping)
- [x] Error handling (no internal details exposed)
- [x] HTTPS enforced (Netlify default)
- [x] Environment variables secured
- [x] CORS properly configured
- [x] No sensitive data in frontend bundle

## 📈 Monitoring & Debugging

### Console Logs to Watch
```javascript
// CSRF token management
"CSRF token fetched successfully"
"CSRF token expired. Please try sending your message again."

// Rate limiting
"Rate limit info - Remaining: X/Y requests"

// Audio generation
"Speech generated successfully"
"Audio playback failed"

// API requests
"Sending request to backend with message: ..."
"Response received from backend: ..."
```

### Network Tab Debugging
- `/api/csrf-token` - Should return 200 with token
- `/api/chat` - Should return 200 with AI response
- Check for proper headers: `X-CSRF-Token`, `Content-Type`
- Rate limit headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🎯 Extension Points

### Easy Additions
1. **New Components**: Add to `src/Components/` and import in `App.jsx`
2. **Styling Updates**: Modify CSS custom properties in `Components.css`
3. **Profile Updates**: Edit `shavon_profile.json`
4. **New API Endpoints**: Add to `netlify/functions/`

### Advanced Extensions
1. **Database Integration**: Replace JSON with Supabase/MongoDB
2. **Authentication**: Add user accounts and personalization
3. **Analytics**: Integrate with Google Analytics or custom tracking
4. **CMS Integration**: Use Strapi or Contentful for content management
5. **Multi-language**: Add i18n support with react-i18next
6. **Advanced PWA**: Add push notifications and background sync

This reference should help developers quickly understand and work with the codebase effectively!