"use client";

import { useState, useEffect } from 'react';
import styles from '../../styles/test-extraction.module.css';

interface IngredientData {
  name: string;
  scientificName?: string;
  quantity?: string;
  percentage?: string;
  type?: string;
}

interface ExtractionResult {
  productName: string | null;
  servingSize: string | null;
  ingredients: IngredientData[];
  additionalInfo: Record<string, string>;
  format: string;
}

export default function TestExtraction() {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs when component unmounts or when a new image is selected
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Revoke previous object URL if it exists
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      
      // Create a new object URL for the file
      const objectUrl = URL.createObjectURL(file);
      setImagePreviewUrl(objectUrl);
      
      // TODO: In a future implementation, we could use OCR to extract text from the image
      // For now, we'll just display the image and let the user enter the text manually
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExtractedText(e.target.value);
  };

  const handleExtract = async () => {
    if (!extractedText.trim()) {
      setError('Please enter some text to extract ingredients from');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ingredients/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract ingredients');
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for testing
  const loadSampleData = () => {
    const sampleText = `HAJMOLA® MAHA CANDY CHULBULI IMLI
Composition: Each (3.2g) candy is prepared from:
Powders of: Imli (Tamarindus indica Fr. Pulp Satva) 32.43mg, Suvarchala 
Lavana (Kala Namak) (Unaqua Sodium chloride) 24.32mg, Saindhav Lavana
(Sodium Chloride) 18.24mg, Shveta Jiraka (Cuminum cyminum, Fr.) 9.73mg,
Sunthi (Zingiber officinale, Rz.) 7.30mg, Pippali (Piper longum, Fr.) 4.86mg,
Maricha (Piper nigrum, Fr.) 2.43mg, Narasara (Ammonium Chloride) 1.22mg.
Excipients: q.s.
No preservatives, artificial sweeteners or colouring agents used.`;
    
    setExtractedText(sampleText);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ingredient Extraction Test</h1>
      
      <div className={styles.uploadSection}>
        <h2>Upload Food Label Image</h2>
        <label htmlFor="food-label-upload" className={styles.fileInputLabel}>
          Choose an image file
          <input 
            id="food-label-upload"
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className={styles.fileInput}
            aria-label="Upload food label image"
          />
        </label>
        
        {imagePreviewUrl && (
          <div className={styles.imagePreview}>
            {/* Using standard img tag for blob URLs - this is necessary for this specific use case
                as we're working with local blob URLs which Next.js Image component doesn't handle well */}
            <img 
              src={imagePreviewUrl} 
              alt="Uploaded food label" 
              className={styles.previewImage}
            />
          </div>
        )}
      </div>

      <div className={styles.textSection}>
        <h2>Enter Ingredient Text</h2>
        <div className={styles.buttonRow}>
          <button 
            onClick={loadSampleData} 
            className={styles.button}
          >
            Load Sample Data
          </button>
        </div>
        <textarea 
          value={extractedText}
          onChange={handleTextChange}
          className={styles.textArea}
          placeholder="Enter or paste the ingredients text here..."
          rows={10}
        />
        
        <button 
          onClick={handleExtract} 
          className={styles.extractButton}
          disabled={isLoading}
        >
          {isLoading ? 'Extracting...' : 'Extract Ingredients'}
        </button>
        
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {result && (
        <div className={styles.resultSection}>
          <h2>Extraction Results</h2>
          
          <div className={styles.resultCard}>
            <h3>Product Information</h3>
            <p><strong>Product Name:</strong> {result.productName || 'Not detected'}</p>
            <p><strong>Serving Size:</strong> {result.servingSize || 'Not detected'}</p>
            <p><strong>Format Detected:</strong> {result.format}</p>
            
            {Object.keys(result.additionalInfo).length > 0 && (
              <div>
                <h4>Additional Information</h4>
                <ul>
                  {Object.entries(result.additionalInfo).map(([key, value]) => (
                    <li key={key}><strong>{key}:</strong> {value}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className={styles.resultCard}>
            <h3>Ingredients ({result.ingredients.length})</h3>
            <div className={styles.ingredientsTable}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Scientific Name</th>
                    <th>Quantity</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {result.ingredients.map((ingredient, index) => (
                    <tr key={index}>
                      <td>{ingredient.name}</td>
                      <td>{ingredient.scientificName || '-'}</td>
                      <td>{ingredient.quantity || ingredient.percentage || '-'}</td>
                      <td>{ingredient.type || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
