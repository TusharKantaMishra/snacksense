"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const firebase_admin_1 = require("@/lib/firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
async function GET() {
    try {
        console.log('Starting to seed about content...');
        // Create sample about content
        const sampleContent = [
            {
                title: 'Our Mission',
                subtitle: 'What Drives Us',
                content: 'At SnackSense, we\'re on a mission to empower consumers with transparent, accessible information about the food they consume.',
                section: 'mission',
                order: 1,
                isActive: true
            },
            {
                title: 'Our Vision',
                subtitle: 'Making Food Transparent',
                content: 'We believe that everyone deserves to make informed choices about what they eat. Our platform bridges the gap between complex ingredient lists and practical health knowledge.',
                section: 'mission',
                order: 2,
                isActive: true
            },
            {
                title: 'Our Story',
                subtitle: 'How We Started',
                content: 'SnackSense was born from a personal frustration shared by our founders while shopping for groceries.',
                section: 'story',
                order: 1,
                isActive: true
            },
            {
                title: 'Our Journey',
                subtitle: 'From Idea to Reality',
                content: 'In 2023, this vision became reality when our team of nutritionists, data scientists, and software engineers came together to develop the SnackSense platform.',
                section: 'story',
                order: 2,
                isActive: true
            },
            {
                title: 'Scan & Upload',
                subtitle: 'Step 1',
                content: 'Take a photo of any food product\'s ingredient list or upload an existing image.',
                section: 'how-it-works',
                order: 1,
                isActive: true
            },
            {
                title: 'AI Analysis',
                subtitle: 'Step 2',
                content: 'Our proprietary AI engine processes the ingredient list, identifying each component and cross-referencing it with our database.',
                section: 'how-it-works',
                order: 2,
                isActive: true
            },
            {
                title: 'Health Assessment',
                subtitle: 'Step 3',
                content: 'Each ingredient is evaluated based on nutritional value, potential allergens, additives, and overall health impact.',
                section: 'how-it-works',
                order: 3,
                isActive: true
            }
        ];
        try {
            // Validate Firebase Admin is properly initialized
            console.log('Checking adminDb:', !!firebase_admin_1.adminDb);
            // Add each content item to Firestore using adminDb
            const aboutCollection = firebase_admin_1.adminDb.collection('about');
            console.log('About collection reference created');
            // Clear existing data first
            console.log('Attempting to get existing documents...');
            const existingDocs = await aboutCollection.get();
            console.log(`Retrieved ${existingDocs.size} existing documents`);
            const deletePromises = [];
            existingDocs.forEach(doc => {
                console.log(`Queuing deletion for document: ${doc.id}`);
                deletePromises.push(doc.ref.delete());
            });
            if (deletePromises.length > 0) {
                console.log(`Deleting ${deletePromises.length} documents...`);
                await Promise.all(deletePromises);
                console.log('Deletion complete');
            }
            else {
                console.log('No documents to delete');
            }
            // Add new content
            console.log('Adding new content...');
            const timestamp = firestore_1.Timestamp.now();
            const results = await Promise.all(sampleContent.map(async (content, index) => {
                console.log(`Adding content item ${index + 1}/${sampleContent.length}: ${content.title}`);
                try {
                    const docRef = await aboutCollection.add({
                        ...content,
                        createdAt: timestamp,
                        updatedAt: timestamp
                    });
                    console.log(`Added document with ID: ${docRef.id}`);
                    return docRef;
                }
                catch (addError) {
                    console.error(`Error adding document ${index}:`, addError);
                    throw addError;
                }
            }));
            console.log(`Successfully added ${results.length} documents`);
            return server_1.NextResponse.json({
                message: 'Sample about content created successfully',
                count: results.length
            }, { status: 201 });
        }
        catch (innerError) {
            console.error('Inner Error:', innerError);
            throw innerError;
        }
    }
    catch (error) {
        console.error('Seed API Error:', error);
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.message;
            console.error('Error stack:', error.stack);
        }
        else {
            console.error('Non-error object thrown:', error);
        }
        return server_1.NextResponse.json({
            error: 'Failed to seed about content',
            details: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map