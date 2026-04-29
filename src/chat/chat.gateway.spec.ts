import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { Server } from 'socket.io';
import { jest, describe, it, beforeEach } from '@jest/globals';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let prismaMock: any;
  let chatServiceMock: any;
  let serverMock: Partial<Server>;

  beforeEach(async () => {
    prismaMock = { user: { findUnique: jest.fn() } };
    chatServiceMock = { saveMessage: jest.fn() };
    serverMock = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: chatServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    // attach server
    (gateway as any).server = serverMock as Server;
  });

  it('should reject GUEST users from sending messages', async () => {
    const socket: any = { data: { userId: 'u1' }, emit: jest.fn() };
    prismaMock.user.findUnique.mockResolvedValue({ role: 'GUEST' });

    await gateway['handleMessage'](socket, { content: 'hi' });
  });

  it('should save and broadcast message for non-guest', async () => {
    const socket: any = { data: { userId: 'u1' }, emit: jest.fn() };
    prismaMock.user.findUnique.mockResolvedValue({ role: 'USER' });
    const saved = { id: 'm1', content: 'hi', userId: 'u1' };
    chatServiceMock.saveMessage.mockResolvedValue(saved);

    await gateway['handleMessage'](socket, { content: 'hi', clientId: 'c1' });

  });
});
