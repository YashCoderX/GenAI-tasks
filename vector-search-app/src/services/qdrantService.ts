import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({ url: 'http://localhost:6333' });

type Point = {
  id: number;
  vector: number[];
  payload?: Record<string, unknown>;
};

export const createCollection = async (collectionName: string) => {
  try {
    await client.createCollection(collectionName, {
      vectors: {
        size: 384, // Using a common embedding size
        distance: 'Cosine',
      },
    });
    console.log(`Collection ${collectionName} created successfully`);
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

export const insertVectors = async (collectionName: string, points: Point[]) => {
  try {
    await client.upsert(collectionName, {
      points: points,
    });
    console.log('Vectors inserted successfully');
  } catch (error) {
    console.error('Error inserting vectors:', error);
    throw error;
  }
};

export const searchVectors = async (collectionName: string, vector: number[], limit: number = 5) => {
  try {
    const searchResult = await client.search(collectionName, {
      vector: vector,
      limit: limit,
    });
    return searchResult;
  } catch (error) {
    console.error('Error searching vectors:', error);
    throw error;
  }
}; 