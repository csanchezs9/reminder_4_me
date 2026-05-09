import { Telegraf } from "telegraf";
import { taskService } from "../services/taskService";
import { formatTaskList } from "../utils/format";
import { getDayRange, getTimeZone } from "../utils/time";
import { getChatId, replyHtml } from "../utils/telegram";

export function registerTomorrowCommand(bot: Telegraf) {
  bot.command("tomorrow", async (ctx) => {
    const chatId = getChatId(ctx);
    const tz = getTimeZone();
    const range = getDayRange(1, tz);
    const tasks = await taskService.listByRange(chatId, range.start, range.end);

    if (tasks.length === 0) {
      await replyHtml(ctx, "📅 No tasks due tomorrow.");
      return;
    }

    await replyHtml(ctx, formatTaskList(tasks, tz, "📅 Tomorrow"));
  });
}
