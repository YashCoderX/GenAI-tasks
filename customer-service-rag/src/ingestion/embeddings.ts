import OpenAI from 'openai';
import type { Embedding } from 'openai/resources/embeddings';

let API_KEY: string | undefined;

if (typeof window === 'undefined') {
  // Node.js (script)
  try {
    const dotenvModule = await import('dotenv');
    dotenvModule.config();
    API_KEY = process.env.VITE_DEEPINFRA_TOKEN;
  } catch {
    API_KEY = process.env?.VITE_DEEPINFRA_TOKEN;
  }
} else {
  // Browser (Vite)
  API_KEY = import.meta.env.VITE_DEEPINFRA_TOKEN;
}

if (!API_KEY) {
  throw new Error('DeepInfra API key not found in environment variables.');
}

const openai = new OpenAI({
  baseURL: 'https://api.deepinfra.com/v1/openai',
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true, // Allow browser usage
});

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const embedding = await openai.embeddings.create({
      model: "sentence-transformers/all-mpnet-base-v2",
      input: text,
      encoding_format: "float",
    });

    return embedding.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
  try {
    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const allEmbeddings: number[][] = [];
    
    for (const batch of batches) {
      const embedding = await openai.embeddings.create({
        model: "sentence-transformers/all-mpnet-base-v2",
        input: batch,
        encoding_format: "float",
      });

      allEmbeddings.push(...embedding.data.map((data: Embedding) => data.embedding));
    }

    return allEmbeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}; 