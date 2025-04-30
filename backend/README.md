# SnackSense Backend

This is the backend API for the SnackSense application. It provides endpoints for ingredient analysis, text extraction, and more.

## Directory Structure

```
backend/
├── api/                  # API routes
│   ├── about/            # About page endpoints
│   │   ├── seed/         # Seed data for About page
│   │   └── aboutRoutes.ts
│   └── ingredients/      # Ingredient analysis endpoints
│       ├── analyze/      # Analyze ingredients
│       ├── extract/      # Extract ingredients from text
│       └── ingredientsRoutes.ts
├── lib/                  # Shared libraries
│   └── firebase-admin.ts # Firebase Admin SDK configuration
├── server.ts             # Main entry point
├── package.json          # Backend dependencies
└── tsconfig.json         # TypeScript configuration
```

## Setup

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Create a `.env.local` file in the backend directory with your environment variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   FIRESTORE_EMULATOR_HOST=localhost:8080 # Optional for local development
   BACKEND_PORT=3001
   ```

## Running the Backend

Development mode:
```
npm run dev
```

Production build:
```
npm run build
npm start
```

## API Endpoints

### Ingredient Analysis

- `POST /api/ingredients/analyze` - Analyze food ingredients
- `POST /api/ingredients/extract` - Extract ingredients from text

### About Content

- `GET /api/about` - Get about page content
- `POST /api/about` - Add new about content
- `PUT /api/about` - Update existing about content
- `POST /api/about/seed` - Seed about page content

### Text Extraction

- `POST /api/extract-text` - Extract text from image
