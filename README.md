# 🤖 AI-Powered Digital Business Card

> A modern, interactive digital business card featuring AI-powered conversations and natural voice synthesis — built from scratch to showcase full-stack development and cutting-edge AI integration.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://shavonharris.netlify.app)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green)](https://openai.com/)
[![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7)](https://netlify.com/)

---

## 🌟 Highlights

- **Intelligent Conversations** — Powered by OpenAI GPT-4, the chatbot answers questions about my background, skills, and projects with contextual awareness
- **Natural Voice Synthesis** — Hear responses spoken aloud via ElevenLabs text-to-speech for an immersive, accessible experience
- **Enterprise-Grade Security** — CSRF protection, rate limiting (10 req/min), input sanitization, and Helmet security headers
- **Progressive Web App (PWA)** — Installable on any device with offline support and optimized caching strategies
- **Serverless Architecture** — Backend runs entirely on Netlify Functions, eliminating server management overhead
- **Built from 0 to 1** — Demonstrates end-to-end product ownership from concept to production deployment

---

## ℹ️ Overview

This project serves as my **interactive digital presence** — a business card that doesn't just display information, but *engages* with visitors through intelligent conversation. Whether you're a recruiter, fellow developer, or potential collaborator, you can ask the AI chatbot questions about my experience, technical skills, or projects, and receive personalized, voice-enabled responses.

### Why I Built This

After building enterprise applications serving 50,000+ users at Trellix (including 80% of Fortune 100 companies), I wanted to create something that showcased my ability to:
- Design and ship full-stack applications from scratch
- Integrate cutting-edge AI features into user-facing products
- Build secure, scalable serverless architectures
- Deliver accessible, polished user experiences

This project reflects the same standards I held while developing mission-critical cybersecurity workflows — just with a more personal touch.

### ✍🏾 Author

I'm **Shavon Harris**, a Full-Stack Software Engineer specializing in React, Node.js, and AI integrations. I've built enterprise-grade applications processing 68 billion queries daily, automated workflows saving 10+ hours weekly, and delivered AI-powered products that prioritize accessibility and user experience. This digital business card represents my commitment to building high-impact, innovative solutions.

Learn more: [LinkedIn](https://linkedin.com/in/shavonharris) | [Portfolio](https://shavonharrisdev.com)

---

## 🚀 Features & Capabilities

### AI Chatbot
- **Context-Aware Responses** — The AI is trained on my professional background, projects, and expertise
- **Natural Conversations** — Ask about my experience at Trellix, technical skills, side projects, or career goals
- **Voice Output** — Toggle voice mode to hear responses via ElevenLabs TTS synthesis

### Security & Performance
- **CSRF Token Protection** — Every chat request validated with secure tokens
- **Rate Limiting** — 10 requests per minute per user to prevent abuse
- **Input Sanitization** — XSS protection with DOMPurify on all user inputs
- **Helmet Headers** — HTTP security headers configured for production

### Progressive Web App
- **Installable** — Add to home screen on mobile/desktop for native-like experience
- **Offline Fallback** — Service worker provides graceful degradation when offline
- **Optimized Caching** — Strategic cache-first/network-first policies for assets and API calls

---

## 🎁 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Netlify CLI (for local serverless function testing)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/digital-business-card.git
cd digital-business-card

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your OPENAI_API_KEY and ELEVENLABS_API_KEY
```

### Running Locally
```bash
# Frontend only (Vite dev server)
npm run dev

# Full stack with serverless functions (recommended)
npm start
```

Navigate to `http://localhost:8888` to see the app in action.

### Production Build
```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗️ Tech Stack

### Frontend
- **React 18** — Modern component-based UI with hooks
- **Vite** — Lightning-fast build tool and dev server
- **Custom CSS** — Themeable design system with CSS variables
- **PWA** — Manifest, service worker, and offline support

### Backend (Serverless)
- **Netlify Functions** — Express.js running as serverless endpoints
- **OpenAI API (GPT-4)** — Contextual chatbot responses
- **ElevenLabs** — Natural-sounding text-to-speech synthesis
- **DOMPurify** — Client-side XSS sanitization

### DevOps & Security
- **Netlify Deployment** — Continuous deployment from main branch
- **CSRF Protection** — Token-based request validation
- **Rate Limiting** — Per-user throttling via in-memory store
- **Helmet** — HTTP security headers (CSP, HSTS, X-Frame-Options)

---

## 📂 Project Structure
```
├── src/
│   ├── Components/          # React components
│   │   ├── ChatBox.jsx      # AI chatbot interface
│   │   ├── About.jsx        # Profile information
│   │   ├── Footer.jsx       # Contact links
│   │   └── ...
│   ├── App.jsx              # Root component
│   └── index.css            # Global styles & CSS variables
│
├── netlify/functions/       # Serverless API endpoints
│   ├── chat.js              # OpenAI + ElevenLabs integration
│   └── csrf-token.js        # Security token generation
│
├── public/
│   ├── manifest.json        # PWA configuration
│   ├── sw.js                # Service worker
│   └── offline.html         # Offline fallback page
│
├── shavon_profile.json      # AI training data (bio, skills, projects)
├── netlify.toml             # Deployment & redirect config
└── vite.config.js           # Vite build configuration
```

---

## 🔒 Security Features

This application implements **production-grade security** despite being a personal project:

| Feature | Implementation | Impact |
|---------|---------------|--------|
| **CSRF Protection** | Token validation on all POST requests | Prevents cross-site attacks |
| **Rate Limiting** | 10 requests/minute per IP | Mitigates abuse & API cost |
| **Input Sanitization** | DOMPurify on user messages | Blocks XSS vulnerabilities |
| **Helmet Headers** | CSP, HSTS, X-Frame-Options | Defense-in-depth security |
| **Environment Secrets** | API keys in Netlify env vars | No credentials in codebase |

---

## 🎨 Customization

### Personalizing the AI
Edit `shavon_profile.json` to update the chatbot's knowledge base:
```json
{
  "name": "Your Name",
  "role": "Your Title",
  "experience": [
    {
      "company": "Company Name",
      "role": "Your Role",
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "projects": [...]
}
```

### Theming
CSS variables in `index.css` control the entire color scheme:
```css
:root {
  --primary-color: #your-color;
  --background: #your-bg;
  --text-color: #your-text;
  /* ... */
}
```

---

## 📊 Performance Metrics

- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <2.5s
- **Bundle Size:** <150KB (gzipped)
- **Offline Functionality:** 100% of static pages

---

## 🚧 Roadmap

- [ ] **Analytics Dashboard** — Track chatbot usage patterns and popular questions
- [ ] **Multi-language Support** — Respond in user's preferred language via OpenAI
- [ ] **Voice Input** — Accept spoken questions using Web Speech API
- [ ] **Theme Switcher** — Light/dark mode toggle with persistent preference
- [ ] **Contact Form** — Direct email integration for collaboration inquiries

---

## 🤝 Feedback & Contributions

This is a **personal portfolio project**, but I welcome feedback and suggestions! If you:
- Found a bug or security issue → [Open an issue](https://github.com/yourusername/digital-business-card/issues)
- Have ideas for improvement → [Start a discussion](https://github.com/yourusername/digital-business-card/discussions)
- Want to collaborate → [Connect on LinkedIn](https://linkedin.com/in/shavonharris)

---

## 📄 License

This project is open source under the [MIT License](LICENSE). Feel free to fork and adapt for your own digital business card!

---

## 🙏🏾 Acknowledgments

- **OpenAI** — For GPT-4 API powering intelligent conversations
- **ElevenLabs** — For natural-sounding text-to-speech synthesis
- **Netlify** — For seamless serverless deployment and hosting
- **React Community** — For exceptional tooling and documentation

---

<div align="center">

**Built with 💙 by Shavon Harris**

[View Live Demo](https://getdowntobusinesscard.netlify.app/) • [LinkedIn](https://www.linkedin.com/in/shavonharris-dev/) • [Portfolio](https://shavonharris.dev/)

</div>


