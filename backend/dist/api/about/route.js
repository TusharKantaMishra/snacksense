"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
const server_1 = require("next/server");
const firebase_admin_1 = require("@/lib/firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
// Create static fallback content to use when Firestore access fails
const fallbackContent = [
    {
        title: 'Our Mission',
        subtitle: 'What Drives Us',
        content: 'At SnackSense, we\'re on a mission to empower consumers with transparent, accessible information about the food they consume.',
        section: 'mission',
        order: 1,
        isActive: true,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now()
    },
    {
        title: 'Our Vision',
        subtitle: 'Making Food Transparent',
        content: 'We believe that everyone deserves to make informed choices about what they eat. Our platform bridges the gap between complex ingredient lists and practical health knowledge.',
        section: 'mission',
        order: 2,
        isActive: true,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now()
    },
    {
        title: 'Our Story',
        subtitle: 'How We Started',
        content: 'SnackSense was born from a personal frustration shared by our founders while shopping for groceries.',
        section: 'story',
        order: 1,
        isActive: true,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now()
    },
    {
        title: 'Our Journey',
        subtitle: 'From Idea to Reality',
        content: 'In 2023, this vision became reality when our team of nutritionists, data scientists, and software engineers came together to develop the SnackSense platform.',
        section: 'story',
        order: 2,
        isActive: true,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now()
    },
    {
        title: 'Scan & Upload',
        subtitle: 'Step 1',
        content: 'Take a photo of any food product\'s ingredient list or upload an existing image.',
        section: 'how-it-works',
        order: 1,
        isActive: true,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now()
    },
    {
        title: 'AI Analysis',
        subtitle: 'Step 2',
        content: 'Our proprietary AI engine processes the ingredient list, identifying each component and cross-referencing it with our database.',
        section: 'how-it-works',
        order: 2,
        isActive: true,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now()
    },
    {
        title: 'Health Assessment',
        subtitle: 'Step 3',
        content: 'Each ingredient is evaluated based on nutritional value, potential allergens, additives, and overall health impact.',
        section: 'how-it-works',
        order: 3,
        isActive: true,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now()
    }
];
async function GET() {
    console.log('GET /api/about: Starting request');
    try {
        // Return fallback content directly without trying to access Firestore
        // This guarantees the About page will always have content to display
        console.log('GET /api/about: Using fallback content');
        const fallbackWithIds = fallbackContent.map((item, index) => ({
            ...item,
            id: `fallback-${index}`
        }));
        return server_1.NextResponse.json(fallbackWithIds);
    }
    catch (error) {
        console.error('GET /api/about Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Error details:', errorMessage);
        console.error('Error stack:', errorStack);
        // Even if we encounter an error, still return fallback content
        const fallbackWithIds = fallbackContent.map((item, index) => ({
            ...item,
            id: `fallback-${index}`
        }));
        return server_1.NextResponse.json(fallbackWithIds);
    }
}
async function POST(request) {
    try {
        const data = await request.json();
        // Validate required fields
        if (!data.title || !data.subtitle || !data.content || !data.section) {
            return server_1.NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const timestamp = firestore_1.Timestamp.now();
        // Add new content to Firestore
        const docRef = await firebase_admin_1.adminDb.collection('about').add({
            ...data,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        // Get the new document
        const docSnapshot = await docRef.get();
        const newContent = {
            id: docRef.id,
            ...docSnapshot.data()
        };
        return server_1.NextResponse.json(newContent, { status: 201 });
    }
    catch (error) {
        console.error('Error adding about content:', error);
        return server_1.NextResponse.json({ error: 'Failed to add content', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
async function PUT(request) {
    try {
        const data = await request.json();
        // Validate id
        if (!data.id) {
            return server_1.NextResponse.json({ error: 'Missing content id' }, { status: 400 });
        }
        const { id, ...updateData } = data;
        const timestamp = firestore_1.Timestamp.now();
        // Update content in Firestore
        const docRef = firebase_admin_1.adminDb.collection('about').doc(id);
        await docRef.update({
            ...updateData,
            updatedAt: timestamp
        });
        // Get the updated document
        const docSnapshot = await docRef.get();
        const updatedContent = {
            id: docRef.id,
            ...docSnapshot.data()
        };
        return server_1.NextResponse.json(updatedContent);
    }
    catch (error) {
        console.error('Error updating about content:', error);
        return server_1.NextResponse.json({ error: 'Failed to update content', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map