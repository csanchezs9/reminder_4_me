import { Telegraf } from "telegraf";
import { replyHtml } from "../utils/telegram";

export function registerHelpCommand(bot: Telegraf) {
  bot.command("help", async (ctx) => {
    const message = [
      "<b>Commands</b>",
      "/start - Start the bot",
      "/help - Show this help",
      "/tasks - List pending tasks",
      "/add <text> - Add a reminder",
      "/done <id> - Mark task as done",
      "/delete <id> - Delete a task",
      "/today - Tasks due today",
      "/tomorrow - Tasks due tomorrow",
      "",
      "<b>Examples</b>",
      "remind me tomorrow at 8am to study marketing",
      "call Luisa in 2 hours",
      "buy groceries tonight"
    ].join("\n");

    await replyHtml(ctx, message);
  });
}
