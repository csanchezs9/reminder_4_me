import { Telegraf } from "telegraf";
import { replyHtml } from "../utils/telegram";

export function registerHelpCommand(bot: Telegraf) {
  bot.command("help", async (ctx) => {
    const message = [
      "🤖 <b>¿Qué puedo hacer?</b>",
      "",
      "Puedes hablarme de forma natural y yo entiendo. Pero si prefieres, también tengo comandos:",
      "",
      "<b>📝 Comandos</b>",
      "/add <i>texto</i> - Agregar un recordatorio",
      "/tasks - Ver tareas pendientes",
      "/today - Tareas de hoy",
      "/tomorrow - Tareas de mañana",
      "/done <i>id</i> - Marcar como completada",
      "/delete <i>id</i> - Eliminar una tarea",
      "",
      "<b>💬 Ejemplos naturales</b>",
      '<i>"Recuérdame mañana a las 3pm llamar al doctor"</i>',
      '<i>"Qué tengo para hoy?"</i>',
      '<i>"Ya terminé lo del proyecto"</i>',
      '<i>"Quita la tarea de estudiar"</i>',
      "",
      "¡Solo escríbeme y yo me encargo! 😊"
    ].join("\n");

    await replyHtml(ctx, message);
  });
}
