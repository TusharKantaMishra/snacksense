import express, { Request, Response } from 'express';
import { adminDb } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const router = express.Router();

// Sample data to seed the about collection
const seedData = [
  {
    title: 'Our Mission',
    subtitle: 'What Drives Us',
    content: 'At SnackSense, we\'re on a mission to empower consumers with transparent, accessible information about the food they consume.',
    section: 'mission',
    order: 1,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: 'Our Vision',
    subtitle: 'Making Food Transparent',
    content: 'We believe that everyone deserves to make informed choices about what they eat. Our platform bridges the gap between complex ingredient lists and practical health knowledge.',
    section: 'mission',
    order: 2,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: 'Our Story',
    subtitle: 'How We Started',
    content: 'SnackSense was born from a personal frustration shared by our founders while shopping for groceries.',
    section: 'story',
    order: 1,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: 'Our Journey',
    subtitle: 'From Idea to Reality',
    content: 'In 2023, this vision became reality when our team of nutritionists, data scientists, and software engineers came together to develop the SnackSense platform.',
    section: 'story',
    order: 2,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: 'Scan & Upload',
    subtitle: 'Step 1',
    content: 'Take a photo of any food product\'s ingredient list or upload an existing image.',
    section: 'how-it-works',
    order: 1,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: 'AI Analysis',
    subtitle: 'Step 2',
    content: 'Our proprietary AI engine processes the ingredient list, identifying each component and cross-referencing it with our database.',
    section: 'how-it-works',
    order: 2,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },
  {
    title: 'Health Assessment',
    subtitle: 'Step 3',
    content: 'Each ingredient is evaluated based on nutritional value, potential allergens, additives, and overall health impact.',
    section: 'how-it-works',
    order: 3,
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

// POST /api/about/seed
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Starting seed operation');
    
    // Check if there's already content in the 'about' collection
    const aboutCollection = adminDb.collection('about');
    const snapshot = await aboutCollection.get();
    
    if (!snapshot.empty) {
      console.log('About collection already has content. Skipping seed operation.');
      return (res as any).status(200).json({ message: 'Seed skipped. Content already exists.', count: snapshot.size });
    }
    
    console.log('No existing content found. Proceeding with seed operation.');
    
    // Batch write to add all seed data
    const batch = adminDb.batch();
    
    for (const item of seedData) {
      const docRef = aboutCollection.doc();
      batch.set(docRef, item);
    }
    
    await batch.commit();
    console.log('Seed completed successfully.');
    
    return (res as any).status(201).json({ message: 'Seed completed successfully', count: seedData.length });
  } catch (error) {
    console.error('Seed error:', error);
    return (res as any).status(500).json({ error: 'Failed to seed content', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
