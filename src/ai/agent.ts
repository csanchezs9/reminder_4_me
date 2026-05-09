import { getGroqClient } from "./groqClient";
import { safeJsonParse } from "../utils/parse";
import { logger } from "../utils/logger";
import { AgentResponse } from "../types/ai";
import { DateTime } from "luxon";
import { getTimeZone, formatDateTime } from "../utils/time";
import { Task, Message } from "@prisma/client";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function formatTasksForContext(tasks: Task[], tz: string): string {
  if (tasks.length === 0) {
    return "No tiene tareas pendientes.";
  }

  return tasks
    .map((t) => {
      const date = formatDateTime(t.dueDate, tz);
      const prio = t.priority ? ` [${t.priority}]` : "";
      return `  - ID #${t.id}: "${t.title}"${t.description ? ` (${t.description})` : ""} — ${date}${prio}`;
    })
    .join("\n");
}

function buildHistoryMessages(
  history: Message[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content
  }));
}

const SYSTEM_PROMPT = `Eres un asistente personal de Telegram amigable, cálido y útil. Tu nombre es Reminder4Me.
Hablas en español de manera casual y cercana (como un amigo colombiano). Usas emojis con moderación.

Tu trabajo es ayudar al usuario a gestionar sus tareas y recordatorios. Puedes:
1. Saludar y conversar amigablemente
2. Crear nuevas tareas/recordatorios
3. Eliminar tareas existentes
4. Marcar tareas como completadas
5. Listar tareas pendientes

REGLAS IMPORTANTES:
- Responde SOLO con un JSON válido, sin texto adicional, sin markdown, sin backticks.
- El JSON debe tener esta estructura exacta:
{"intent":"...", "reply":"...", "taskId":null, "title":null, "description":null, "dueDate":null, "priority":null}

Valores de intent: "greeting", "add_task", "delete_task", "complete_task", "list_tasks", "today_tasks", "chat"

INTENT GUIDELINES:
- "greeting": cuando el usuario saluda (hola, buenas, qué más, etc.). Responde con calidez y dile en qué le puedes ayudar.
- "add_task": cuando el usuario quiere crear un recordatorio o tarea. Extrae title, description, dueDate y priority.
- "delete_task": cuando el usuario quiere eliminar/quitar/borrar una tarea. Busca en las tareas pendientes cuál coincide con lo que dice. Pon el taskId de la tarea a eliminar.
- "complete_task": cuando el usuario dice que ya hizo algo o terminó una tarea. Busca en las tareas pendientes cuál coincide. Pon el taskId.
- "list_tasks": cuando el usuario pregunta qué tiene pendiente, qué tareas tiene, etc.
- "today_tasks": cuando pregunta específicamente por hoy.
- "chat": para cualquier otra conversación (gracias, chistes, preguntas generales, etc.). Responde de forma amigable y natural.

PARA delete_task y complete_task:
- Analiza las tareas pendientes del usuario que te paso como contexto.
- Busca la tarea que mejor coincida con lo que el usuario describe, incluso si usa palabras diferentes o informales.
- Ejemplos: "quita la llamada de mi cucha" → busca una tarea que tenga que ver con "llamar" a la "mamá". "ya hice lo del marketing" → busca tarea relacionada con "marketing".
- Si encuentras la tarea, pon su ID en taskId y confirma en reply.
- Si no encuentras coincidencia, pon taskId en null y pregunta al usuario cuál tarea se refiere, listando las opciones.

PARA add_task:
- dueDate debe ser ISO 8601 con timezone offset.
- Si no dice hora específica: mañana=09:00, tarde=15:00, noche=19:00, tonight=20:00.
- Si solo dice fecha sin hora, usa 09:00.
- Si no puedes inferir ninguna fecha, dueDate = null. En reply, pide que especifique cuándo.
- title debe ser corto y accionable.

PERSONALIDAD:
- Eres cercano, como un parcero/amigo
- Usas expresiones colombianas naturales pero no exageradas
- Si el usuario dice algo gracioso, puedes seguirle la corriente
- Siempre confirma las acciones realizadas de forma clara
- Tienes contexto de la conversación previa, úsalo para ser más natural`;

export async function processMessage(
  text: string,
  pendingTasks: Task[],
  chatHistory: Message[] = []
): Promise<AgentResponse> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const tz = getTimeZone();
  const now = DateTime.now().setZone(tz);
  const nowISO = now.toISO();
  const dayName = now.setLocale("es").toFormat("cccc");

  const tasksContext = formatTasksForContext(pendingTasks, tz);

  const contextMessage = [
    `[CONTEXTO DEL SISTEMA - No mostrar al usuario]`,
    `Fecha y hora actual (${tz}): ${nowISO} (${dayName})`,
    ``,
    `Tareas pendientes del usuario:`,
    tasksContext
  ].join("\n");

  // Build messages array: system prompt + context + conversation history + current message
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: contextMessage }
  ];

  // Add conversation history (last N messages)
  const historyMsgs = buildHistoryMessages(chatHistory);
  for (const msg of historyMsgs) {
    messages.push(msg);
  }

  // Add current user message
  messages.push({ role: "user", content: text });

  try {
    const client = await getGroqClient();
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      max_tokens: 500,
      messages
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = safeJsonParse<AgentResponse>(content);

    if (!parsed || !parsed.intent || !parsed.reply) {
      logger.warn("Agent returned invalid response", { content });
      return {
        intent: "chat",
        reply: "Hmm, no te entendí bien 🤔 ¿Puedes repetirlo de otra manera?"
      };
    }

    // Validate dueDate if present
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
    logger.error("Agent processing failed", err);
    return {
      intent: "chat",
      reply: "Uy, tuve un problemita procesando tu mensaje 😅 Inténtalo de nuevo."
    };
  }
}
