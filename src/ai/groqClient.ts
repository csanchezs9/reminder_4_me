import type OpenAI from "openai";

let client: OpenAI | null = null;

export async function getGroqClient(): Promise<OpenAI> {
  if (client) {
    return client;
  }

  const { default: OpenAI } = await import("openai");
  client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "",
    baseURL: "https://api.groq.com/openai/v1"
  });

  return client;
}
