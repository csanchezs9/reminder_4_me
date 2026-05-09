import { getGroqClient } from "./groqClient";
import { logger } from "../utils/logger";

const TRANSCRIPTION_MODEL = process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo";

export async function transcribeAudio(
  audio: Buffer,
  filename = "telegram-audio.oga",
  mimeType = "audio/ogg"
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  try {
    const client = await getGroqClient();
    const { toFile } = await import("openai");
    const file = await toFile(audio, filename, { type: mimeType });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: TRANSCRIPTION_MODEL,
      language: "es",
      response_format: "json"
    });

    return transcription.text.trim();
  } catch (err) {
    logger.error("Audio transcription failed", err);
    throw err;
  }
}
