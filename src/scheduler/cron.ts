import cron from "node-cron";
import { Telegraf } from "telegraf";
import { taskService } from "../services/taskService";
import { chatService } from "../services/chatService";
import { formatDailySummary, formatReminderMessage, formatTaskList } from "../utils/format";
import {
  getDailySummaryTime,
  getDayRange,
  getListSummaryIntervalHours,
  getTimeZone
} from "../utils/time";
import { logger } from "../utils/logger";

export function startScheduler(bot: Telegraf) {
  const tz = getTimeZone();

  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const now = new Date();
        const dueTasks = await taskService.getDueReminders(now);

        for (const task of dueTasks) {
          try {
            await bot.telegram.sendMessage(
              task.chatId,
              formatReminderMessage(task, tz),
              { parse_mode: "HTML" }
            );
            await taskService.markReminderSent(task.id);
          } catch (err) {
            logger.error("Failed to send reminder", err);
          }
        }
      } catch (err) {
        logger.error("Reminder scheduler error", err);
      }
    },
    { timezone: tz }
  );

  const summaryTime = getDailySummaryTime();
  cron.schedule(
    `${summaryTime.minute} ${summaryTime.hour} * * *`,
    async () => {
      try {
        const chats = await chatService.listChats();
        const range = getDayRange(0, tz);

        for (const chat of chats) {
          const tasks = await taskService.listByRange(chat.id, range.start, range.end);
          const message = formatDailySummary(tasks, tz);

          await bot.telegram.sendMessage(chat.id, message, {
            parse_mode: "HTML"
          });
        }
      } catch (err) {
        logger.error("Daily summary error", err);
      }
    },
    { timezone: tz }
  );

  const listInterval = getListSummaryIntervalHours();
  if (listInterval) {
    cron.schedule(
      `0 */${listInterval} * * *`,
      async () => {
        try {
          const chats = await chatService.listChats();

          for (const chat of chats) {
            const tasks = await taskService.listPending(chat.id);
            if (tasks.length === 0) {
              continue;
            }

            const message = formatTaskList(tasks, tz, "🔔 Pending tasks");
            await bot.telegram.sendMessage(chat.id, message, {
              parse_mode: "HTML"
            });
          }
        } catch (err) {
          logger.error("Periodic list notification error", err);
        }
      },
      { timezone: tz }
    );
  }

  logger.info(`Scheduler running in ${tz}`);
}
