import { Task } from "@prisma/client";
import { formatDateTime } from "./time";
import { escapeHtml } from "./parse";

const PRIORITY_EMOJI: Record<string, string> = {
  high: "🔥",
  medium: "⚡",
  low: "🌤️"
};

function getPriorityEmoji(priority?: string | null): string {
  if (!priority) {
    return "";
  }
  const key = priority.toLowerCase();
  return PRIORITY_EMOJI[key] ? ` ${PRIORITY_EMOJI[key]}` : "";
}

export function formatTaskInline(task: Task, tz: string): string {
  const title = escapeHtml(task.title);
  const dateText = formatDateTime(task.dueDate, tz);
  const priority = getPriorityEmoji(task.priority);
  return `<b>#${task.id}</b> ${title} - <i>${dateText}</i>${priority}`;
}

export function formatTaskList(tasks: Task[], tz: string, title: string): string {
  const lines = tasks.map((task) => `- ${formatTaskInline(task, tz)}`);
  return `<b>${title}</b>\n${lines.join("\n")}`;
}

export function formatReminderMessage(task: Task, tz: string): string {
  return `⏰ <b>Reminder</b>\n${formatTaskInline(task, tz)}`;
}

export function formatDailySummary(tasks: Task[], tz: string): string {
  if (tasks.length === 0) {
    return "🌙 <b>Daily summary</b>\nNo tasks for today.";
  }
  return `<b>📌 Daily summary</b>\n${tasks.map((task) => `- ${formatTaskInline(task, tz)}`).join("\n")}`;
}
