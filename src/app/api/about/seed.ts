import { NextResponse } from 'next/server';
import { addAboutContent, AboutContent } from '@/lib/firestore';

export async function GET() {
  try {
    // Create sample about content
    const sampleContent: Omit<AboutContent, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'Our Mission',
        subtitle: 'What Drives Us',
        content: 'At SnackSense, we\'re on a mission to empower consumers with transparent, accessible information about the food they consume.',
        section: 'mission' as const,
        order: 1,
        isActive: true
      },
      {
        title: 'Our Story',
        subtitle: 'How We Started',
        content: 'SnackSense was born from a personal frustration shared by our founders while shopping for groceries.',
        section: 'story' as const,
        order: 1,
        isActive: true
      },
      {
        title: 'Technology',
        subtitle: 'AI-Powered Analysis',
        content: 'Our technology uses advanced AI to analyze food ingredients and provide clear, actionable insights.',
        section: 'how-it-works' as const,
        order: 1,
        isActive: true
      }
    ];

    // Add each content item to Firestore
    const results = await Promise.all(
      sampleContent.map(content => addAboutContent(content))
    );

    return NextResponse.json({ 
      message: 'Sample about content created successfully',
      data: results 
    }, { status: 201 });
  } catch (error) {
    console.error('Seed API Error:', error);
    return NextResponse.json(
      { error: 'Failed to seed about content' },
      { status: 500 }
    );
  }
}
