"use client";
import React, { useState, ChangeEvent } from 'react';
import { createWorker } from 'tesseract.js';
import axios from 'axios';
import Image from 'next/image';
import '../../styles/upload.css';

interface IngredientAnalysis {
  ingredient: string;
  healthRating: 'Good' | 'Neutral' | 'Bad';
  explanation: string;
  details?: string[];
  nutritionalInfo?: {
    calories?: string;
    protein?: string;
    carbs?: string;
    fats?: string;
    vitamins?: string[];
    minerals?: string[];
  };
  alternatives?: string[];
  healthScore?: number;
  dailyValuePercentage?: number;
  benefits?: string[];
  riskFactors?: string[];
  processingLevel?: string;
  allergenRisk?: string;
  scientificEvidence?: {
    level: string;
  };
  sustainabilityScore?: number;
}

// Type definition for window with environment variables
type WindowWithEnv = Window & {
  __ENV__?: {
    GEMINI_API_KEY?: string;
  };
};

// Improved environment variable handling with better error checking
const getGeminiApiKey = (): string | null => {
  // First try the Next.js public environment variable
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  
  // Then try the injected runtime variable if in browser context
  if (typeof window !== 'undefined') {
    const windowWithEnv = window as WindowWithEnv;
    if (windowWithEnv.__ENV__?.GEMINI_API_KEY) {
      return windowWithEnv.__ENV__.GEMINI_API_KEY;
    }
  }
  
  // Return null to indicate missing key
  return null;
};

