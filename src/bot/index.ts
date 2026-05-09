import { Telegraf } from "telegraf";
import { registerCommands } from "../commands/index";
import { logger } from "../utils/logger";

export function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }

  const bot = new Telegraf(token);

  bot.catch((err) => {
    logger.error("Bot error", err);
  });

  registerCommands(bot);
  return bot;
}
