import { prisma } from "../db/prisma";
import { Task } from "@prisma/client";

export const taskService = {
  create: async (data: {
    chatId: string;
    title: string;
    description?: string;
    dueDate: Date;
    priority?: string;
  }): Promise<Task> => {
    return prisma.task.create({ data });
  },

  listPending: async (chatId: string): Promise<Task[]> => {
    return prisma.task.findMany({
      where: { chatId, completed: false },
      orderBy: { dueDate: "asc" }
    });
  },

  listByRange: async (chatId: string, start: Date, end: Date): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        chatId,
        completed: false,
        dueDate: { gte: start, lte: end }
      },
      orderBy: { dueDate: "asc" }
    });
  },

  listByRangeAllChats: async (start: Date, end: Date): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        completed: false,
        dueDate: { gte: start, lte: end }
      },
      orderBy: { dueDate: "asc" }
    });
  },

  getDueReminders: async (now: Date): Promise<Task[]> => {
    return prisma.task.findMany({
      where: {
        completed: false,
        reminderSent: false,
        dueDate: { lte: now }
      },
      orderBy: { dueDate: "asc" }
    });
  },

  markReminderSent: async (id: number): Promise<Task> => {
    return prisma.task.update({
      where: { id },
      data: { reminderSent: true }
    });
  },

  markDone: async (chatId: string, id: number): Promise<Task | null> => {
    const existing = await prisma.task.findFirst({ where: { id, chatId } });
    if (!existing) {
      return null;
    }
    return prisma.task.update({ where: { id }, data: { completed: true } });
  },

  delete: async (chatId: string, id: number): Promise<Task | null> => {
    const existing = await prisma.task.findFirst({ where: { id, chatId } });
    if (!existing) {
      return null;
    }
    await prisma.task.delete({ where: { id } });
    return existing;
  },

  searchByKeyword: async (chatId: string, keyword: string): Promise<Task[]> => {
    const lower = keyword.toLowerCase();
    const all = await prisma.task.findMany({
      where: { chatId, completed: false },
      orderBy: { dueDate: "asc" }
    });
    return all.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) ||
        (t.description && t.description.toLowerCase().includes(lower))
    );
  }
};
