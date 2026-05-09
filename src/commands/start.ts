import { Telegraf } from "telegraf";
import { replyHtml } from "../utils/telegram";

export function registerStartCommand(bot: Telegraf) {
  bot.start(async (ctx) => {
    await replyHtml(
      ctx,
      "👋 <b>Welcome!</b>\nI can manage your tasks and reminders.\n\nTry: <b>/add remind me tomorrow at 8am to study marketing</b>"
    );
  });
}
