import dotenv from "dotenv";
import type { Review } from "../types";
import { generateEmbeddings } from "./embeddings";
import { initVectorDB, addReviews } from "./vectorDB";
import { readFileSync } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { chunkText } from "./chunking";

// Load environment variables
dotenv.config();

export const processDataset = async () => {
  try {
    console.log("Reading CSV file...");
    const csvFilePath = path.join(process.cwd(), "data", "redmi6.csv");
    const fileContent = readFileSync(csvFilePath, "utf-8");
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} records in CSV`);
    console.log("First record structure:", records[0]); // Debug: Print first record

    // Convert records to Review objects
    const reviews: Review[] = records.map((record: any, index: number) => {
      // Debug: Print raw record
      console.log("Processing record:", record);
      
      const review = {
        id: index,
        title: record["Review Title"] || "",
        text: record.Comments || "",
        rating: parseInt(record.Rating?.split(" ")[0] || "0"),
        date: record.Date || new Date().toISOString(),
        category: record.Category || "Uncategorized",
        customer: record["Customer name"] || "Anonymous",
        useful: record.Useful?.includes("helpful") || false,
      };
      
      // Debug: Print created review
      console.log("Created review:", review);
      
      return review;
    });

    // Filter out invalid reviews
    const validReviews = reviews.filter(
      (review) => review.title && review.text
    );

    console.log(`Processing ${validReviews.length} valid reviews`);

    // Log counts of useful and non-useful reviews
    const usefulReviews = validReviews.filter((r) => r.useful).length;
    const nonUsefulReviews = validReviews.filter((r) => !r.useful).length;
    console.log(`Useful reviews: ${usefulReviews}`);
    console.log(`Non-useful reviews: ${nonUsefulReviews}`);

    // Initialize vector database
    await initVectorDB();

    // Create chunks from reviews
    const chunks = validReviews.flatMap(review => 
      chunkText(
        `${review.title}\n${review.text}`,
        {
          id: review.id,
          title: review.title,
          rating: review.rating,
          date: review.date,
          category: review.category,
          useful: review.useful
        }
      )
    );

    console.log(`Created ${chunks.length} chunks from ${validReviews.length} reviews`);

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(
      chunks.map(chunk => chunk.text)
    );

    // Add chunks and embeddings to vector database
    await addReviews(chunks, embeddings);

    // Print statistics
    const totalReviews = validReviews.length;
    const avgRating =
      validReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    console.log("\nDataset Statistics:");
    console.log("------------------");
    console.log(`Total Reviews: ${totalReviews}`);
    console.log(`Useful Reviews: ${usefulReviews}`);
    console.log(`Non-useful Reviews: ${nonUsefulReviews}`);
    console.log(`Average Rating: ${avgRating.toFixed(2)}`);
    console.log(`Total Chunks: ${chunks.length}`);
    console.log("\nCategory Distribution:");
    const categoryCount = validReviews.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`${category}: ${count} reviews`);
    });

    console.log("\nProcessing completed successfully!");
  } catch (error) {
    console.error("Error processing dataset:", error);
    throw error;
  }
};

// Run the script if called directly
processDataset().catch((error) => {
  console.error("Failed to process dataset:", error);
  process.exit(1);
});
