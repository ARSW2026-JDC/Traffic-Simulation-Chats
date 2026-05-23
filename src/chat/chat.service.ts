import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  messagesSavedTotal,
  messagesRetrievedTotal,
  dbQueryDurationSeconds,
} from '../metrics';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getMessages(limit = 50, cursor?: string) {
    const start = Date.now();
    const messages = await this.prisma.chatMessage.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firebaseUid: true, name: true, email: true } } },
    });
    dbQueryDurationSeconds.observe(
      { operation: 'findMany' },
      (Date.now() - start) / 1000,
    );
    messagesRetrievedTotal.inc(messages.length);
    return messages.reverse().map((m) => ({
      id: m.id,
      userId: m.user.firebaseUid,
      userName: m.user.name || m.user.email,
      content: m.content,
      timestamp: m.createdAt.getTime(),
    }));
  }

  async saveMessage(userId: string, content: string) {
    const start = Date.now();
    const m = await this.prisma.chatMessage.create({
      data: { userId, content },
      include: { user: { select: { firebaseUid: true, name: true, email: true } } },
    });
    dbQueryDurationSeconds.observe(
      { operation: 'create' },
      (Date.now() - start) / 1000,
    );
    messagesSavedTotal.inc();
    return {
      id: m.id,
      userId: m.user.firebaseUid,
      userName: m.user.name || m.user.email,
      content: m.content,
      timestamp: m.createdAt.getTime(),
    };
  }
}
