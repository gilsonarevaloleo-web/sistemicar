# SISTEMI - Plataforma de Comando

## Overview
SISTEMI is a full-stack web application designed as a personal productivity and mental alchemy platform. It gamifies personal growth by helping users track energy states, manage challenging tasks, plan future goals, and maintain a hope log. The platform aims to disrupt traditional productivity models by rewarding courageous effort and offering a gamified experience with Command Points (CP), leveraging psychological principles for user engagement and personal transformation. It targets a Spanish-speaking audience with a focus on metaphors of consciousness and mental alchemy, with a business vision to transform personal development through gamified psychological principles and AI.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Design Principles
- **Gamification**: Rewards for effort and completion, including "courage" for attempting difficult tasks, with Command Points (CP) and systems like "Protocolo de Transmutación Final."
- **Aesthetic**: "Alta Alquimia" theme featuring a deep black background, `backdrop-blur-2xl`, Playfair Display typography, soft shadows, and luminous borders.
- **Dopamine System**: Gamified feedback loops with visual and celebratory elements like HeroDopamine and Momentum Calculation.
- **AI Integration**: Gemini is used for "Radar IA" (tension detection, mission suggestions), sentiment analysis, "Doctor IA" (clinical AI coach), "Minería de Consciencia" (behavioral pattern extraction), and "Filtro de Validación ADN Soberano" (insight analysis).
- **Adaptive Protocols**: Dynamic responses based on user engagement, such as "Extreme Force Protocol" and "Warrior Recruitment Protocol."
- **Mastery System**: Structured learning and certification levels through "Mastery Manuals System."

### Technical Implementation
- **Frontend**: React 18 with TypeScript, Wouter, TanStack React Query, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts. Vite is used for tooling.
- **Backend**: Node.js with Express.js (TypeScript, ESM) exposing RESTful JSON APIs.
- **Data Layer**: PostgreSQL with Drizzle ORM. Zod for validation.
- **Key Features**:
    - **Doctor IA Chat**: Persistent AI coaching with session memory.
    - **Espejo Soberano v5.0**: Clinical analysis and calibration system with structured axes and AI-driven diagnostics using a clinical dictionary and reprogramming matrices.
    - **Sistema de Convicción**: Progress tracking towards affiliation module unlock based on clinical protocol completion.
    - **Expediente Clínico Firebase**: Detailed session logging for clinical analysis.
    - **La Flota y Motor de Guerrero**: Gamified vehicle system for managing different types of activities (e.g., Time, Situational, Rest, Truth) with specific mechanics and rewards.
    - **Reloj Desglosador**: A vehicle clock type for sequential mission cycles with sub-vehicles.
    - **Admin Modules**: Tools for content generation (book chapters, video scripts, SEO keywords), audiovisual content production (narrator scripts, visual descriptions, binaural audio), YouTube masterclass creation, and AI strategic planning. This includes the "Automatizador de Semillas," "Fábrica Sensorial," "YouTube Educator," and "Estratega IA."
    - **API Pública de Detección de Interfaz**: Licensed B2B API (POST /api/public/detect-interface) that accepts text and returns the detected behavioral interface code (INTERFAZ_01..10), name, confidence and timestamp. Secured with per-client API keys managed via admin panel. Keys stored as SHA-256 hashes in PostgreSQL (public_api_keys + public_api_usage tables). Documentation available at GET /api/public/docs.
    - **Video Rendering Pipeline**: Full video rendering from generated content using ElevenLabs (TTS), DALL-E 3 (image generation), and FFmpeg.

### Project Structure
- `client/`: React frontend.
- `server/`: Express backend.
- `shared/`: Shared code.
- `db/`: Database connection.
- `rendered-videos/`: Generated video files.

## External Dependencies

### Database
- PostgreSQL
- Firebase (for specific clinical and content generation persistence)

### UI/UX Libraries
- Radix UI
- Framer Motion
- Recharts
- Lucide React
- Sonner
- Vaul

### Build & Development
- Vite
- esbuild
- Tailwind CSS v4
- TypeScript

### AI
- Gemini 2.0 Flash Lite (Google)
- OpenAI DALL-E 3
- ElevenLabs (eleven_multilingual_v2)

### Video
- FFmpeg 6.1.2