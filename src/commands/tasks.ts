import { Telegraf } from "telegraf";
import { taskService } from "../services/taskService";
import { formatTaskList } from "../utils/format";
import { getTimeZone } from "../utils/time";
import { getChatId, replyHtml } from "../utils/telegram";

export function registerTasksCommand(bot: Telegraf) {
  bot.command("tasks", async (ctx) => {
    const chatId = getChatId(ctx);
    const tasks = await taskService.listPending(chatId);
    const tz = getTimeZone();

    if (tasks.length === 0) {
      await replyHtml(ctx, "🎉 No pending tasks.");
      return;
    }

    await replyHtml(ctx, formatTaskList(tasks, tz, "📋 Your tasks"));
  });
}
