# Digital Business Card - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND (REACT)                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │    Info     │  │   ChatBox   │  │    About    │  │ Interests   │           │
│  │  Component  │  │  Component  │  │  Component  │  │  Component  │           │
│  │             │  │             │  │             │  │             │           │
│  │ • Profile   │  │ • AI Chat   │  │ • Summary   │  │ • Personal  │           │
│  │ • Contact   │  │ • Security  │  │ • Skills    │  │ • Hobbies   │           │
│  │ • Links     │  │ • Audio     │  │ • Experience│  │             │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│                           │                                                     │
│                           │ HTTPS + CSRF                                        │
│                           │ Rate Limited                                        │
│                           ▼                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                           SECURITY LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │    CSRF     │  │    Input    │  │    Rate     │  │   Security  │           │
│  │ Protection  │  │ Validation  │  │  Limiting   │  │   Headers   │           │
│  │             │  │             │  │             │  │             │           │
│  │ • Token Gen │  │ • Client    │  │ • IP Based  │  │ • Helmet.js │           │
│  │ • Validation│  │ • Server    │  │ • Prod Only │  │ • CSP       │           │
│  │ • Auto Refresh│ • Sanitize  │  │ • 10/min    │  │ • CORS      │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│                           │                                                     │
│                           ▼                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                        BACKEND API (NETLIFY FUNCTIONS)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐      │
│  │           chat.js               │  │        csrf-token.js            │      │
│  │                                 │  │                                 │      │
│  │ • Main API endpoint             │  │ • Token generation              │      │
│  │ • OpenAI integration           │  │ • HMAC-SHA256 signing           │      │
│  │ • ElevenLabs audio             │  │ • 15-minute expiry              │      │
│  │ • Error handling               │  │ • Automatic refresh             │      │
│  │ • Request logging              │  │                                 │      │
│  └─────────────────────────────────┘  └─────────────────────────────────┘      │
│                    │                                                            │
│                    ▼                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              EXTERNAL APIS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                           │
│  │   OpenAI    │  │ ElevenLabs  │  │ AWS (Future)│                           │
│  │    GPT-4    │  │    TTS      │  │    S3/Polly │                           │
│  │             │  │             │  │             │                           │
│  │ • Chat API  │  │ • Voice Gen │  │ • Storage   │                           │
│  │ • Context   │  │ • Audio     │  │ • Speech    │                           │
│  │ • Responses │  │ • Base64    │  │ (Commented) │                           │
│  └─────────────┘  └─────────────┘  └─────────────┘                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────┐                                          │
│  │       shavon_profile.json       │                                          │
│  │                                 │                                          │
│  │ • Personal Information          │                                          │
│  │ • Professional Summary          │                                          │
│  │ • Skills & Technologies         │                                          │
│  │ • Work Experience               │                                          │
│  │ • Projects Portfolio            │                                          │
│  │ • Education History             │                                          │
│  │ • Community Engagement          │                                          │
│  │                                 │                                          │
│  │ Used as AI context for          │                                          │
│  │ personalized responses          │                                          │
│  └─────────────────────────────────┘                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                             PWA FEATURES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Service   │  │  App Icons  │  │  Manifest   │  │  Offline    │           │
│  │   Worker    │  │             │  │   Config    │  │    Page     │           │
│  │             │  │ • 192x192   │  │             │  │             │           │
│  │ • Caching   │  │ • 512x512   │  │ • Name      │  │ • Fallback  │           │
│  │ • Offline   │  │ • PNG/JPEG  │  │ • Colors    │  │ • Cached    │           │
│  │ • Updates   │  │             │  │ • Display   │  │ • Basic UI  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DEPLOYMENT PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   GitHub    │───▶│    Vite     │───▶│   Netlify   │───▶│    CDN      │     │
│  │  Repository │    │    Build    │    │   Deploy    │    │  Distribution│     │
│  │             │    │             │    │             │    │             │     │
│  │ • Source    │    │ • Bundle    │    │ • Functions │    │ • Global    │     │
│  │ • Commits   │    │ • Optimize  │    │ • Static    │    │ • Fast      │     │  
│  │ • Auto Deploy│   │ • Assets    │    │ • Env Vars  │    │ • Cached    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. User loads website                                                          │
│     ├─ Service Worker registers                                                 │
│     ├─ React app renders                                                        │
│     └─ CSRF token fetched                                                       │
│                                                                                 │
│  2. User views profile (Info component)                                        │
│     ├─ Profile image displays                                                   │
│     ├─ Contact buttons available                                                │
│     └─ External links accessible                                                │
│                                                                                 │
│  3. User interacts with chat                                                   │
│     ├─ Input validation (client-side)                                          │
│     ├─ CSRF token attached                                                      │
│     ├─ Message sent to API                                                      │
│     ├─ Rate limiting checked                                                    │
│     ├─ Input sanitized (server-side)                                           │
│     ├─ OpenAI processes with profile context                                   │
│     ├─ Audio generated (optional)                                              │
│     └─ Response displayed with security indicators                             │
│                                                                                 │
│  4. User sees additional content                                               │
│     ├─ About section (professional summary)                                    │
│     ├─ Interests section (personal info)                                       │
│     └─ Footer with social links                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
App.jsx
├── Info.jsx (Profile display)
├── ChatBox.jsx (Interactive AI chat)
│   ├── State Management (8 state variables)
│   ├── CSRF Token Management
│   ├── Input Validation & Sanitization  
│   ├── API Communication
│   ├── Audio Playback
│   ├── Error Handling
│   └── Security Status Display
├── About.jsx (Professional summary)
├── Interests.jsx (Personal interests)
└── Footer.jsx (Social media links)
```

## Security Architecture

```
Request Flow with Security Layers:

User Input → Client Validation → CSRF Token → Rate Limiting → Server Validation → API Processing

1. Client-side Input Validation
   ├── Length checks (2-1000 characters)
   ├── Type validation (string)
   └── Real-time feedback

2. CSRF Protection
   ├── Token generation with timestamp
   ├── HMAC-SHA256 signature
   ├── 15-minute expiry
   └── Automatic refresh

3. Rate Limiting (Production)
   ├── Global: 100 requests/15 minutes
   ├── Chat: 10 requests/minute
   └── IP-based tracking

4. Server-side Validation
   ├── HTML escaping
   ├── Suspicious pattern detection
   ├── Length validation
   └── Type checking

5. Security Headers
   ├── Content Security Policy
   ├── X-Frame-Options
   ├── X-Content-Type-Options
   └── CORS configuration
```

## Technology Integration Points

```
Frontend Technologies:
React 18.3.1 + Vite 5.4.8 + CSS Custom Properties

Backend Technologies:
Node.js + Express.js + Serverless Functions

Security Technologies:
Helmet.js + express-rate-limit + Validator.js + Custom CSRF

AI/Audio Technologies:
OpenAI GPT-4 + ElevenLabs TTS + (AWS Polly ready)

PWA Technologies:
Service Worker + Web App Manifest + Offline Caching

Build/Deploy Technologies:
Vite Build System + Netlify Hosting + Git-based Deploy
```