import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

describe('ChatService', () => {
  let service: ChatService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      chatMessage: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    const mockMessages = [
      {
        id: 'msg-1',
        userId: 'user-1',
        user: { name: 'User 1', email: 'user1@example.com' },
        content: 'Hello',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'msg-2',
        userId: 'user-2',
        user: { name: 'User 2', email: 'user2@example.com' },
        content: 'Hi there',
        createdAt: new Date('2024-01-02T00:00:00Z'),
      },
    ];

    it('should return messages in reverse order (oldest first)', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue(
        [...mockMessages].reverse(),
      );

      const result = await service.getMessages();

      expect(result[0].id).toBe('msg-1');
      expect(result[1].id).toBe('msg-2');
    });

    it('should include user name or email', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([mockMessages[0]]);

      const result = await service.getMessages();

      expect(result[0].userName).toBe('User 1');
    });

    it('should use user email when name is not available', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([
        {
          ...mockMessages[0],
          user: { name: null, email: 'user1@example.com' },
        },
      ]);

      const result = await service.getMessages();

      expect(result[0].userName).toBe('user1@example.com');
    });

    it('should respect limit parameter', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([mockMessages[0]]);

      await service.getMessages(10);

      expect(prismaMock.chatMessage.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      });
    });

    it('should handle cursor for pagination', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([mockMessages[0]]);

      await service.getMessages(50, 'msg-2');

      expect(prismaMock.chatMessage.findMany).toHaveBeenCalledWith({
        take: 50,
        skip: 1,
        cursor: { id: 'msg-2' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      });
    });

    it('should return empty array when no messages', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([]);

      const result = await service.getMessages();

      expect(result).toEqual([]);
    });

    it('should format timestamp as epoch milliseconds', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([mockMessages[0]]);

      const result = await service.getMessages();

      expect(result[0].timestamp).toBe(mockMessages[0].createdAt.getTime());
    });
  });

  describe('saveMessage', () => {
    const mockUser = {
      name: 'Test User',
      email: 'test@example.com',
    };

    const mockMessage = {
      id: 'msg-new',
      userId: 'user-1',
      user: mockUser,
      content: 'New message',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    it('should create and return message with user name', async () => {
      prismaMock.chatMessage.create.mockResolvedValue(mockMessage);

      const result = await service.saveMessage('user-1', 'New message');

      expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', content: 'New message' },
        include: { user: { select: { name: true, email: true } } },
      });
      expect(result.content).toBe('New message');
      expect(result.userName).toBe('Test User');
    });

    it('should use user email as fallback when name is null', async () => {
      prismaMock.chatMessage.create.mockResolvedValue({
        ...mockMessage,
        user: { name: null, email: 'test@example.com' },
      });

      const result = await service.saveMessage('user-1', 'New message');

      expect(result.userName).toBe('test@example.com');
    });

    it('should return message with timestamp', async () => {
      prismaMock.chatMessage.create.mockResolvedValue(mockMessage);

      const result = await service.saveMessage('user-1', 'New message');

      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });
  });
});
