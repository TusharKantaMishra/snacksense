"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const firestore_1 = require("@/lib/firestore");
async function GET() {
    try {
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
                title: 'Our Story',
                subtitle: 'How We Started',
                content: 'SnackSense was born from a personal frustration shared by our founders while shopping for groceries.',
                section: 'story',
                order: 1,
                isActive: true
            },
            {
                title: 'Technology',
                subtitle: 'AI-Powered Analysis',
                content: 'Our technology uses advanced AI to analyze food ingredients and provide clear, actionable insights.',
                section: 'how-it-works',
                order: 1,
                isActive: true
            }
        ];
        // Add each content item to Firestore
        const results = await Promise.all(sampleContent.map(content => (0, firestore_1.addAboutContent)(content)));
        return server_1.NextResponse.json({
            message: 'Sample about content created successfully',
            data: results
        }, { status: 201 });
    }
    catch (error) {
        console.error('Seed API Error:', error);
        return server_1.NextResponse.json({ error: 'Failed to seed about content' }, { status: 500 });
    }
}
//# sourceMappingURL=seed.js.map