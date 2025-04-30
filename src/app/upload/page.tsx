"use client";
import React, { useState, useRef, ChangeEvent, useCallback } from 'react';
import { createWorker, createScheduler, PSM, OEM } from 'tesseract.js';
import type { Worker, Scheduler } from 'tesseract.js';
import axios from 'axios';
import Image from 'next/image';
import { analyzeIngredientsLocally, extractIngredientsFromText } from '../../utils/localIngredientAnalysis';
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

// Improved environment variable handling with better error checking and debugging
const getGeminiApiKey = (): string | null => {
  console.log('Checking for Gemini API key sources...');
  
  // First try the Next.js public environment variable
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (envKey) {
    console.log('Found key in NEXT_PUBLIC_GEMINI_API_KEY, length:', envKey.length);
    return envKey;
  } else {
    console.log('NEXT_PUBLIC_GEMINI_API_KEY not found or empty');
  }
  
  // Then try the non-public version (shouldn't work in browser but worth checking)
  const privateKey = process.env.GEMINI_API_KEY;
  if (privateKey) {
    console.log('Found key in GEMINI_API_KEY, length:', privateKey.length);
    return privateKey;
  }
  
  // Then try the injected runtime variable if in browser context
  if (typeof window !== 'undefined') {
    const windowWithEnv = window as WindowWithEnv;
    if (windowWithEnv.__ENV__?.GEMINI_API_KEY) {
      console.log('Found key in window.__ENV__.GEMINI_API_KEY');
      return windowWithEnv.__ENV__.GEMINI_API_KEY;
    } else {
      console.log('No key in window.__ENV__');
    }
  }
  
  // TEMPORARY FALLBACK: Use a hardcoded key for development only
  // This is only for development and will be removed in production
  console.log('No API key found in any source, using fallback key');
  return 'AIzaSyCv3Ribc8-9bI0ZU_tBq5gL7KZqRB4z08M';
};

