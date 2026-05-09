import { Telegraf } from "telegraf";
import { registerStartCommand } from "./start";
import { registerHelpCommand } from "./help";
import { registerTasksCommand } from "./tasks";
import { registerAddCommand, handleAddText } from "./add";
import { registerDeleteCommand } from "./delete";
import { registerDoneCommand } from "./done";
import { registerTodayCommand } from "./today";
import { registerTomorrowCommand } from "./tomorrow";
import { chatService } from "../services/chatService";

export function registerCommands(bot: Telegraf) {
  bot.use(async (ctx, next) => {
    if (ctx.chat?.id !== undefined) {
      await chatService.upsertChat(String(ctx.chat.id));
    }
    return next();
  });

  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerTasksCommand(bot);
  registerAddCommand(bot);
  registerDeleteCommand(bot);
  registerDoneCommand(bot);
  registerTodayCommand(bot);
  registerTomorrowCommand(bot);

  bot.on("text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) {
      return;
    }
    await handleAddText(ctx, text);
  });

  void bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Show help" },
    { command: "tasks", description: "List all pending tasks" },
    { command: "add", description: "Add a task using natural language" },
    { command: "delete", description: "Delete a task by id" },
    { command: "done", description: "Mark a task as done" },
    { command: "today", description: "Tasks due today" },
    { command: "tomorrow", description: "Tasks due tomorrow" }
  ]);
}
