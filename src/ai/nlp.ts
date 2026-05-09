import { getGroqClient } from "./groqClient";
import { safeJsonParse } from "../utils/parse";
import { logger } from "../utils/logger";
import { ParsedReminder } from "../types/ai";
import { DateTime } from "luxon";
import { getTimeZone } from "../utils/time";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function parseReminderText(text: string): Promise<ParsedReminder | null> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const tz = getTimeZone();
  const now = DateTime.now().setZone(tz).toISO();
  const systemPrompt = [
    "You extract reminder details from user text.",
    "Return ONLY a JSON object with keys: title, description, dueDate, priority.",
    "Rules:",
    "- dueDate must be ISO 8601 with timezone offset.",
    "- Use the user's timezone: " + tz + ".",
    "- If no time is provided, choose a reasonable default:",
    "  morning=09:00, afternoon=15:00, evening=19:00, tonight=20:00.",
    "- If only a date is provided, use 09:00.",
    "- If you cannot infer any date, set dueDate to null.",
    "- Keep title short and actionable.",
    "- priority should be high, medium, low, or null."
  ].join("\n");

  const userPrompt = `Now (${tz}): ${now}\nText: ${text}`;

  try {
    const client = await getGroqClient();
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = safeJsonParse<ParsedReminder>(content);
    if (!parsed || !parsed.title) {
      return null;
    }

    if (parsed.dueDate) {
      const dt = DateTime.fromISO(parsed.dueDate, { setZone: true });
      if (!dt.isValid) {
        parsed.dueDate = null;
      } else {
        parsed.dueDate = dt.toISO();
      }
    }

    return parsed;
  } catch (err) {
    logger.error("Groq parsing failed", err);
    return null;
  }
}
