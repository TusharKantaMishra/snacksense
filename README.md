# SnackSense

A Next.js application that performs OCR (Optical Character Recognition) on food product images to extract and analyze ingredient information.

## Features

- OCR text extraction from food product images
- Ingredient analysis and health rating
- AI-powered text enhancement with Google Gemini
- Dictionary-based spell checking for common food ingredients
- Multiple image processing techniques for better accuracy
- Nutritional information extraction and analysis

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tesseract.js for OCR
- Google Gemini 1.5 Pro for AI text enhancement
- Firebase for authentication and data storage
- Tailwind CSS for styling

## Local Development

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd snacksense
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with the required environment variables:

```
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

4. Start the development server:

```bash
npm run dev
```

## Deployment

### Deploying to Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI:

```bash
npm install -g vercel
```

3. Login to Vercel:

```bash
vercel login
```

4. Deploy the application:

```bash
vercel
```

5. Set up environment variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to the "Environment Variables" tab
   - Add all the environment variables from your `.env.local` file

### Deploying to Render

1. Create a Render account at [render.com](https://render.com)
2. Click on "New Web Service"
3. Connect your GitHub repository
4. Configure your web service:
   - Name: snacksense
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment: Node
5. Add the environment variables from your `.env.local` file
6. Click "Create Web Service"

## Project Structure

- `/src/app/api/analyze/route.ts` - API endpoint for OCR and ingredient analysis
- `/src/app/upload/page.tsx` - UI for image upload and results display
- `/src/utils/` - Utility functions for ingredient analysis

## API Routes

### `/api/analyze`

POST endpoint that processes image uploads and returns ingredient analysis.

**Request:**
- Method: POST
- Body: FormData with 'image' field containing the image file

**Response:**
```json
{
  "success": true,
  "text": "Original OCR text",
  "dictionaryEnhancedText": "Text corrected with dictionary",
  "aiEnhancedText": "AI-enhanced text",
  "confidence": 90.5,
  "ingredients": [
    {
      "ingredient": "sugar",
      "healthRating": "Neutral",
      "explanation": "Best consumed in limited quantities"
    }
  ],
  "categorizedIngredients": {
    "Good": [],
    "Neutral": [{"ingredient": "sugar", "healthRating": "Neutral"}],
    "Bad": []
  },
  "nutritionalInfo": {
    "calories": "150 Cal",
    "protein": "2g"
  },
  "productSummary": {
    "overallRating": "Neutral",
    "summary": "This product contains a mix of healthy and less healthy ingredients.",
    "healthScore": 65,
    "recommendations": []
  }
}
```