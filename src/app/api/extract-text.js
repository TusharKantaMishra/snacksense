import { IncomingForm } from 'formidable';
import { createWorker } from 'tesseract.js';
//import fs from 'fs';
//import util from 'util';

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const form = new IncomingForm();
    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const imageFile = formData.files.image;
    
    // Initialize Tesseract OCR
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Perform OCR on the image
    const { data } = await worker.recognize(imageFile.filepath);
    await worker.terminate();
    
    return res.status(200).json({ text: data.text });
  } catch (error) {
    console.error('OCR processing error:', error);
    return res.status(500).json({ error: 'Failed to process image' });
  }
}

// File: pages/api/extract-ingredients.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    // Find the ingredients section in the text
    let ingredientsText = '';
    
    // Common patterns to identify ingredients sections
    const patterns = [
      /ingredients:(.+?)(?:\.|nutrition facts|nutritional information|storage|directions|allergen|warnings)/is,
      /ingredients list:(.+?)(?:\.|nutrition facts|nutritional information|storage|directions|allergen|warnings)/is,
      /contains:(.+?)(?:\.|nutrition facts|nutritional information|storage|directions|allergen|warnings)/is,
    ];
    
    // Try to extract ingredients section using patterns
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        ingredientsText = match[1].trim();
        break;
      }
    }
    
    // If no pattern matched, use the whole text
    if (!ingredientsText) {
      ingredientsText = text;
    }
    
    // Parse ingredients and quantities
    const ingredients = parseIngredients(ingredientsText);
    
    return res.status(200).json({ ingredients });
  } catch (error) {
    console.error('Ingredients extraction error:', error);
    return res.status(500).json({ error: 'Failed to extract ingredients' });
  }
}

// Helper function to parse ingredients and their quantities
function parseIngredients(text) {
  // Split by common delimiters
  const parts = text.split(/,|\(|\)|\n/).filter(part => part.trim().length > 0);
  
  const ingredients = [];
  
  for (let part of parts) {
    part = part.trim();
    if (!part || part.toLowerCase().includes('may contain')) continue;
    
    // Try to extract quantity
    const quantityMatch = part.match(/(\d+\.?\d*\s*(?:g|mg|ml|kg|%|percent))/i);
    let name = part;
    let quantity = '';
    
    if (quantityMatch) {
      quantity = quantityMatch[0].trim();
      name = part.replace(quantity, '').trim();
    }
    
    // Remove common words that aren't ingredients
    name = name.replace(/^and\s+|^contains\s+|^including\s+/i, '').trim();
    
    if (name) {
      ingredients.push({ name, quantity });
    }
  }
  
  return ingredients;
}

// File: pages/api/analyze-ingredients.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Invalid ingredients data' });
    }
    
    // Format ingredients for Gemini prompt
    const ingredientsText = ingredients
      .map(ing => `${ing.name}${ing.quantity ? ` (${ing.quantity})` : ''}`)
      .join(', ');
    
    // Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Create prompt for Gemini
    const prompt = `
    Analyze the following food product ingredients and provide insights:
    
    Ingredients: ${ingredientsText}
    
    Please provide:
    1. Any potentially problematic ingredients for people with common allergies
    2. Assessment of overall nutritional value
    3. Identification of any artificial additives, preservatives, or controversial ingredients
    4. General health implications of these ingredients
    5. Whether this product appears to be vegetarian, vegan, gluten-free, etc.
    
    Format the response in clear sections with bullet points where appropriate.
    `;
    
    // Generate response from Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const analysis = response.text();
    
    return res.status(200).json({
      ingredients: ingredients,
      analysis: analysis
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: 'Failed to analyze ingredients' });
  }
}