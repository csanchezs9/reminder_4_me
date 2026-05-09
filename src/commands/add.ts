import { Telegraf, Context } from "telegraf";
import { processMessage } from "../ai/agent";
import { messageService } from "../services/messageService";
import { taskService } from "../services/taskService";
import { formatTaskInline } from "../utils/format";
import { getTimeZone } from "../utils/time";
import { getChatId, replyHtml } from "../utils/telegram";
import { logger } from "../utils/logger";

export function registerAddCommand(bot: Telegraf) {
  bot.command("add", async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!text) {
      await replyHtml(ctx, "Dime qué quieres recordar 😊\n\nEjemplo: <b>/add mañana a las 8am estudiar marketing</b>");
      return;
    }
    await handleAddText(ctx, text);
  });
}

export async function handleAddText(ctx: Context, text: string) {
  const chatId = getChatId(ctx);
  const tz = getTimeZone();
  const rememberReply = async (reply: string) => {
    await replyHtml(ctx, reply);
    await messageService.addMessage(chatId, "user", text);
    await messageService.addMessage(chatId, "assistant", reply);
    await messageService.pruneOldMessages(chatId);
  };

  try {
    const pendingTasks = await taskService.listPending(chatId);
    const chatHistory = await messageService.getRecentMessages(chatId);
    const result = await processMessage(text, pendingTasks, chatHistory);

    // If the agent detected add_task intent with valid data
    if (result.intent === "add_task" && result.title && result.dueDate) {
      const dueDate = new Date(result.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        await rememberReply(result.reply || "No pude entender la fecha 🤔 Intenta de nuevo.");
        return;
      }

      const task = await taskService.create({
        chatId,
        title: result.title.trim(),
        description: result.description ?? undefined,
        dueDate,
        priority: result.priority ?? undefined
      });

      const confirmation = [
        result.reply,
        "",
        `📌 ${formatTaskInline(task, tz)}`
      ].join("\n");

      await rememberReply(confirmation);
    } else {
      // AI couldn't fully parse — reply with whatever it said
      await rememberReply(
        result.reply || "No pude entender el recordatorio 🤔 Intenta agregar una fecha y hora más clara."
      );
    }
  } catch (err) {
    logger.error("Failed to add task", err);
    const fallback = "Algo salió mal al agregar la tarea 😅";
    await replyHtml(ctx, fallback);
    await messageService.addMessage(chatId, "user", text).catch(() => undefined);
    await messageService.addMessage(chatId, "assistant", fallback).catch(() => undefined);
  }
}
