import { config } from "dotenv";
config();

import { createBot } from "./bot/index";
import { startScheduler } from "./scheduler/cron";
import { logger } from "./utils/logger";
import { prisma } from "./db/prisma";

let bot: ReturnType<typeof createBot> | null = null;

async function main() {
  logger.info("Connecting to database...");
  await prisma.$connect();
  logger.info("Database connected");
  bot = createBot();
  logger.info("Launching Telegram bot...");
  // In Telegraf 4.x, launch() starts polling and the returned promise
  // only resolves when the bot stops. We fire-and-forget it.
  bot.launch({ dropPendingUpdates: true });
  startScheduler(bot);
  logger.info("Bot started successfully ✅");
}

main().catch((err) => {
  logger.error("Startup failed", err);
  process.exit(1);
});

process.once("SIGINT", () => {
  if (bot) {
    bot.stop("SIGINT");
  }
  prisma.$disconnect().catch(() => undefined);
});

process.once("SIGTERM", () => {
  if (bot) {
    bot.stop("SIGTERM");
  }
  prisma.$disconnect().catch(() => undefined);
});
