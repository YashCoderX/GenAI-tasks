import { QdrantClient } from "@qdrant/js-client-rest";

async function cleanupCollections() {
  const client = new QdrantClient({
    url: process.env.VITE_QDRANT_URL || "http://localhost:6333",
    timeout: 10000,
    checkCompatibility: false
  });

  try {
    // List all collections
    const collections = await client.getCollections();
    console.log("Current collections:", collections);

    // Delete old collections if they exist
    const oldCollections = ["useful_reviews", "non_useful_reviews", "reviews"];
    for (const collectionName of oldCollections) {
      try {
        await client.deleteCollection(collectionName);
        console.log(`Successfully deleted collection: ${collectionName}`);
      } catch (error) {
        console.log(`Collection ${collectionName} not found or already deleted`);
      }
    }

    // Create new collections if they don't exist
    const newCollections = [
      {
        name: "reviews_with_useful",
        vectors: {
          size: 1536,
          distance: "Cosine" as const
        }
      },
      {
        name: "reviews_without_useful",
        vectors: {
          size: 1536,
          distance: "Cosine" as const
        }
      }
    ];

    for (const collection of newCollections) {
      try {
        await client.createCollection(collection.name, collection);
        console.log(`Successfully created collection: ${collection.name}`);
      } catch (error) {
        console.log(`Collection ${collection.name} already exists`);
      }
    }

  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

cleanupCollections(); 