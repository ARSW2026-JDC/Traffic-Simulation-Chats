import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessages(limit = 50, cursor?: string) {
    const messages = await this.prisma.chatMessage.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    return messages.reverse().map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: m.user.name || m.user.email,
      content: m.content,
      timestamp: m.createdAt.getTime(),
    }));
  }

  async saveMessage(userId: string, content: string) {
    const m = await this.prisma.chatMessage.create({
      data: { userId, content },
      include: { user: { select: { name: true, email: true } } },
    });
    return {
      id: m.id,
      userId: m.userId,
      userName: m.user.name || m.user.email,
      content: m.content,
      timestamp: m.createdAt.getTime(),
    };
  }
}
