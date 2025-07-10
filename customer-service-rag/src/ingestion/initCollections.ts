import { QdrantClient } from "@qdrant/js-client-rest";

const REVIEWS_WITH_USEFUL = "reviews_with_useful";
const REVIEWS_WITHOUT_USEFUL = "reviews_without_useful";

// Initialize Qdrant client
const client = new QdrantClient({
  url: process.env.VITE_QDRANT_URL || "http://localhost:6333",
  timeout: 10000,
  checkCompatibility: false
});

async function initCollections() {
  console.log("Initializing Qdrant collections...");

  // Delete old collections if they exist
  const oldCollections = ["useful_reviews", "non_useful_reviews", "reviews"];
  for (const collectionName of oldCollections) {
    try {
      await client.deleteCollection(collectionName);
      console.log(`Deleted old collection: ${collectionName}`);
    } catch (error) {
      console.log(`Collection ${collectionName} not found or already deleted`);
    }
  }

  // Create reviews_with_useful collection
  try {
    await client.createCollection(REVIEWS_WITH_USEFUL, {
      vectors: {
        size: 768, // sentence-transformers/all-mpnet-base-v2 dimension
        distance: "Cosine" as const,
      },
    });
    console.log(`Created collection: ${REVIEWS_WITH_USEFUL}`);

    // Create payload index for category
    await client.createPayloadIndex(REVIEWS_WITH_USEFUL, {
      field_name: "metadata.category",
      field_schema: "keyword",
    });
    console.log(`Created category index for ${REVIEWS_WITH_USEFUL}`);
  } catch (error) {
    console.log(`Collection ${REVIEWS_WITH_USEFUL} might already exist:`, error);
  }

  // Create reviews_without_useful collection
  try {
    await client.createCollection(REVIEWS_WITHOUT_USEFUL, {
      vectors: {
        size: 768, // sentence-transformers/all-mpnet-base-v2 dimension
        distance: "Cosine" as const,
      },
    });
    console.log(`Created collection: ${REVIEWS_WITHOUT_USEFUL}`);

    // Create payload index for category
    await client.createPayloadIndex(REVIEWS_WITHOUT_USEFUL, {
      field_name: "metadata.category",
      field_schema: "keyword",
    });
    console.log(`Created category index for ${REVIEWS_WITHOUT_USEFUL}`);
  } catch (error) {
    console.log(`Collection ${REVIEWS_WITHOUT_USEFUL} might already exist:`, error);
  }

  console.log("Collection initialization completed!");
}

// Run the initialization
initCollections().catch(console.error); 