import { prisma } from "../db/prisma";
import { Chat } from "@prisma/client";

export const chatService = {
  upsertChat: async (chatId: string): Promise<Chat> => {
    return prisma.chat.upsert({
      where: { id: chatId },
      update: {},
      create: { id: chatId }
    });
  },

  listChats: async (): Promise<Chat[]> => {
    return prisma.chat.findMany();
  }
};
