import { Telegraf } from "telegraf";
import { taskService } from "../services/taskService";
import { formatTaskList } from "../utils/format";
import { getDayRange, getTimeZone } from "../utils/time";
import { getChatId, replyHtml } from "../utils/telegram";

export function registerTodayCommand(bot: Telegraf) {
  bot.command("today", async (ctx) => {
    const chatId = getChatId(ctx);
    const tz = getTimeZone();
    const range = getDayRange(0, tz);
    const tasks = await taskService.listByRange(chatId, range.start, range.end);

    if (tasks.length === 0) {
      await replyHtml(ctx, "📅 No tasks due today.");
      return;
    }

    await replyHtml(ctx, formatTaskList(tasks, tz, "📅 Today"));
  });
}
