import { config } from "dotenv";
config();

import { createBot } from "./bot/index";
import { startScheduler } from "./scheduler/cron";
import { logger } from "./utils/logger";
import { prisma } from "./db/prisma";

let bot: ReturnType<typeof createBot> | null = null;

async function main() {
  await prisma.$connect();
  bot = createBot();
  await bot.launch();
  startScheduler(bot);
  logger.info("Bot started");
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
