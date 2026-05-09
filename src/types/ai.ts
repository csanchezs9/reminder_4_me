export interface ParsedReminder {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: string | null;
}

export interface AgentResponse {
  intent:
    | "greeting"
    | "add_task"
    | "delete_task"
    | "complete_task"
    | "list_tasks"
    | "today_tasks"
    | "chat";
  reply: string;
  taskId?: number | null;
  title?: string | null;
  description?: string | null;
  dueDate?: string | null;
  priority?: string | null;
}
