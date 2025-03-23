import { useState, useEffect } from 'react';
import type { AboutContent } from '@/lib/firestore';

// Define default content to use when API fails
const defaultContent: AboutContent[] = [
  {
    id: 'default-mission-1',
    title: 'Our Mission',
    subtitle: 'What Drives Us',
    content: 'At SnackSense, we\'re on a mission to empower consumers with transparent, accessible information about the food they consume.',
    section: 'mission',
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'default-mission-2',
    title: 'Our Vision',
    subtitle: 'Making Food Transparent',
    content: 'We believe that everyone deserves to make informed choices about what they eat. Our platform bridges the gap between complex ingredient lists and practical health knowledge.',
    section: 'mission',
    order: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'default-story-1',
    title: 'Our Story',
    subtitle: 'How We Started',
    content: 'SnackSense was born from a personal frustration shared by our founders while shopping for groceries.',
    section: 'story',
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'default-story-2',
    title: 'Our Journey',
    subtitle: 'From Idea to Reality',
    content: 'In 2023, this vision became reality when our team of nutritionists, data scientists, and software engineers came together to develop the SnackSense platform.',
    section: 'story',
    order: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'default-how-1',
    title: 'Scan & Upload',
    subtitle: 'Step 1',
    content: 'Take a photo of any food product\'s ingredient list or upload an existing image.',
    section: 'how-it-works',
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'default-how-2',
    title: 'AI Analysis',
    subtitle: 'Step 2',
    content: 'Our proprietary AI engine processes the ingredient list, identifying each component and cross-referencing it with our database.',
    section: 'how-it-works',
    order: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'default-how-3',
    title: 'Health Assessment',
    subtitle: 'Step 3',
    content: 'Each ingredient is evaluated based on nutritional value, potential allergens, additives, and overall health impact.',
    section: 'how-it-works',
    order: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export function useAboutContent() {
  const [content, setContent] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      console.log('Fetching about content...');
      const response = await fetch('/api/about');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response from API:', { status: response.status, statusText: response.statusText, data: errorData });
        throw new Error(`Failed to fetch about content: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('About content fetched successfully:', data);

      // Check if we got empty array back
      if (Array.isArray(data) && data.length === 0) {
        console.log('No content from API, using fallback content');
        setContent(defaultContent);
        setUseFallback(true);
      } else {
        setContent(data);
        setUseFallback(false);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching about content:', errorMessage);
      setError(errorMessage);
      
      // Use fallback content when there's an error
      console.log('Using fallback content due to error');
      setContent(defaultContent);
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const getContentBySection = (section: AboutContent['section']) => {
    if (!content || content.length === 0) {
      return [];
    }
    return content.filter(item => item.section === section);
  };

  return {
    content,
    loading,
    error,
    useFallback,
    getContentBySection,
    refreshContent: fetchContent
  };
}
