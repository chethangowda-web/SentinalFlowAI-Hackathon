import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: "https://b00405ed-6f83-4b28-929a-9fffcca1ee8f.us-central1-0.gcp.cloud.qdrant.io",
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6YWVjNzJhMjUtNzU2Ny00ZWFmLWEwOGEtNmM5YmRjNTk1ZmFjIn0.u6QhVoTOApSvzgIezmt1HoLyq1W4cxXLmRAOIktg9dg",
});

async function test() {
  try {
    const collections = await client.getCollections();
    console.log("✅ Connected");
    console.log(collections);
  } catch (e) {
    console.error("❌ Failed");
    console.error(e);
  }
}

test();