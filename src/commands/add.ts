import { Telegraf, Context } from "telegraf";
import { parseReminderText } from "../ai/nlp";
import { taskService } from "../services/taskService";
import { formatTaskInline } from "../utils/format";
import { getTimeZone } from "../utils/time";
import { getChatId, replyHtml } from "../utils/telegram";
import { logger } from "../utils/logger";

export function registerAddCommand(bot: Telegraf) {
  bot.command("add", async (ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ").trim();
    if (!text) {
      await replyHtml(ctx, "Usage: <b>/add remind me tomorrow at 8am to study marketing</b>");
      return;
    }
    await handleAddText(ctx, text);
  });
}

export async function handleAddText(ctx: Context, text: string) {
  try {
    const parsed = await parseReminderText(text);
    if (!parsed || !parsed.title || !parsed.dueDate) {
      await replyHtml(ctx, "I could not understand the reminder. Try adding a clearer date and time.");
      return;
    }

    const dueDate = new Date(parsed.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      await replyHtml(ctx, "I could not parse the due date. Please try again.");
      return;
    }

    const task = await taskService.create({
      chatId: getChatId(ctx),
      title: parsed.title.trim(),
      description: parsed.description ?? undefined,
      dueDate,
      priority: parsed.priority ?? undefined
    });

    const tz = getTimeZone();
    const confirmation = [
      "✅ <b>Task added</b>",
      formatTaskInline(task, tz)
    ].join("\n");

    await replyHtml(ctx, confirmation);
  } catch (err) {
    logger.error("Failed to add task", err);
    await replyHtml(ctx, "Something went wrong while adding the task.");
  }
}
