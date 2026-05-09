import { Telegraf } from "telegraf";
import { replyHtml } from "../utils/telegram";

export function registerStartCommand(bot: Telegraf) {
  bot.start(async (ctx) => {
    const name = ctx.from?.first_name || "amigo";
    await replyHtml(
      ctx,
      [
        `👋 ¡Hola <b>${name}</b>! Soy <b>Reminder4Me</b>, tu asistente personal.`,
        "",
        "Puedo ayudarte a organizar tu vida. Solo escríbeme como si hablaras con un amigo:",
        "",
        '💬 <i>"Recuérdame mañana a las 8am estudiar marketing"</i>',
        '💬 <i>"Qué tengo pendiente?"</i>',
        '💬 <i>"Ya hice lo de la tarea"</i>',
        "",
        "También puedes usar /help para ver todos los comandos 😊"
      ].join("\n")
    );
  });
}
