import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing or empty in .env");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;