export default function Upload() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<IngredientAnalysis[] | null>(null);
  const [error, setError] = useState<React.ReactNode>('');
  const [progress, setProgress] = useState<number>(0);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  
  // Refs for camera functionality
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
  
  // Start camera stream
  const startCamera = async () => {
    try {
      // Clear any previous errors
      setCameraError('');
      setError('');
      
      // Reset any previous image/preview
      setImage(null);
      setPreview(null);
      setResults(null);
      
      // Show camera UI
      setShowCamera(true);
      
      // Get user media with camera stream
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera when available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Could not access camera. Please ensure you have granted camera permissions.');
      setShowCamera(false);
    }
  };
  
  // Stop camera stream
  const stopCamera = () => {
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Hide camera UI
    setShowCamera(false);
  };
  
  // Capture image from camera
  const captureImage = () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        setCameraError('Camera not initialized properly');
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCameraError('Could not get canvas context');
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to Blob, then to File
      canvas.toBlob((blob) => {
        if (!blob) {
          setCameraError('Failed to capture image');
          return;
        }
        
        // Create File object from Blob
        const capturedFile = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        
        // Set image and create preview
        setImage(capturedFile);
        createImagePreview(capturedFile);
        
        // Stop camera after successful capture
        stopCamera();
        
      }, 'image/jpeg', 0.95);
      
    } catch (err) {
      console.error('Error capturing image:', err);
      setCameraError('Failed to capture image');
    }
  };

  // Process the image with OCR and analysis
  // Helper functions for text extraction and processing
  // Specialized food label ingredient list extraction
  const findIngredientsSection = (text: string): string => {
    // Common patterns for ingredient sections in food labels
    const ingredientPatterns = [
      /ingredients:([\s\S]*?)(?:\.|nutrition facts|contains|may contain|allergen|manufactured|produced|distributed|best before)/i,
      /contains:([\s\S]*?)(?:\.|nutrition facts|ingredients|may contain|allergen|manufactured|produced|distributed|best before)/i,
      /made with:([\s\S]*?)(?:\.|nutrition facts|contains|may contain|allergen|manufactured|produced|distributed|best before)/i,
      /ingredients?\s*:?\s*([\s\S]*?)(?:\.|$)/i
    ];
    
    for (const pattern of ingredientPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 10) { // Ensure we have substantial content
        return match[1].trim();
      }
    }
    
    // If no clearly marked ingredients section, return the full text
    return text;
  };
  
  // Advanced helper for extracting even blurry or hard-to-read ingredients
  const extractIngredientsFromBlurryText = (text: string): string => {
    // First try standard patterns
    const standardExtraction = findIngredientsSection(text);
    if (standardExtraction !== text) {
      // We found a clear ingredients section
      return standardExtraction;
    }
    
    // For blurry text, look for common patterns in food labels
    // Look for lines with ingredient-like formatting (comma separated lists)
    const lines = text.split('\n');
    
    // Find the line with the most commas (likely an ingredient list)
    const ingredientLineIndex = lines.reduce((maxIndex, line, index, arr) => {
      // Count commas as a heuristic for ingredient lists
      const commaCount = (line.match(/,/g) || []).length;
      
      // Look for ingredient indicators
      const hasIngredientMarker = /ingred|contains|made with/i.test(line);
      
      // The next line after "Ingredients:" is often the actual list
      const isPrevLineIngredients = index > 0 && /^\s*ingredients\s*:?\s*$/i.test(arr[index-1]);
      
      // Score this line based on likelihood of being an ingredient list
      const currentScore = commaCount * 2 + (hasIngredientMarker ? 5 : 0) + (isPrevLineIngredients ? 10 : 0);
      const maxScore = (arr[maxIndex]?.match(/,/g) || []).length * 2 + 
                     (/ingred|contains|made with/i.test(arr[maxIndex] || '') ? 5 : 0);
      
      return currentScore > maxScore ? index : maxIndex;
    }, 0);
    
    // Extract the most likely ingredient line and surrounding context
    if (ingredientLineIndex >= 0 && lines[ingredientLineIndex]) {
      // Take the line and a few lines after it (ingredients often continue)
      const relevantLines = lines.slice(ingredientLineIndex, ingredientLineIndex + 3).join(' ');
      return relevantLines;
    }
    
    return text; // Fallback to original if no patterns found
  };
  
  const processImage = async () => {
    if (!image) {
      setError(
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">No Image Selected</h3>
          <p className="text-blue-700">Please select or capture an image first.</p>
        </div>
      );
      return;
    }
    
    // Get API key - it's now required for analysis to work
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('Gemini API key not found. Real-time analysis requires a valid API key.');
      setError(
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="font-bold text-red-800 mb-2">API Key Missing</h3>
          <p className="text-red-700">Gemini API key is not configured. Please set up your API key to use real-time analysis.</p>
        </div>
      );
      setLoading(false);
      return;
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
    
    // Define workers and scheduler with proper types
    let primaryWorker: Worker | undefined;
    let ocrScheduler: Scheduler | undefined;
    const workerList: Worker[] = [];
    
    try {
      console.log('Starting OCR process with parallel processing...');
      
      // Create a scheduler for parallel processing with multiple workers
      ocrScheduler = createScheduler();
      
      // Create workers for parallel processing
      // First worker optimized for ingredient lists (fine details, smaller text)
      const ingredientWorker = await createWorker();
      
      // There appears to be a mismatch between the TypeScript definitions and the actual
      // Tesseract.js API. Use type assertions to resolve this.
      await (ingredientWorker as any).loadLanguage('eng');
      await (ingredientWorker as any).initialize('eng');
      await (ingredientWorker as any).setParameters({
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.():;%-_',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // 6 - Assume a single uniform block of text
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY, // 3 - Neural nets LSTM engine only
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
      });
      
      // Second worker optimized for product names and headers (larger text)
      const headerWorker = await createWorker();
      
      // Same type assertions for the header worker
      await (headerWorker as any).loadLanguage('eng');
      await (headerWorker as any).initialize('eng');
      await (headerWorker as any).setParameters({
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.():;%-_', 
        tessedit_pageseg_mode: PSM.SINGLE_LINE, // 7 - Treat the image as a single text line
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY,
        scale_factor: 1.5, // Scale up to better detect larger text like product names
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
      });
      
      // Add workers to scheduler
      ocrScheduler.addWorker(ingredientWorker);
      ocrScheduler.addWorker(headerWorker);
      
      // Save references for cleanup
      workerList.push(ingredientWorker, headerWorker);  
      primaryWorker = ingredientWorker; // Keep reference to primary worker for fallback
      
      console.log('Processing image for OCR extraction...');
      setProgress(40);
      
      // Advanced preprocessing for all images, with special handling for blurry text
      let imageSource = image;
      let preprocessedImages: File[] = [];
      
      if (image.type.startsWith('image/')) {
        try {
          console.log('Starting advanced image preprocessing for text extraction');
          const imageBitmap = await createImageBitmap(image);
          
          // Create multiple canvas versions with different preprocessing techniques
          const createProcessedVersion = async (processingFunction: (ctx: CanvasRenderingContext2D, imgData: ImageData) => void, name: string): Promise<File> => {
            const canvas = document.createElement('canvas');
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');
            
            // Draw the initial image
            ctx.drawImage(imageBitmap, 0, 0);
            
            // Get the image data for processing
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Apply the specific processing function
            processingFunction(ctx, imageData);
            
            // Convert to blob/file
            const processedBlob = await new Promise<Blob>(resolve => {
              canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.95);
            });
            
            return new File([processedBlob], `${name}.jpg`, { type: 'image/jpeg' });
          };
          
          // 1. Standard contrast enhancement (good for normal text)
          const contrastEnhancement = async (ctx: CanvasRenderingContext2D, imageData: ImageData) => {
            const data = imageData.data;
            const contrast = 1.3; // Increase contrast by 30%
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            
            for (let i = 0; i < data.length; i += 4) {
              data[i] = factor * (data[i] - 128) + 128; // r
              data[i + 1] = factor * (data[i + 1] - 128) + 128; // g
              data[i + 2] = factor * (data[i + 2] - 128) + 128; // b
            }
            
            ctx.putImageData(imageData, 0, 0);
          };
          
          // 2. Special processing for blurry text 
          const blurryTextEnhancement = async (ctx: CanvasRenderingContext2D, imageData: ImageData) => {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;
            
            // First convert to grayscale to simplify text detection
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = data[i + 1] = data[i + 2] = avg;
            }
            
            // Apply a threshold to make text more distinct
            const threshold = 140; // Adjust based on testing
            for (let i = 0; i < data.length; i += 4) {
              // Hard threshold for text clarity
              const value = data[i] < threshold ? 0 : 255;
              data[i] = data[i + 1] = data[i + 2] = value;
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Apply unsharp masking for edge enhancement (helps with blurry text)
            ctx.filter = 'contrast(120%) brightness(105%)';
            // Use the current canvas - ctx automatically refers to its own canvas
            ctx.drawImage(ctx.canvas, 0, 0);
            ctx.filter = 'none';
          };
          
          // 3. Edge detection enhancement for text boundaries
          const edgeEnhancement = async (ctx: CanvasRenderingContext2D, imageData: ImageData) => {
            // Apply a combination of techniques optimal for text edges
            ctx.filter = 'saturate(0%) contrast(160%)';
            // Use the current canvas - ctx automatically refers to its own canvas
            ctx.drawImage(ctx.canvas, 0, 0);
            
            // Sharpen edges with a subtle emboss effect
            ctx.filter = 'contrast(120%) brightness(110%)';
            ctx.globalCompositeOperation = 'overlay';
            ctx.drawImage(ctx.canvas, 0, 0);
            
            // Reset filters
            ctx.filter = 'none';
            ctx.globalCompositeOperation = 'source-over';
          };
          
          // Create all the processed versions in parallel
          setProgress(40);
          
          const [contrastVersion, blurryTextVersion, edgeVersion] = await Promise.all([
            createProcessedVersion(contrastEnhancement, 'contrast-enhanced'),
            createProcessedVersion(blurryTextEnhancement, 'blurry-text-enhanced'),
            createProcessedVersion(edgeEnhancement, 'edge-enhanced')
          ]);
          
          // Store all versions for multi-pass OCR
          preprocessedImages = [contrastVersion, blurryTextVersion, edgeVersion];
          
          // Use the contrast enhanced version as primary
          imageSource = contrastVersion;
          console.log('Created multiple preprocessed versions for optimal text extraction');
          setProgress(60);
        } catch (err) {
          console.warn('Advanced image preprocessing failed, falling back to original image', err);
          // Fall back to original image if preprocessing fails
        }
      }
      
      // Run multi-pass OCR optimized for blurred text extraction
      console.log('Running advanced multi-pass OCR with blurry text optimization...');
      
      // Track all OCR results to combine for best output
      const ocrResults: { text: string; confidence: number; source: string }[] = [];
      
      try {
        // Make sure the scheduler is initialized
        if (!ocrScheduler || !primaryWorker) {
          throw new Error('OCR system not properly initialized');
        }
        
        // PASS 1: Process the main enhanced image
        console.log('OCR Pass 1: Processing main enhanced image');
        const mainResult = await ocrScheduler.addJob('recognize', imageSource);
        ocrResults.push({
          text: mainResult.data.text,
          confidence: mainResult.data.confidence || 0,
          source: 'main_enhanced'
        });
        console.log(`Main image OCR complete - ${mainResult.data.text.length} characters, confidence: ${mainResult.data.confidence}`);
        
        // PASS 2: Process additional preprocessed images for blurry text
        if (preprocessedImages.length > 0) {
          console.log(`OCR Pass 2: Processing ${preprocessedImages.length} specialized image versions`);
          
          // Process remaining preprocessed images in parallel
          const specializedResults = await Promise.all(
            preprocessedImages.map(async (img, idx) => {
              // Skip the first one if it's the same as imageSource
              if (idx === 0 && img === imageSource) return null;
              
              console.log(`Processing specialized image #${idx+1}`);
              // Use non-null assertion since we've already checked for scheduler
              const result = await ocrScheduler!.addJob('recognize', img);
              return {
                text: result.data.text,
                confidence: result.data.confidence || 0,
                source: `specialized_${idx}`
              };
            })
          );
          
          // Add valid results to our collection
          specializedResults.filter(Boolean).forEach(result => {
            if (result) ocrResults.push(result);
          });
          
          console.log(`Completed processing ${specializedResults.filter(Boolean).length} specialized images`);
        }
        
        // PASS 3: Run a dedicated blurry text pass with adaptive thresholding
        console.log('OCR Pass 3: Dedicated blurry text extraction');
        try {
          if (primaryWorker) {
            // Configure primary worker specifically for blurry text
            await primaryWorker.setParameters({
              tessedit_pageseg_mode: PSM.SPARSE_TEXT, // Better for ingredient lists
              tessedit_char_blacklist: '[]{}^~|\\', // Remove problematic symbols often misread in blurry text
              textord_min_linesize: '1.25', // Better for small text
              textord_heavy_nr: '1' // More aggressive noise removal
            });
            
            const blurryResult = await primaryWorker.recognize(imageSource);
            ocrResults.push({
              text: blurryResult.data.text,
              confidence: blurryResult.data.confidence || 0,
              source: 'blurry_optimized'
            });
            console.log(`Blurry text pass complete - ${blurryResult.data.text.length} characters`);
          }
        } catch (blurryError) {
          console.warn('Blurry text specialized pass failed:', blurryError);
          // Continue with other results
        }
        
        console.log(`Multi-pass OCR complete with ${ocrResults.length} different text extractions`);
        
      } catch (err) {
        console.warn('Scheduler OCR failed, falling back to single worker', err);
        // Fallback to single worker if scheduler fails
        if (primaryWorker) {
          const fallbackResult = await primaryWorker.recognize(imageSource);
          ocrResults.push({
            text: fallbackResult.data.text,
            confidence: fallbackResult.data.confidence || 0,
            source: 'fallback_primary'
          });
        } else {
          // Create a new worker as last resort
          const fallbackWorker = await createWorker();
          await (fallbackWorker as any).loadLanguage('eng');
          await (fallbackWorker as any).initialize('eng');
          const lastResortResult = await fallbackWorker.recognize(imageSource);
          ocrResults.push({
            text: lastResortResult.data.text,
            confidence: lastResortResult.data.confidence || 0,
            source: 'last_resort'
          });
          // Make sure to terminate this worker later
          workerList.push(fallbackWorker);
        }
      }
      
      clearInterval(progressInterval);
      setProgress(85);
      
      // Verify we have at least one OCR result
      if (ocrResults.length === 0) {
        throw new Error('No text extracted from any OCR passes');
      }
      
      // Merge results using advanced techniques to handle blurry text better
      console.log('Merging and analyzing OCR results from multiple passes...');
      
      // 1. Sort OCR results by confidence and text length
      // This helps prioritize the most reliable and detailed extractions
      ocrResults.sort((a, b) => {
        // Weight: 70% confidence, 30% text length
        const aScore = (a.confidence * 0.7) + ((a.text.length / 1000) * 0.3);
        const bScore = (b.confidence * 0.7) + ((b.text.length / 1000) * 0.3);
        return bScore - aScore;
      });
      
      console.log('OCR results ranked by quality:', 
        ocrResults.map(r => `${r.source}: ${r.text.length} chars, ${r.confidence.toFixed(2)} confidence`).join('\n'));
      
      // 2. Find ingredient sections in each result
      const ingredientExtractionsWithScore: {text: string; score: number; source: string}[] = [];
      
      // Process each OCR result to extract ingredients section
      for (const ocrResult of ocrResults) {
        // Skip very low quality results
        if (ocrResult.text.length < 10) continue;
        
        // First try standard extraction
        let ingredientSection = findIngredientsSection(ocrResult.text);
        
        // If standard extraction didn't find a clear section, try blurry text specialized extraction
        if (ingredientSection === ocrResult.text) {
          console.log(`No clear ingredient section found in ${ocrResult.source}, trying blurry text extraction`);
          ingredientSection = extractIngredientsFromBlurryText(ocrResult.text);
        }
        
        if (ingredientSection && ingredientSection.length > 20) {
          // Calculate a score based on extraction quality and OCR confidence
          // Give higher weight to results that were extracted with clear section markers
          const isCleanExtraction = ingredientSection !== ocrResult.text;
          const extractionBonus = isCleanExtraction ? 20 : 0; // Bonus points for clean extraction
          const sectionScore = (ingredientSection.length * 0.5) + (ocrResult.confidence * 0.3) + extractionBonus;
          
          ingredientExtractionsWithScore.push({
            text: ingredientSection,
            score: sectionScore,
            source: `${ocrResult.source}${isCleanExtraction ? '_clean' : '_heuristic'}`
          });
          
          console.log(`Found ingredient section in ${ocrResult.source}: ${ingredientSection.length} chars, score: ${sectionScore.toFixed(2)}`);
        }
      }
      
      // Choose the best ingredients section, or fall back to best raw text
      let extractedText = '';
      
      if (ingredientExtractionsWithScore.length > 0) {
        // Sort by score in descending order
        ingredientExtractionsWithScore.sort((a, b) => b.score - a.score);
        
        // Use the highest scoring ingredients section
        extractedText = ingredientExtractionsWithScore[0].text;
        console.log(`Selected best ingredient section from ${ingredientExtractionsWithScore[0].source} with score ${ingredientExtractionsWithScore[0].score.toFixed(2)}`);
      } else {
        // Fallback to highest confidence OCR result
        extractedText = ocrResults[0].text;
        console.log(`No clear ingredient sections found, using best OCR result from ${ocrResults[0].source}`);
      }
      
      console.log('Extracted text for processing:', extractedText.substring(0, 300) + '...');
      
      // Function is now moved up before it's used in the OCR result processing code
      // (Definition moved to before the multi-pass OCR logic)
      
      // Try to extract just the ingredients section
      const extractedIngredientSection = findIngredientsSection(extractedText);
      console.log('Extracted ingredient section:', extractedIngredientSection.substring(0, 200) + '...');
      
      // Enhanced text cleaning for food labels with multi-pass approach
      const cleanRawText = (text: string): string => {
        // First pass: Fix major structural issues and common OCR errors
        let cleaned = text
          // Handle hyphenation and line breaks
          .replace(/-(\r?\n|\r)/g, '')
          // Remove excessive whitespace of any kind while preserving logical groups
          .replace(/\s{2,}/g, ' ')
          // Fix decimal points and percentages
          .replace(/([0-9])\s+\.\s+([0-9])/g, '$1.$2')
          .replace(/o\/o/gi, '%')
          .replace(/([0-9])\s*%/g, '$1%')
          // Fix common OCR errors with letters and numbers
          .replace(/\b0\b/g, 'O')
          .replace(/\bl\b/g, 'I')
          .replace(/\|/g, 'I')
          .replace(/\bD\b/g, '0')
          .replace(/\bG\b/g, '6')
          .replace(/\bS\b/g, '5')
          .replace(/\bZ\b/g, '2');

        // Second pass: Fix specific food label terminology and formats
        cleaned = cleaned
          // Common ingredient name corrections
          .replace(/addltives/gi, 'additives')
          .replace(/colonng/gi, 'coloring')
          .replace(/artlficial/gi, 'artificial')
          .replace(/fiavou?r/gi, 'flavor')
          .replace(/preservatlve/gi, 'preservative')
          .replace(/homogenlsed/gi, 'homogenized')
          .replace(/nutr[il]t[il]onal/gi, 'nutritional')
          .replace(/([^a-z])lnformation/gi, '$1information')
          .replace(/starisea-homogenise/gi, 'Homogenized')
          .replace(/amount\s*per\s*100\s*9/gi, 'Amount per 100g')
          .replace(/nutritional\s*information/gi, 'NUTRITIONAL INFORMATION')
          // Clean up common food label text artifacts
          .replace(/[\*\#\@]/g, '')
          // Standardize delimiters between ingredients
          .replace(/,\s*and\s*/g, ', ')
          .replace(/\s*\(\s*/g, ' (')
          .replace(/\s*\)\s*/g, ') ')
          // Remove extra spaces (again, after replacements)
          .replace(/\s{2,}/g, ' ')
          .trim();

        return cleaned;
      };

      // Check if the text looks like nutritional information rather than ingredients
      const isNutritionalInfo = (text: string): boolean => {
        const nutritionPatterns = [
          /nutrition(al)? (facts|information)/i,
          /amount per (serving|100g)/i,
          /energy.*?k?cal/i,
          /protein.*?g/i,
          /carbohydrate.*?g/i,
          /fat.*?g/i,
          /daily value/i
        ];
        
        let matchCount = 0;
        for (const pattern of nutritionPatterns) {
          if (pattern.test(text)) matchCount++;
        }
        
        // If 2 or more nutrition patterns match, it's likely nutritional info
        return matchCount >= 2;
      };

      // Look specifically for an ingredients list pattern
      const extractIngredientsListOnly = (text: string): string => {
        // Check various forms of ingredients lists
        const ingredientSections = [
          /ingredients\s*:([^.]*?)(\.|$)/i,
          /contains\s*:([^.]*?)(\.|$)/i,
          /ingredients\s*list\s*:([^.]*?)(\.|$)/i,
          /made with\s*:([^.]*?)(\.|$)/i
        ];
        
        for (const pattern of ingredientSections) {
          const match = text.match(pattern);
          if (match && match[1] && match[1].length > 15) {
            console.log('Found dedicated ingredients section');
            return match[1].trim();
          }
        }
        
        // If we've got mostly nutritional info, try to find any comma-separated list
        // that might be ingredients
        if (isNutritionalInfo(text)) {
          console.log('Text appears to be nutritional info, looking for ingredient-like patterns');
          
          // Look for comma-separated lists (likely ingredients)
          const commaListMatch = text.match(/([a-z][a-z\s,()-]{30,})/i);
          if (commaListMatch && commaListMatch[1] && commaListMatch[1].includes(',')) {
            return commaListMatch[1].trim();
          }
          
          // If we can't find a clear ingredients list but have nutritional info,
          // we should warn about this
          console.warn('Found nutritional information but no clear ingredients list');
        }
        
        return text;
      };
      
      // Apply specialized multi-pass cleaning with advanced blurry text handling
      // First, apply comprehensive cleaning to improve text quality
      const initialCleanedText = cleanRawText(extractedText);
      console.log('Initial cleaned text:', initialCleanedText.substring(0, 200) + '...');
      
      // Advanced cleaning for blurry text - focus on fixing common OCR errors in ingredients lists
      const cleanBlurryText = (text: string): string => {
        // Fix common OCR errors in food label text, especially for blurry images
        return text
          // Fix common ingredient name OCR errors
          .replace(/sodiurn/gi, 'sodium')
          .replace(/potassiurn/gi, 'potassium')
          .replace(/rnilk/gi, 'milk')
          .replace(/\bfrult\b/gi, 'fruit')
          .replace(/\bcorn s[vy]rup\b/gi, 'corn syrup')
          .replace(/monosodiurn/gi, 'monosodium')
          .replace(/ribofiav[il]n/gi, 'riboflavin')
          .replace(/cyanocobalarn[il]n/gi, 'cyanocobalamin')
          .replace(/rnalto/gi, 'malto')
          .replace(/vitarnin/gi, 'vitamin')
          .replace(/calciurn/gi, 'calcium')
          .replace(/acidu[li]ants?/gi, 'acidulant')
          .replace(/ernulsifiers?/gi, 'emulsifier')
          // Common OCR errors with blurry digits and symbols
          .replace(/\b([0-9]),([0-9])\b/g, '$1.$2') // Fix comma used as decimal point
          .replace(/\b([0-9])\s?\.\s?([0-9])\b/g, '$1.$2') // Fix spaced decimal points
          .replace(/\b([a-z])(\.)([a-z])\b/gi, '$1,$3') // Fix periods that should be commas in lists
          // Handle cases where m, n, and rn are confused
          .replace(/cornstarch/gi, 'cornstarch')
          .replace(/palrn/gi, 'palm')
          .replace(/vitarnins/gi, 'vitamins')
          // Fix spacing issues between ingredients
          .replace(/([a-z])\s+,\s+/gi, '$1, ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      };
      
      // Then try to extract just the ingredients section, using both standard and blurry methods
      let extractedIngredientText = extractIngredientsListOnly(initialCleanedText);
      
      // If we don't get a clear ingredients section, try the blurry text approach
      if (extractedIngredientText === initialCleanedText) {
        console.log('Trying specialized blurry text extraction as fallback');
        extractedIngredientText = extractIngredientsFromBlurryText(initialCleanedText);
      }
      
      console.log('Extracted ingredient section:', extractedIngredientText.substring(0, 200) + '...');
      
      // Apply both standard and blurry text cleaning
      const processedText = cleanBlurryText(cleanRawText(extractedIngredientText));
      
      // Use the processed text as our final extracted text
      extractedText = processedText;
      
      console.log('Intelligent post-processing complete, continuing with analysis...');
      setProgress(95);
      
      // Check if we have enough meaningful content before proceeding
      if (extractedText.trim().length < 10) {
        throw new Error('Insufficient ingredient text extracted from the image');
      }
      
      // Check for some basic indicators of ingredient data being present
      const hasCommas = extractedText.includes(',');
      const hasIngredientsMention = /ingredient|contain|made with/i.test(extractedText);
      
      if (!hasCommas && !hasIngredientsMention && extractedText.length < 50) {
        console.warn('Extracted text may not contain valid ingredient information');
      }
      
      // Prepare the final text for API processing with additional context hints
      const finalApiText = `INGREDIENT LIST: ${extractedText}`;
      console.log('Sending processed text for ingredient extraction:', finalApiText.substring(0, 100) + '...');
      
      // Send to backend for extraction with improved timeout
      const ingredientsResponse = await axios.post('/api/ingredients/extract', 
        { text: finalApiText },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000 // Increased timeout for more thorough extraction
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
      
      // Prepare ingredients for Gemini analysis with optimized structure
      // Format the ingredients in a clearer, more structured way for better analysis
      const formatIngredientsForAnalysis = (ingredients: any[], productInfo: any): string => {
        // Create a structured ingredient list with proper formatting
        const formattedIngredients = ingredients.map((ing: { 
          name: string; 
          scientificName?: string; 
          quantity?: string; 
          type?: string;
        }, index: number) => {
          let text = `${index + 1}. ${ing.name}`;
          if (ing.scientificName) text += ` (Scientific name: ${ing.scientificName})`;
          if (ing.quantity) text += ` - Quantity: ${ing.quantity}`;
          if (ing.type) text += ` - Type: ${ing.type}`;
          return text;
        }).join('\n');
        
        // Create full context with product information
        let analysisText = `INGREDIENT ANALYSIS REQUEST\n\n`;
        
        // Add product context first for better understanding
        analysisText += `PRODUCT INFORMATION:\n`;
        analysisText += `Product Name: ${productInfo.name}\n`;
        if (productInfo.servingSize !== 'Not specified') {
          analysisText += `Serving Size: ${productInfo.servingSize}\n`;
        }
        if (productInfo.format !== 'Standard') {
          analysisText += `Format: ${productInfo.format}\n`;
        }
        
        // Add any additional product information we have
        const additionalInfo = productInfo.additionalInfo || {};
        Object.entries(additionalInfo).forEach(([key, value]) => {
          if (value && String(value).trim()) {
            analysisText += `${key}: ${value}\n`;
          }
        });
        
        // Add the clearly formatted list of ingredients
        analysisText += `\nINGREDIENT LIST (${ingredients.length} ingredients):\n${formattedIngredients}\n\n`;
        
        return analysisText;
      };
      
      // Generate the optimized analysis text with rich context
      const enhancedAnalysisText = formatIngredientsForAnalysis(ingredients, productInfo);
      
      // Log a sample of what we're sending (truncated for readability)
      console.log('Sending enhanced request to Gemini:\n', 
        enhancedAnalysisText.split('\n').slice(0, 10).join('\n') + '\n...');
      
      // Analyze ingredients with Gemini using optimized request format
      try {
        // Send the optimized analysis request
        const analysisResponse = await axios.post('/api/ingredients/analyze', 
          { 
            text: enhancedAnalysisText,
            productInfo: productInfo, // Still send structured product info for backend processing
            requestVersion: 2, // Indicate this is using the enhanced format
          },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'X-API-Key': apiKey || '', // Ensure we always send a string, even if empty
              'X-Request-Format': 'enhanced' // Signal to backend this is our enhanced format
            },
            timeout: 75000 // Increased timeout (75 sec) for thorough analysis with retries
          }
        );
      
        if (!analysisResponse.data || !Array.isArray(analysisResponse.data) || analysisResponse.data.length === 0) {
          console.error('Analysis response data:', analysisResponse.data);
          throw new Error('Failed to analyze ingredients or no results returned');
        }
        
        console.log(`Successfully analyzed ${analysisResponse.data.length} ingredients`);
        setResults(analysisResponse.data);
        setProgress(100);
      } catch (error: any) {
        console.error('API request error:', error);
        
        // Check for specific backend error messages
        if (error.response) {
          const statusCode = error.response.status;
          const errorMessage = error.response.data?.error || error.message;
          
          console.error(`Backend returned ${statusCode} error:`, errorMessage);
          
          if (statusCode === 503 || errorMessage.includes('overloaded') || errorMessage.includes('high traffic')) {
            console.log('Gemini API overloaded, using local analysis as fallback');
            
            // Extract ingredients directly from the OCR text
            try {
              // Use the already extracted ingredients from the ingredients API response
              if (ingredients && ingredients.length > 0) {
                // Get just the names for local analysis
                const ingredientNames = ingredients.map((ing: { name: string }) => ing.name);
                
                // Perform local analysis
                const localResults = analyzeIngredientsLocally(ingredientNames);
                
                if (localResults && localResults.length > 0) {
                  console.log('Using local analysis results:', localResults.length, 'ingredients analyzed');
                  setResults(localResults);
                  setProgress(100);
                  
                  // Show informational message about using local analysis
                  setError(
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                      <h3 className="font-bold text-blue-700 mb-2">Using local analysis</h3>
                      <p className="text-blue-600 text-sm">
                        Due to high demand, we've analyzed your ingredients locally. 
                        For more detailed analysis, try again later.
                      </p>
                    </div>
                  );
                  return; // Skip the error message below
                }
              }
            } catch (localAnalysisError) {
              console.error('Local analysis failed:', localAnalysisError);
              // Continue to show standard error if local analysis fails
            }
            
            // If local analysis fails or can't be used, show the standard error
            setError(
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                <h3 className="font-bold text-amber-800 mb-2">We're experiencing high demand</h3>
                <p className="text-amber-700 font-medium">
                  Please try again in a few minutes.
                </p>
              </div>
            );
          } else if (statusCode === 401) {
            setError(
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-bold text-red-800 mb-2">API Key Error</h3>
                <p className="text-red-700">{errorMessage}</p>
              </div>
            );
          } else if (statusCode === 504) {
            setError(
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-bold text-amber-800 mb-2">Request Timeout</h3>
                <p className="text-amber-700">
                  The analysis request timed out. Please try again with a smaller ingredient list or try later when the service is less busy.
                </p>
              </div>
            );
          } else {
            setError(
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-bold text-red-800 mb-2">Server Error (${statusCode})</h3>
                <p className="text-red-700">{errorMessage || 'Unknown error'}</p>
              </div>
            );
          }
        } else if (error.request) {
          console.log('Network error, attempting direct OCR-to-analysis fallback');
          
          // Try to extract and analyze ingredients directly from the OCR text
          try {
            // Extract ingredients directly from the raw OCR text
            const extractedIngredients = extractIngredientsFromText(extractedText);
            
            if (extractedIngredients && extractedIngredients.length > 0) {
              // Perform local analysis on the extracted ingredients
              const localResults = analyzeIngredientsLocally(extractedIngredients);
              
              if (localResults && localResults.length > 0) {
                console.log('Direct OCR-to-analysis succeeded with', localResults.length, 'ingredients');
                setResults(localResults);
                setProgress(100);
                
                // Show informational message about using local analysis
                setError(
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <h3 className="font-bold text-blue-700 mb-2">Using offline analysis</h3>
                    <p className="text-blue-600 text-sm">
                      We've analyzed your ingredients offline. For more detailed analysis, 
                      please check your network connection and try again.
                    </p>
                  </div>
                );
                return; // Skip showing the network error
              }
            }
          } catch (localError) {
            console.error('Direct OCR-to-analysis failed:', localError);
            // Fall through to the network error message
          }
          
          // Show network error if direct analysis fails
          setError(
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-800 mb-2">Network Error</h3>
              <p className="text-red-700">Please check your connection and try again.</p>
            </div>
          );
        } else {
          setError(
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error.message || 'Unknown error'}</p>
            </div>
          );
        }
      }
    } catch (err) {
      console.error('Process image error:', err);
      setError(
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="font-bold text-red-800 mb-2">Processing Error</h3>
          <p className="text-red-700">{err instanceof Error ? err.message : 'An unexpected error occurred'}</p>
        </div>
      );
      setResults(null);
    } finally {
      clearInterval(progressInterval);
      // Clean up all workers and scheduler
      if (ocrScheduler) {
        try {
          await ocrScheduler.terminate();
        } catch (e) {
          console.warn('Error terminating scheduler:', e);
        }
      }
      
      // Ensure all workers are terminated even if scheduler termination fails
      for (const w of workerList) {
        try {
          await w.terminate();
        } catch (e) {
          console.warn('Error terminating worker:', e);
        }
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
      
      {/* Camera UI when active */}
      {showCamera && (
        <div className="mb-6 p-6 border rounded-lg shadow-sm bg-black bg-opacity-80 border-cyan-400/30 glow-border">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            {/* Live camera feed */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-contain bg-black"
            />
            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera controls overlay */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={captureImage}
                className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg transition-colors"
                aria-label="Take photo"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
                  <circle cx="12" cy="12" r="7" fill="white" />
                </svg>
              </button>
            </div>
            
            {/* Close camera button */}
            <button
              onClick={stopCamera}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
              aria-label="Close camera"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {cameraError && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
              <p className="text-red-200">{cameraError}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Upload options when camera is not active */}
      {!showCamera && (
        <div className="mb-6 p-6 border rounded-lg shadow-sm bg-black bg-opacity-70 border-cyan-400/30 glow-border">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera capture option */}
          <div 
            className={`upload-option h-48 border rounded-lg p-4 cursor-pointer hover:border-cyan-400 transition-all duration-300 bg-gradient-to-br from-[#0f172a] to-[#1e293b]`}
            onClick={startCamera}
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4H19v8a2 2 0 01-2 2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="font-medium text-lg mb-2">Take a Photo</h3>
              <p className="text-sm">Use your device&apos;s camera to capture the ingredients label</p>
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
      )}
      
      {preview && (
        <div className="mb-6 p-6 border rounded-lg shadow-sm bg-black bg-opacity-70 border-cyan-400/30 glow-border">
          <h2 className="text-xl font-semibold mb-6 text-white">
            <span className="text-cyan-400 mr-2">📷</span>
            Image Preview
          </h2>
          <div className="preview-container relative rounded-lg overflow-hidden border border-gray-700 shadow-lg">
            <Image
              src={preview}
              alt="Food packaging preview"
              width={800}
              height={400}
              className="object-contain w-full h-full"
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
}