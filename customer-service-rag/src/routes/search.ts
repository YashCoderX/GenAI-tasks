import { Router, RequestHandler } from "express";
import { searchReviews } from "../ingestion/search";

const router = Router();

interface SearchRequestBody {
  query: string;
  limit?: number;
  searchUseful?: boolean;
}

const searchHandler: RequestHandler = async (req, res) => {
  try {
    const { query, limit, searchUseful = true } = req.body as SearchRequestBody;
    const result = await searchReviews(query, limit || 5, searchUseful);
    res.json(result);
  } catch (error) {
    console.error("Error in search route:", error);
    res.status(500).json({ error: "Failed to process search request" });
  }
};

router.post("/search", searchHandler);

export default router; 