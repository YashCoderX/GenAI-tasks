export interface Chunk {
  text: string;
  metadata: {
    id: number;
    title: string;
    rating: number;
    date: string;
    category: string;
    useful: boolean;
  };
}

export const chunkText = (
  text: string,
  metadata: Chunk["metadata"],
  maxTokens: number = 500,
  overlap: number = 50
): Chunk[] => {
  // Split text into sentences
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentTokenCount = 0;

  for (const sentence of sentences) {
    // Rough estimate of tokens (words)
    const sentenceTokens = sentence.split(/\s+/).length;

    if (currentTokenCount + sentenceTokens > maxTokens) {
      // Save current chunk
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join(". "),
          metadata,
        });
      }

      // Start new chunk with overlap
      const overlapSentences = currentChunk.slice(-overlap);
      currentChunk = overlapSentences;
      currentTokenCount = overlapSentences.reduce(
        (count, s) => count + s.split(/\s+/).length,
        0
      );
    }

    currentChunk.push(sentence);
    currentTokenCount += sentenceTokens;
  }

  // Add the last chunk if it exists
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join(". "),
      metadata,
    });
  }

  return chunks;
}; 