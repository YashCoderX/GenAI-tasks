import { QdrantClient } from "@qdrant/js-client-rest";
import { generateEmbeddings } from "./embeddings";

const REVIEWS_WITH_USEFUL = "reviews_with_useful";
const REVIEWS_WITHOUT_USEFUL = "reviews_without_useful";
const OLLAMA_API_URL = "http://localhost:11434/api/generate";

interface OllamaResponse {
  response: string;
  done: boolean;
}

interface ReviewPayloadWithUseful {
  text: string;
  metadata: {
    title: string;
    rating: number;
    date: string;
    category: string;
    useful: boolean;
  };
}

interface ReviewPayloadWithoutUseful {
  text: string;
  metadata: {
    title: string;
    rating: number;
    date: string;
    category: string;
  };
}

// Initialize Qdrant client
const client = new QdrantClient({
  url: "http://localhost:6333",
  timeout: 10000,
  checkCompatibility: false
});

// Initialize collections
async function initializeCollections() {
  try {
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

    // Create collections if they don't exist
    const collections = [
      {
        name: REVIEWS_WITH_USEFUL,
        vectors: {
          size: 768,
          distance: "Cosine" as const
        }
      },
      {
        name: REVIEWS_WITHOUT_USEFUL,
        vectors: {
          size: 768,
          distance: "Cosine" as const
        }
      }
    ];

    for (const collection of collections) {
      try {
        await client.createCollection(collection.name, collection);
        console.log(`Created collection: ${collection.name}`);
      } catch (error) {
        console.log(`Collection ${collection.name} already exists`);
      }
    }
  } catch (error) {
    console.error("Error initializing collections:", error);
  }
}

// Initialize collections when the module is loaded
initializeCollections();

export interface SearchResult {
  answer: string;
  relevantReviews: Array<{
    title: string;
    text: string;
    rating: number;
    date: string;
    category: string;
    useful?: boolean;
  }>;
}

export interface SimilarReviews {
  title: string;
  text: string;
  rating: number;
  date: string;
  category: string;
  useful?: boolean;
}

export async function findSimilarReviews(
  query: string,
  limit: number = 5,
  searchUseful: boolean = true
): Promise<SimilarReviews[]> {
  console.log("\n=== Starting findSimilarReviews function ===");
  console.log("Input parameters:", { query, limit, searchUseful });
  
  try {
    // Enhance query for better semantic search
    const enhancedQuery = query.toLowerCase().includes('battery') 
      ? `${query} battery life battery performance battery duration battery capacity`
      : query;
    
    // Generate embedding for the query
    console.log("\n[Step 1] Generating embedding for query...");
    const queryEmbedding = await generateEmbeddings([enhancedQuery]);
    console.log("Query embedding length:", queryEmbedding?.[0]?.length || 0);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error("Failed to generate query embedding");
    }

    // Search in the appropriate collection
    const collection = searchUseful ? REVIEWS_WITH_USEFUL : REVIEWS_WITHOUT_USEFUL;
    console.log("\n[Step 2] Searching in collection:", collection);
    const searchResults = await client.search(collection, {
      vector: queryEmbedding[0],
      limit: limit,
      with_payload: true,
    });
    console.log("Number of search results:", searchResults.length);
    console.log("First result score:", searchResults[0]?.score);

    // Extract relevant reviews from search results
    console.log("\n[Step 3] Processing search results...");
    const relevantReviews = searchResults.map((result) => {
      const payload = result.payload as unknown as (ReviewPayloadWithUseful | ReviewPayloadWithoutUseful);
      return {
        title: payload?.metadata?.title || "No Title",
        text: payload?.text || "",
        rating: payload?.metadata?.rating || 0,
        date: payload?.metadata?.date || new Date().toISOString(),
        category: payload?.metadata?.category || "Uncategorized",
        ...(searchUseful && { useful: (payload as ReviewPayloadWithUseful)?.metadata?.useful || false })
      };
    });
    console.log("Processed reviews count:", relevantReviews.length);

    console.log("\n=== findSimilarReviews function completed ===\n");
    return relevantReviews;
  } catch (error) {
    console.error("\n=== Error in findSimilarReviews function ===");
    console.error("Error details:", error);
    throw error;
  }
}

export async function generateAnswerFromReviews(
  query: string,
  relevantReviews: SimilarReviews[]
): Promise<SearchResult> {
  console.log("\n=== Starting generateAnswerFromReviews function ===");
  
  try {
    // Prepare context for the LLM
    console.log("\n[Step 1] Preparing context for LLM...");
    const context = relevantReviews
      .map(
        (review) =>
          `Title: ${review.title}\nReview: ${review.text}\nRating: ${review.rating}\nCategory: ${review.category}\nDate: ${review.date}${review.useful !== undefined ? `\nUseful: ${review.useful}` : ''}\n---`
      )
      .join("\n\n");
    console.log("Context length:", context.length);

    // Generate answer using Ollama Gemma
    console.log("\n[Step 2] Generating answer using Ollama Gemma...");
    const prompt = `You are a helpful assistant analyzing customer reviews about mobile phones. Your task is to answer questions based on the provided reviews.

    Question: ${query}
    
    Reviews:
    ${context}
    
    Instructions:
    1. Focus on extracting specific information related to the question
    2. If multiple phones are mentioned, compare their features
    3. Pay attention to ratings and user satisfaction
    4. If the reviews contain relevant information, provide a detailed answer
    5. If no relevant information is found, clearly state that
    
    Answer:`;
    console.log("Prompt length:", prompt.length);

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gemma3:latest",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          max_tokens: 500,
        }
      }),
    });

    if (!response.ok) {
      console.error("Ollama API error:", response.statusText);
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json() as OllamaResponse;
    const answer = data.response || "No answer generated.";
    console.log("\n[Step 3] Generated answer length:", answer);

    console.log("\n=== generateAnswerFromReviews function completed ===\n");
    return {
      answer,
      relevantReviews,
    };
  } catch (error) {
    console.error("\n=== Error in generateAnswerFromReviews function ===");
    console.error("Error details:", error);
    throw error;
  }
}

// Keep the original searchReviews function for backward compatibility
export async function searchReviews(
  query: string,
  limit: number = 5,
  searchUseful: boolean = true
): Promise<SearchResult> {
  const relevantReviews = await findSimilarReviews(query, limit, searchUseful);
  return generateAnswerFromReviews(query, relevantReviews);
}
