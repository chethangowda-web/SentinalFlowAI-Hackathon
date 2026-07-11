import "dotenv/config";

console.log({
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  QDRANT_URL: process.env.QDRANT_URL,
  QDRANT_API_KEY: process.env.QDRANT_API_KEY,
  QDRANT_COLLECTION: process.env.QDRANT_COLLECTION,
});