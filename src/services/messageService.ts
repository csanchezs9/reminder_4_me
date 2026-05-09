import { prisma } from "../db/prisma";
import { Message } from "@prisma/client";

const MAX_HISTORY = 20; // Keep last 20 messages per chat for context

export const messageService = {
  addMessage: async (
    chatId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<Message> => {
    return prisma.message.create({
      data: { chatId, role, content }
    });
  },

  getRecentMessages: async (
    chatId: string,
    limit: number = MAX_HISTORY
  ): Promise<Message[]> => {
    return prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      take: limit
    }).then((msgs) => msgs.reverse()); // Return in chronological order
  },

  // Cleanup old messages to keep DB small (keep only last MAX_HISTORY per chat)
  pruneOldMessages: async (chatId: string): Promise<void> => {
    const count = await prisma.message.count({ where: { chatId } });
    if (count <= MAX_HISTORY * 2) {
      return; // Only prune when we have way too many
    }

    const cutoff = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY,
      select: { id: true }
    });

    const keepIds = cutoff.map((m) => m.id);
    await prisma.message.deleteMany({
      where: {
        chatId,
        id: { notIn: keepIds }
      }
    });
  }
};
