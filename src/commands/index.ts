import { Telegraf } from "telegraf";
import { registerStartCommand } from "./start";
import { registerHelpCommand } from "./help";
import { registerTasksCommand } from "./tasks";
import { registerAddCommand } from "./add";
import { registerDeleteCommand } from "./delete";
import { registerDoneCommand } from "./done";
import { registerTodayCommand } from "./today";
import { registerTomorrowCommand } from "./tomorrow";
import { chatService } from "../services/chatService";
import { messageService } from "../services/messageService";
import { taskService } from "../services/taskService";
import { processMessage } from "../ai/agent";
import { getChatId, replyHtml } from "../utils/telegram";
import { formatTaskInline, formatTaskList } from "../utils/format";
import { getDayRange, getTimeZone } from "../utils/time";
import { logger } from "../utils/logger";

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

  // Smart catch-all: every non-command text goes through the AI agent
  bot.on("text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) {
      return;
    }

    const chatId = getChatId(ctx);
    const tz = getTimeZone();
    const rememberReply = async (reply: string) => {
      await replyHtml(ctx, reply);
      await messageService.addMessage(chatId, "user", text);
      await messageService.addMessage(chatId, "assistant", reply);
      await messageService.pruneOldMessages(chatId);
    };

    try {
      // Load pending tasks so the AI has context
      const pendingTasks = await taskService.listPending(chatId);
      const chatHistory = await messageService.getRecentMessages(chatId);

      // Ask the AI agent to classify intent and generate reply
      const result = await processMessage(text, pendingTasks, chatHistory);

      switch (result.intent) {
        case "add_task": {
          if (!result.title || !result.dueDate) {
            // AI couldn't extract full info — just reply with its message
            await rememberReply(result.reply);
            return;
          }

          const dueDate = new Date(result.dueDate);
          if (Number.isNaN(dueDate.getTime())) {
            await rememberReply(result.reply);
            return;
          }

          const task = await taskService.create({
            chatId,
            title: result.title.trim(),
            description: result.description ?? undefined,
            dueDate,
            priority: result.priority ?? undefined
          });

          const confirmation = [
            result.reply,
            "",
            `📌 ${formatTaskInline(task, tz)}`
          ].join("\n");

          await rememberReply(confirmation);
          break;
        }

        case "delete_task": {
          if (result.taskId) {
            const task = await taskService.delete(chatId, result.taskId);
            if (task) {
              const msg = [
                result.reply,
                "",
                `🗑️ ${formatTaskInline(task, tz)}`
              ].join("\n");
              await rememberReply(msg);
            } else {
              await rememberReply("No encontré esa tarea 🤔 ¿Puedes ser más específico?");
            }
          } else {
            await rememberReply(result.reply);
          }
          break;
        }

        case "complete_task": {
          if (result.taskId) {
            const task = await taskService.markDone(chatId, result.taskId);
            if (task) {
              const msg = [
                result.reply,
                "",
                `✅ ${formatTaskInline(task, tz)}`
              ].join("\n");
              await rememberReply(msg);
            } else {
              await rememberReply("No encontré esa tarea 🤔 ¿Puedes ser más específico?");
            }
          } else {
            await rememberReply(result.reply);
          }
          break;
        }

        case "list_tasks": {
          if (pendingTasks.length === 0) {
            await rememberReply(result.reply);
          } else {
            const list = formatTaskList(pendingTasks, tz, "📋 Tus tareas pendientes");
            const msg = [result.reply, "", list].join("\n");
            await rememberReply(msg);
          }
          break;
        }

        case "today_tasks": {
          const range = getDayRange(0, tz);
          const todayTasks = await taskService.listByRange(chatId, range.start, range.end);
          if (todayTasks.length === 0) {
            await rememberReply(result.reply);
          } else {
            const list = formatTaskList(todayTasks, tz, "📅 Hoy");
            const msg = [result.reply, "", list].join("\n");
            await rememberReply(msg);
          }
          break;
        }

        case "greeting":
        case "chat":
        default: {
          await rememberReply(result.reply);
          break;
        }
      }
    } catch (err) {
      logger.error("Agent handler error", err);
      const fallback = "Uy, algo salió mal 😅 Inténtalo de nuevo.";
      await replyHtml(ctx, fallback);
      await messageService.addMessage(chatId, "user", text).catch(() => undefined);
      await messageService.addMessage(chatId, "assistant", fallback).catch(() => undefined);
    }
  });

  void bot.telegram.setMyCommands([
    { command: "start", description: "Iniciar el bot" },
    { command: "help", description: "Mostrar ayuda" },
    { command: "tasks", description: "Listar tareas pendientes" },
    { command: "add", description: "Agregar tarea con lenguaje natural" },
    { command: "delete", description: "Eliminar una tarea por ID" },
    { command: "done", description: "Marcar tarea como completada" },
    { command: "today", description: "Tareas de hoy" },
    { command: "tomorrow", description: "Tareas de mañana" }
  ]);
}
