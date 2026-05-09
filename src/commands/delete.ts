import { Telegraf } from "telegraf";
import { taskService } from "../services/taskService";
import { getChatId, replyHtml } from "../utils/telegram";
import { formatTaskInline } from "../utils/format";
import { getTimeZone } from "../utils/time";

export function registerDeleteCommand(bot: Telegraf) {
  bot.command("delete", async (ctx) => {
    const idText = ctx.message.text.split(" ").slice(1).join(" ").trim();
    const id = Number.parseInt(idText, 10);

    if (!idText || Number.isNaN(id)) {
      await replyHtml(ctx, "Usage: <b>/delete 3</b>");
      return;
    }

    const task = await taskService.delete(getChatId(ctx), id);
    if (!task) {
      await replyHtml(ctx, "Task not found.");
      return;
    }

    const tz = getTimeZone();
    await replyHtml(ctx, `🗑️ <b>Deleted</b>\n${formatTaskInline(task, tz)}`);
  });
}