const Upload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<IngredientAnalysis[] | null>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // Clean focused function for file validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.type.match('image.*')) {
      return { valid: false, error: 'Please select an image file' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    return { valid: true };
  };

  // Handle file selection with improved error handling
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        setError('No file selected');
        return;
      }

      const { valid, error: validationError } = validateFile(file);
      if (!valid) {
        setError(validationError || 'Invalid file');
        return;
      }
      
      setImage(file);
      setError('');
      setResults(null);
      setPreview(null);
      
      createImagePreview(file);
    } catch (err) {
      console.error('Error handling image upload:', err);
      setError('An unexpected error occurred during file selection');
    }
  };

  // Clean function for creating image preview
  const createImagePreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        setPreview(reader.result as string);
      } catch (err) {
        console.error('Error creating preview:', err);
        setError('Failed to display image preview');
      }
    };
    reader.onerror = () => {
      setError('Failed to read the image file');
    };
    reader.readAsDataURL(file);
  };

  // Process the image with OCR and analysis
  const processImage = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }
    
    // Get API key but continue even if not available (server will use mock data)
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('Gemini API key not found. Using mock data for analysis.');
    } else {
      console.log('Using Gemini API key with length:', apiKey.length);
    }
    
    setLoading(true);
    setError('');
    setResults(null);
    setProgress(0);
    
    // Update progress periodically during OCR
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 500);
    
    let worker;
    
    try {
      console.log('Starting OCR process...');
      
      // Create a worker and recognize the image
      worker = await createWorker();
      const result = await worker.recognize(image);
      
      clearInterval(progressInterval);
      setProgress(95);
      
      if (!result.data.text || result.data.text.trim() === '') {
        throw new Error('No text detected in the image');
      }
      
      const extractedText = result.data.text;
      console.log('Text extracted from image, processing...');
      
      try {
        // Extract ingredients from OCR text
        console.log('Sending OCR text for ingredient extraction:', extractedText.substring(0, 100) + '...');
        const ingredientsResponse = await axios.post('/api/ingredients/extract', 
          { text: extractedText },
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10 second timeout
          }
        );
        
        if (!ingredientsResponse.data?.ingredients?.length) {
          throw new Error('No ingredients could be identified in the text');
        }
        
        // Get the structured ingredient data from our enhanced API
        const extractedData = ingredientsResponse.data;
        const ingredients = extractedData.ingredients;
        
        // Store additional product information for display
        const productInfo = {
          name: extractedData.productName || 'Unknown Product',
          servingSize: extractedData.servingSize || 'Not specified',
          format: extractedData.format || 'Standard',
          additionalInfo: extractedData.additionalInfo || {}
        };
        
        // Log the extracted structured data
        console.log('Extracted structured data:', {
          productName: productInfo.name,
          format: productInfo.format,
          ingredientCount: ingredients.length
        });
        
        setProgress(98);
        
        // Prepare ingredient text for Gemini analysis
        // Include scientific names and quantities when available for better analysis
        const ingredientText = ingredients.map((ing: { 
          name: string; 
          scientificName?: string; 
          quantity?: string; 
          type?: string;
        }) => {
          let text = ing.name;
          if (ing.scientificName) text += ` (${ing.scientificName})`;
          if (ing.quantity) text += ` - ${ing.quantity}`;
          if (ing.type) text += ` [${ing.type}]`;
          return text;
        }).join(', ');
        
        // Analyze ingredients with Gemini
        console.log('Sending ingredients for analysis:', ingredientText.substring(0, 100) + '...');
        const analysisResponse = await axios.post('/api/ingredients/analyze', 
          { 
            text: ingredientText,
            productInfo: productInfo // Send product info for context
          },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'X-API-Key': apiKey || '' // Ensure we always send a string, even if empty
            },
            timeout: 30000 // 30 second timeout for Gemini API
          }
        );
        
        if (!analysisResponse.data || !Array.isArray(analysisResponse.data) || analysisResponse.data.length === 0) {
          console.error('Analysis response data:', analysisResponse.data);
          throw new Error('Failed to analyze ingredients or no results returned');
        }
        
        // Log the analysis results for debugging
        console.log('Gemini analysis results:', analysisResponse.data);
        
        // Set the results state to display on the page
        setResults(analysisResponse.data);
        setProgress(100);
      } catch (err) {
        // Handle API request errors
        console.error('API request error:', err);
        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNABORTED') {
            setError('Request timed out. Please try again.');
          } else if (err.response) {
            setError(`Server error (${err.response.status}): ${err.response.data?.error || 'Unknown error'}`);
          } else if (err.request) {
            setError('Network error. Please check your connection and try again.');
          } else {
            setError(`Error: ${err.message}`);
          }
        } else {
          throw err; // Re-throw non-Axios errors to be caught by the outer catch block
        }
      }
    } catch (err) {
      console.error('Process image error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResults(null);
    } finally {
      clearInterval(progressInterval);
      if (worker) {
        await worker.terminate();
      }
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-4xl mx-auto p-4">
      {/* Futuristic background elements */}
      <div className="circuit-container">
        <div className="circuit-line"></div>
        <div className="circuit-line"></div>
        <div className="circuit-line"></div>
        <div className="circuit-line"></div>
        <div className="circuit-vertical"></div>
        <div className="circuit-vertical"></div>
        <div className="circuit-vertical"></div>
        <div className="circuit-vertical"></div>
        <div className="circuit-node"></div>
        <div className="circuit-node"></div>
        <div className="circuit-node"></div>
        <div className="circuit-node"></div>
      </div>
      
      {/* Floating data particles */}
      <div className="data-particle"></div>
      <div className="data-particle"></div>
      <div className="data-particle"></div>
      <div className="data-particle"></div>
      <div className="data-particle"></div>
      <div className="data-particle"></div>
      <div className="data-particle"></div>
      <div className="data-particle"></div>
      <div className="data-particle"></div>
      
      <h1 className="futuristic-heading text-4xl font-bold mb-4 text-white">Upload Food Packaging Image</h1>
      
      <div className="mb-6 p-6 border rounded-lg shadow-sm bg-black bg-opacity-70 border-cyan-400/30 glow-border">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera capture option */}
          <div 
            className={`upload-option h-48 border rounded-lg p-4 cursor-pointer hover:border-cyan-400 transition-all duration-300 bg-gradient-to-br from-[#0f172a] to-[#1e293b]`}
            onClick={() => {
              const input = document.getElementById('cameraCapture') as HTMLInputElement;
              if (input) input.click();
            }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4H19v8a2 2 0 01-2 2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="font-medium text-lg mb-2">Take a Photo</h3>
              <p className="text-sm">Use your device&apos;s camera to capture the ingredients label</p>
              <input
                id="cameraCapture"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                aria-label="Capture food packaging image with camera"
                disabled={loading}
              />
            </div>
          </div>
          
          {/* File upload option */}
          <div 
            className={`upload-option h-48 border rounded-lg p-4 cursor-pointer hover:border-cyan-400 transition-all duration-300 bg-gradient-to-br from-[#0f172a] to-[#1e293b]`}
            onClick={() => {
              const input = document.getElementById('fileUpload') as HTMLInputElement;
              if (input) input.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('drag-active');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-active');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('drag-active');
              
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const event = {
                  target: {
                    files: e.dataTransfer.files
                  }
                } as unknown as ChangeEvent<HTMLInputElement>;
                
                handleImageChange(event);
              }
            }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="font-medium text-lg mb-2">Upload from Device</h3>
              <p className="text-sm">Browse your files or drag &amp; drop an image here</p>
              <input
                id="fileUpload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                aria-label="Upload food packaging image from device"
                disabled={loading}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm text-cyan-400/70">
          <p>Supported formats: JPG, PNG, GIF. Maximum size: 10MB</p>
        </div>
      </div>
      
      {preview && (
        <div className="mb-6 p-6 border rounded-lg shadow-sm bg-black bg-opacity-70 border-cyan-400/30 glow-border">
          <h2 className="text-xl font-semibold mb-6 text-white">Image Preview</h2>
          <div className="preview-container relative rounded-lg overflow-hidden border border-gray-700 shadow-lg">
            <Image
              src={preview}
              alt="Food packaging preview"
              fill
              className="object-contain"
              unoptimized
              priority
              onError={() => setError('Failed to display image preview')}
            />
          </div>
          
          {loading && (
            <div className="mt-6">
              <div className="progress-container">
                <div 
                  className={`progress-bar progress-width-${Math.round(progress / 5) * 5}`}></div>
              </div>
              <p className="text-center text-sm text-cyan-400/70">Processing... {progress}%</p>
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={processImage}
              disabled={loading}
              className="analyze-button px-8 py-3 text-white rounded-full font-medium disabled:cursor-not-allowed flex items-center"
              aria-label="Analyze ingredients"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Analyze Ingredients
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="mb-6">
          <div className="progress-container">
            <div 
              className={`progress-bar progress-${Math.round(progress)}`}
              role="progressbar"
              aria-label={`Progress: ${progress}%`}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            Processing your image. This might take a moment...
            {progress < 10 && " (Starting up...)"}
            {progress >= 10 && progress < 50 && " (Analyzing image...)"}
            {progress >= 50 && progress < 90 && " (Extracting text...)"}
            {progress >= 90 && progress < 100 && " (Almost done...)"}
          </p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded border border-red-200">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p><strong>Error:</strong> {error}</p>
          </div>
          <button 
            onClick={() => setError('')} 
            className="mt-2 text-sm text-red-800 underline"
            aria-label="Dismiss error message"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {results && results.length > 0 && (
        <div className="mb-6 p-6 border rounded-lg shadow-sm bg-black bg-opacity-70 border-cyan-400/30 glow-border">
          <h2 className="text-xl font-semibold mb-6 text-white">Ingredient Analysis Results</h2>
          
          <div className="space-y-6">
            {results.map((result, index) => {
              // Extract any potential details from the explanation
              const detailsMatch = result.explanation?.match(/Details:(.+?)(?=\.|$)/s);
              const details = detailsMatch ? 
                detailsMatch[1].split(/[•·\-*]/).filter(d => d.trim().length > 0).map(d => d.trim()) : 
                [];
              
              // Look for alternatives in the explanation
              const alternativesMatch = result.explanation?.match(/Alternatives?:(.+?)(?=\.|$)/s);
              const alternatives = alternativesMatch ? alternativesMatch[1].trim() : '';
              
              return (
                <div 
                  key={index} 
                  className="analysis-result-card p-4 rounded-lg border border-cyan-400/30 bg-gradient-to-r from-[#0f3460]/50 to-[#533483]/50 backdrop-blur transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                    <h3 className="ingredient-name">{result.ingredient}</h3>
                    <div 
                      className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-sm font-medium health-rating-badge ${
                        result.healthRating === 'Good' ? 'health-rating-good' : 
                        result.healthRating === 'Neutral' ? 'health-rating-neutral' : 
                        'health-rating-bad'
                      }`}
                    >
                      {result.healthRating}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="section-title">Health Impact</p>
                    <p className="section-content">{result.explanation}</p>
                  </div>
                  
                  {details.length > 0 && (
                    <div className="mb-4">
                      <p className="section-title">Details</p>
                      <ul className="details-list">
                        {details.map((detail, i) => (
                          <li key={i} className="ml-5 list-disc">{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {alternatives && (
                    <div className="mb-4">
                      <p className="section-title">Healthier Alternatives</p>
                      <p className="section-content">{alternatives}</p>
                    </div>
                  )}
                  
                  {result.healthScore !== undefined && (
                    <div className="health-score">
                      <div className="score-bar">
                        <div 
                          className={`score-indicator width-${Math.round(result.healthScore)}`}
                        />
                      </div>
                      <span>{result.healthScore}/100</span>
                    </div>
                  )}
                  
                  {result.nutritionalInfo && Object.keys(result.nutritionalInfo).length > 0 && (
                    <div className="info-section">
                      <h4>Nutritional Information</h4>
                      <ul className="nutrition-list">
                        {result.nutritionalInfo.calories && (
                          <li><strong>Calories:</strong> {result.nutritionalInfo.calories}</li>
                        )}
                        {result.nutritionalInfo.protein && (
                          <li><strong>Protein:</strong> {result.nutritionalInfo.protein}</li>
                        )}
                        {result.nutritionalInfo.carbs && (
                          <li><strong>Carbs:</strong> {result.nutritionalInfo.carbs}</li>
                        )}
                        {result.nutritionalInfo.fats && (
                          <li><strong>Fats:</strong> {result.nutritionalInfo.fats}</li>
                        )}
                        {result.nutritionalInfo.vitamins && result.nutritionalInfo.vitamins.length > 0 && (
                          <li><strong>Vitamins:</strong> {result.nutritionalInfo.vitamins.join(', ')}</li>
                        )}
                        {result.nutritionalInfo.minerals && result.nutritionalInfo.minerals.length > 0 && (
                          <li><strong>Minerals:</strong> {result.nutritionalInfo.minerals.join(', ')}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {((result.benefits?.length ?? 0) > 0 || (result.riskFactors?.length ?? 0) > 0) && (
                    <div className="benefits-risks-container">
                      {result.benefits && result.benefits.length > 0 && (
                        <div className="benefits-section">
                          <h5>Benefits</h5>
                          <ul className="benefits-list">
                            {result.benefits.map((benefit, i) => (
                              <li key={i}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.riskFactors && result.riskFactors.length > 0 && (
                        <div className="risks-section">
                          <h5>Risk Factors</h5>
                          <ul className="risks-list">
                            {result.riskFactors.map((risk, i) => (
                              <li key={i}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {result.processingLevel && (
                    <div className="mt-4">
                      <p className="section-title">Processing Level</p>
                      <p className="section-content">{result.processingLevel}</p>
                    </div>
                  )}
                  
                  {result.allergenRisk && (
                    <div className="mt-4">
                      <p className="section-title">Allergen Risk</p>
                      <p className="section-content">{result.allergenRisk}</p>
                    </div>
                  )}
                  
                  {result.scientificEvidence && (
                    <div className="mt-4">
                      <p className="section-title">Scientific Evidence</p>
                      <p className="section-content">{result.scientificEvidence.level}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                // Clear previous results and reset state
                setResults([]);
                setPreview('');
                setImage(null);
                setProgress(0);
                setLoading(false);
                setError('');
                
                // Scroll back to the top of the upload section
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="analyze-another-button px-8 py-3 text-white rounded-full font-medium flex items-center"
              aria-label="Analyze another food product"
            >
              <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Analyze Another Food
            </button>
          </div>
        </div>
      )}
      
      {!loading && !error && results && results.length === 0 && (
        <div className="mb-6 p-4 border rounded bg-yellow-50">
          <p className="text-yellow-800">
            No ingredients could be analyzed. Please try a clearer image of the ingredients list.
          </p>
        </div>
      )}
    </div>
  );
};

export default Upload;