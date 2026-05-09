import { Context } from "telegraf";

export function getChatId(ctx: Context): string {
  const id = ctx.chat?.id ?? ctx.from?.id;
  if (id === undefined) {
    throw new Error("Chat id not available");
  }
  return String(id);
}

export function replyHtml(ctx: Context, message: string) {
  return ctx.reply(message, { parse_mode: "HTML" });
}
