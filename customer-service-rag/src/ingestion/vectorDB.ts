import { QdrantClient } from '@qdrant/js-client-rest';
import type { Chunk } from './chunking';

export interface VectorSearchResult {
  text: string;
  score: number;
  metadata: {
    id: number;
    title: string;
    rating: number;
    date: string;
    category: string;
    useful?: boolean;
  };
}

const QDRANT_URL = typeof window === 'undefined' 
  ? process.env.QDRANT_URL || 'http://localhost:6333'
  : import.meta.env.VITE_QDRANT_URL || 'http://localhost:6333';

const REVIEWS_WITH_USEFUL = 'reviews_with_useful';
const REVIEWS_WITHOUT_USEFUL = 'reviews_without_useful';

// Initialize Qdrant client
const client = new QdrantClient({ 
  url: QDRANT_URL,
  checkCompatibility: false 
});

export const initVectorDB = async () => {
  try {
    // Check if collections exist
    const collections = await client.getCollections();
    const collectionNames = collections.collections.map(c => c.name);

    // Initialize reviews_with_useful collection
    if (!collectionNames.includes(REVIEWS_WITH_USEFUL)) {
      console.log('Creating collection:', REVIEWS_WITH_USEFUL);
      await client.createCollection(REVIEWS_WITH_USEFUL, {
        vectors: {
          size: 768, // Size of the embeddings from all-mpnet-base-v2
          distance: 'Cosine' as const,
        },
      });
    }

    // Initialize reviews_without_useful collection
    if (!collectionNames.includes(REVIEWS_WITHOUT_USEFUL)) {
      console.log('Creating collection:', REVIEWS_WITHOUT_USEFUL);
      await client.createCollection(REVIEWS_WITHOUT_USEFUL, {
        vectors: {
          size: 768, // Size of the embeddings from all-mpnet-base-v2
          distance: 'Cosine' as const,
        },
      });
    }

    // Create payload indexes for both collections
    for (const collection of [REVIEWS_WITH_USEFUL, REVIEWS_WITHOUT_USEFUL]) {
      await client.createPayloadIndex(collection, {
        field_name: 'category',
        field_schema: 'keyword',
      });
    }

    console.log('Vector database initialized successfully');
  } catch (error) {
    console.error('Error initializing vector database:', error);
    throw error;
  }
};

export const addReviews = async (chunks: Chunk[], embeddings: number[][]) => {
  try {
    // Split chunks into useful and non-useful
    const usefulChunks: Chunk[] = [];
    const nonUsefulChunks: Chunk[] = [];
    const usefulEmbeddings: number[][] = [];
    const nonUsefulEmbeddings: number[][] = [];

    chunks.forEach((chunk, index) => {
      if (chunk.metadata.useful) {
        usefulChunks.push(chunk);
        usefulEmbeddings.push(embeddings[index]);
      } else {
        nonUsefulChunks.push(chunk);
        nonUsefulEmbeddings.push(embeddings[index]);
      }
    });

    // Add reviews with useful field
    if (usefulChunks.length > 0) {
      const usefulPoints = usefulChunks.map((chunk, index) => ({
        id: index,
        vector: usefulEmbeddings[index],
        payload: {
          text: chunk.text,
          metadata: {
            id: chunk.metadata.id,
            title: chunk.metadata.title,
            rating: chunk.metadata.rating,
            date: chunk.metadata.date,
            category: chunk.metadata.category,
            useful: chunk.metadata.useful
          }
        },
      }));

      await client.upsert(REVIEWS_WITH_USEFUL, {
        points: usefulPoints,
      });
      console.log(`Added ${usefulPoints.length} chunks to ${REVIEWS_WITH_USEFUL}`);
    }

    // Add reviews without useful field
    if (nonUsefulChunks.length > 0) {
      const nonUsefulPoints = nonUsefulChunks.map((chunk, index) => ({
        id: index,
        vector: nonUsefulEmbeddings[index],
        payload: {
          text: chunk.text,
          metadata: {
            id: chunk.metadata.id,
            title: chunk.metadata.title,
            rating: chunk.metadata.rating,
            date: chunk.metadata.date,
            category: chunk.metadata.category
          }
        },
      }));

      await client.upsert(REVIEWS_WITHOUT_USEFUL, {
        points: nonUsefulPoints,
      });
      console.log(`Added ${nonUsefulPoints.length} chunks to ${REVIEWS_WITHOUT_USEFUL}`);
    }

    console.log(`Total chunks added: ${chunks.length}`);
  } catch (error) {
    console.error('Error adding chunks to vector database:', error);
    throw error;
  }
};

export const searchReviews = async (
  embedding: number[],
  limit: number = 5,
  searchUseful: boolean = true,
  category?: string
): Promise<VectorSearchResult[]> => {
  try {
    const collection = searchUseful ? REVIEWS_WITH_USEFUL : REVIEWS_WITHOUT_USEFUL;
    
    const searchParams: any = {
      vector: embedding,
      limit,
      with_payload: true,
    };

    if (category) {
      searchParams.filter = {
        must: [
          {
            key: "metadata.category",
            match: {
              value: category
            }
          }
        ]
      };
    }

    const results = await client.search(collection, searchParams);

    return results.map((result) => {
      const payload = result.payload as { 
        text: string;
        metadata: { 
          id: number; 
          title: string; 
          rating: number; 
          date: string; 
          category: string; 
          useful?: boolean 
        } 
      };
      return {
        text: payload?.text || '',
        score: result.score,
        metadata: {
          id: payload?.metadata?.id,
          title: payload?.metadata?.title,
          rating: payload?.metadata?.rating,
          date: payload?.metadata?.date,
          category: payload?.metadata?.category,
          ...(searchUseful && { useful: payload?.metadata?.useful }),
        },
      };
    });
  } catch (error) {
    console.error('Error searching reviews:', error);
    throw error;
  }
}; 