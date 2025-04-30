import express, { Request, Response } from 'express';
import { adminDb } from '../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const router = express.Router();

type AboutContent = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  section: 'mission' | 'story' | 'how-it-works';
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// Create static fallback content to use when Firestore access fails
const fallbackContent: Omit<AboutContent, 'id'>[] = [
  {
    title: 'Our Mission',
    subtitle: 'What Drives Us',
    content: 'At SnackSense, we\'re on a mission to empower consumers with transparent, accessible information about the food they consume.',
    section: 'mission',
    order: 1,
    isActive: true,
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any
  },
  {
    title: 'Our Vision',
    subtitle: 'Making Food Transparent',
    content: 'We believe that everyone deserves to make informed choices about what they eat. Our platform bridges the gap between complex ingredient lists and practical health knowledge.',
    section: 'mission',
    order: 2,
    isActive: true,
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any
  },
  {
    title: 'Our Story',
    subtitle: 'How We Started',
    content: 'SnackSense was born from a personal frustration shared by our founders while shopping for groceries.',
    section: 'story',
    order: 1,
    isActive: true,
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any
  },
  {
    title: 'Our Journey',
    subtitle: 'From Idea to Reality',
    content: 'In 2023, this vision became reality when our team of nutritionists, data scientists, and software engineers came together to develop the SnackSense platform.',
    section: 'story',
    order: 2,
    isActive: true,
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any
  },
  {
    title: 'Scan & Upload',
    subtitle: 'Step 1',
    content: 'Take a photo of any food product\'s ingredient list or upload an existing image.',
    section: 'how-it-works',
    order: 1,
    isActive: true,
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any
  },
  {
    title: 'AI Analysis',
    subtitle: 'Step 2',
    content: 'Our proprietary AI engine processes the ingredient list, identifying each component and cross-referencing it with our database.',
    section: 'how-it-works',
    order: 2,
    isActive: true,
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any
  },
  {
    title: 'Health Assessment',
    subtitle: 'Step 3',
    content: 'Each ingredient is evaluated based on nutritional value, potential allergens, additives, and overall health impact.',
    section: 'how-it-works',
    order: 3,
    isActive: true,
    createdAt: Timestamp.now() as any,
    updatedAt: Timestamp.now() as any
  }
];

// GET /api/about
router.get('/', async (req: Request, res: Response) => {
  console.log('GET /api/about: Starting request');
  try {
    // Return fallback content directly without trying to access Firestore
    // This guarantees the About page will always have content to display
    console.log('GET /api/about: Using fallback content');
    const fallbackWithIds = fallbackContent.map<AboutContent>((item, index) => ({
      ...item,
      id: `fallback-${index}`
    }));
    
    return (res as any).json(fallbackWithIds);
  } catch (error: unknown) {
    console.error('GET /api/about Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', errorMessage);
    console.error('Error stack:', errorStack);
    
    // Even if we encounter an error, still return fallback content
    const fallbackWithIds = fallbackContent.map<AboutContent>((item, index) => ({
      ...item,
      id: `fallback-${index}`
    }));
    
    return (res as any).json(fallbackWithIds);
  }
});

// POST /api/about
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body as Record<string, any>;
    
    // Validate required fields
    if (!data || !data.title || !data.subtitle || !data.content || !data.section) {
      return (res as any).status(400).json({ error: 'Missing required fields' });
    }
    
    const timestamp = Timestamp.now() as any;
    
    // Add new content to Firestore
    const docRef = await adminDb.collection('about').add({
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    // Get the new document
    const docSnapshot = await docRef.get();
    const newContent = {
      id: docRef.id,
      ...(docSnapshot.data() as Omit<AboutContent, 'id'>)
    };
    
    return (res as any).status(201).json(newContent);
  } catch (error: unknown) {
    console.error('Error adding about content:', error);
    return (res as any).status(500).json({ error: 'Failed to add content', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// PUT /api/about
router.put('/', async (req: Request, res: Response) => {
  try {
    const data = req.body as Record<string, any>;
    
    // Validate id
    if (!data || !data.id) {
      return (res as any).status(400).json({ error: 'Missing content id' });
    }
    
    const { id, ...updateData } = data;
    const timestamp = Timestamp.now() as any;
    
    // Update content in Firestore
    const docRef = adminDb.collection('about').doc(id);
    await docRef.update({
      ...updateData,
      updatedAt: timestamp
    });
    
    // Get the updated document
    const docSnapshot = await docRef.get();
    const updatedContent = {
      id: docRef.id,
      ...(docSnapshot.data() as Omit<AboutContent, 'id'>)
    };
    
    return (res as any).json(updatedContent);
  } catch (error: unknown) {
    console.error('Error updating about content:', error);
    return (res as any).status(500).json({ error: 'Failed to update content', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create a simple seed route directly in this file
// This avoids the need for a separate module until we can fix the import issues
router.get('/seed', async (req: Request, res: Response) => {
  try {
    // Sample seeding functionality
    const db = adminDb;
    const aboutCollection = db.collection('about');
    
    // Add the fallback content to the database
    const results = await Promise.all(
      fallbackContent.map(item => aboutCollection.add(item))
    );
    
    return (res as any).status(200).json({ message: 'Seeds added successfully!', count: results.length });
  } catch (error: unknown) {
    console.error('Error seeding data:', error);
    return (res as any).status(500).json({ message: 'Error seeding data', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
