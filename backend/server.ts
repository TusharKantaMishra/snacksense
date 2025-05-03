import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { IncomingForm, Fields, Files } from 'formidable';
import { createWorker } from 'tesseract.js';
// Use type assertion to bypass TypeScript module resolution error
// @ts-ignore
import { adminDb } from './lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Module declarations are now in missing-modules.d.ts

// Load environment variables
// Try to load from various possible locations
dotenv.config(); // First try default .env
const envLocalResult = dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Manually set critical Firebase environment variables
// This is a workaround in case dotenv doesn't properly load from .env.local
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'snacksense-802f2';
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@snacksense-802f2.iam.gserviceaccount.com';

// Handle private key specially to preserve newlines
if (!process.env.FIREBASE_PRIVATE_KEY) {
  process.env.FIREBASE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCtHYFO5SbAiOR1
LxhL1HDqrvPj0mWlv0/kHcDSLci0KtVJSscAa9V0pvwH0A1vF3ZJwAJjFrMz+qOR
ah9L0zf7fwraPxHkq0xq0ldZrZomIdcZdaZPj/9eCwdsshczQuNknl1k1q/nuUJS
Il/+kjx2SFStsvIV6vWjsSxWIYID/IpxrbloufU/zp3fv+y3PgY7tKF4DjqaMAN+
Y7MgKgoZnpfGmsyuD4pXndfG2hCn02VCLe1n2kSjhQx6I2PLD1Z+gDX+A8XlcLUc
kUbxjOm0tIK8drfA8t7CEHjBtwUy9yTiI1YRlTucauo2XpV589Ru2TMx6fkGZpgm
j2ni55ibAgMBAAECggEAC5rAj3KCpFcTgsbLPlC5gwSC+oDLlI6cWI0lXvwiX0Vx
x7h4r461n9y5D1MDMNu7RQVXLkpCwqy9/eJFwnZLDej9vWnglVoQRNGLI8qkhy2E
jEMxM1XSnKdo8isxV/Esv2gdmEQLRaF1uyjCaOpnnYGKv5wRE1FinFGk8wnK++D7
y7ATavt/GDjZsAeUhxfphlLiXjze+rAu4uxS2+TTLVxIzmgjYvV0LKnctk1WaX4w
93tKvrj4SMpQCvRzWZGMLlyVQXEAuhR9I//dHslanxrBjZJgDYqjgoXtqI/XoMmX
cOlPyp6yun1JqWrCLXoOvN19tOh9Tq6h1xPKBAYKbQKBgQDiIzK8f8jTDDafvkAh
WfqsTCl1AFPf8fgyVXjj2WWZ6fmCnIrqvRldkJIDQ6qdAT9aS0n9/J9/JdE+rBCy
Dd7ySghbz6rlncRgYXzmbRGq6/6o+qDuPSmGQG7iUDdfxAoGxO0/TjOERO5KX9ce
HZKJVG0Pn7sl45soUeDFVQyypQKBgQDD+dZwrxUfOgQ/ndO2gJ5TslCAcNGGLt2+
PAwk+P4B07P9nHQuaIa7Jj3avO4qIXB/wt4EYGrRCvzWrQhzIk6jvxofxrRalDr8
+S2fEuQIsLgQxDz4cEYGrELRC+QdtaL44zwqo1edYVV52hkfQkKmKIBTfIh0VhZp
n06TUQF6PwKBgFqcZ/QH79xBBJI1lVTHzR3E1se+/dy6BA2HGg2SSpfFnOis+Szd
4JARIbCVKIQIv+3aRSe0VeSIrrNCFt6BmFfVOkwvhfbDpLBJ39Yk1fN65GupIVrU
vxLANq4QHmANGUdlGPtIxnO1exXqGTRD/Tdx0NF123NvI/if9kSbs57RAoGBAIt3
DdttTbvGPuXC/LqhN4tal52ALCuwyI8sDnx1UdadATdXkvq/2jnvUg+LanZDC9tw
Iy28K+gOSLbBtwSwgoRXaFD6yLi5Sm1jKstM10kz8hnEfZtT0xHGn1pDexiFfbBf
jh7N1Xkjnn+z7TLopaO3qPNA6Z7Y8ORDwdhmyoVjAoGBAJFaitgQ15hrI+dCG75O
y1I0K2OGSv0lsj2psIkXDi1vv7TxbPUrK9YpRr+WFmcBUuj8tdqBAPuYoSCLNrvp
A80T3Poe8s7YVHp2K+S6D+zucj/k8Z5ivqtLF+4IVnJXrE8ELtpmHh+1+UA4nXF1
qi+HyR0/cZZbKLau6hwuubqu
-----END PRIVATE KEY-----
`;
}

// Debug environment variables after our loading attempts
console.log('Firebase Config Check after manual settings:');
console.log(`- FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? 'Found' : 'Missing'}`);
console.log(`- FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL ? 'Found' : 'Missing'}`);
console.log(`- FIREBASE_PRIVATE_KEY: ${process.env.FIREBASE_PRIVATE_KEY ? 'Present (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'Missing'}`);


const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Import route handlers
// Use type assertions to bypass TypeScript module resolution errors
// @ts-ignore
import aboutRoutes from './api/about/aboutRoutes';
// @ts-ignore
import ingredientsRoutes from './api/ingredients/ingredientsRoutes';

// Routes
app.use('/api/about', aboutRoutes);
app.use('/api/ingredients', ingredientsRoutes);

// Text extraction endpoint
app.post('/api/extract-text', async (req: any, res: any) => {
  try {
    // Parse the incoming form data
    const form = new IncomingForm({ keepExtensions: true });
    
    // Type annotation for formidable parse result
    interface FormidableResult {
      fields: Fields;
      files: Files;
    }
    
    const formData = await new Promise<FormidableResult>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Handle file format from formidable
    if (!formData.files.image || !formData.files.image[0]) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const imageFile = formData.files.image[0];
    
    // Initialize Tesseract OCR 
    // Note: We're using type assertions to handle possible version mismatches in types
    const worker = await createWorker();
    await (worker as any).loadLanguage('eng');
    await (worker as any).initialize('eng');
    
    // Perform OCR on the image
    const { data } = await (worker as any).recognize(imageFile.filepath);
    await worker.terminate();
    
    return (res as any).status(200).json({ text: data.text });
  } catch (error) {
    console.error('OCR processing error:', error);
    return (res as any).status(500).json({ error: 'Failed to process image' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
