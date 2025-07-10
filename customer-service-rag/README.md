# Customer Service RAG System

A React-based Customer Service System that uses RAG (Retrieval-Augmented Generation) to provide answers based on customer reviews.

## Features

- ✅ RAG Customer Service System - Complete Q&A system with document retrieval and response generation
- ✅ Embedding Model - Uses all-mpnet-base-v2 from sentence-transformers
- ✅ Dataset - Kaggle Customer Reviews dataset
- ✅ Vector Database - Qdrant for storing and searching embeddings
- ✅ Semantic Search - Cosine similarity-based retrieval
- ✅ Response Generation - Template-based responses (can be extended to use LLMs)
- ✅ User Interface - Modern Material-UI based web interface
- ✅ Source Attribution - Shows relevant reviews used for responses

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Qdrant Vector Database (running locally or accessible via URL)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd customer-service-rag
```

2. Install dependencies:
```bash
npm install
```

3. Download the Kaggle dataset:
- Visit [Kaggle Customer Reviews Dataset](https://www.kaggle.com/datasets/parve05/customer-review-dataset)
- Download the dataset and place it in the `data` directory as `customer_reviews.csv`

4. Start Qdrant:
```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

5. Process the dataset:
```bash
npm run process-dataset
```

6. Start the development server:
```bash
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Type your question in the chat interface
3. The system will:
   - Generate embeddings for your question
   - Search for similar reviews in the vector database
   - Generate a response based on the most relevant reviews
   - Display the response along with source attribution

## Project Structure

```
customer-service-rag/
├── src/
│   ├── components/
│   │   └── Chat.tsx
│   ├── services/
│   │   ├── embeddings.ts
│   │   └── vectorDB.ts
│   ├── scripts/
│   │   └── processDataset.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── data/
│   └── customer_reviews.csv
└── package.json
```

## Customization

- To use a different embedding model, modify the model name in `src/services/embeddings.ts`
- To use a different vector database, update the configuration in `src/services/vectorDB.ts`
- To implement LLM-based response generation, modify the `generateResponse` function in `src/components/Chat.tsx`

## License

MIT

how to fix this issue while processing the dataset to generate embeddings