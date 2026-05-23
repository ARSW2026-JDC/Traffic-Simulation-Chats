import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as admin from 'firebase-admin';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { getFirebaseAdmin } from '../auth/firebase-admin.provider';
import {
  wsConnectionsActive,
  wsConnectionsTotal,
  wsDisconnectionsTotal,
  wsConnectionErrorsTotal,
  messagesSentTotal,
} from '../metrics';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const handleSocketError = (err: Error) => {
      wsConnectionErrorsTotal.inc({ reason: 'socket_error' });
      this.logger.error(`Socket error: ${err.message}`);
      if (!client.disconnected) {
        client.disconnect();
      }
    };

    client.on('error', handleSocketError);

    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);

      if (!token) {
        wsConnectionErrorsTotal.inc({ reason: 'no_token' });
        client.disconnect();
        return;
      }

      const firebaseApp = getFirebaseAdmin();
      if (!firebaseApp) {
        wsConnectionErrorsTotal.inc({ reason: 'no_firebase' });
        client.disconnect();
        return;
      }

      const decoded = await admin.auth(firebaseApp).verifyIdToken(token);
      let user = await this.prisma.user.findUnique({
        where: { firebaseUid: decoded.uid },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            firebaseUid: decoded.uid,
            email: decoded.email || null,
            name: decoded.name || null,
            avatarUrl: decoded.picture || null,
            role: decoded.email ? 'USER' : 'GUEST',
          },
        });
      }

      // Solo BLOCKED impide conexión
      if (user.estatus === 'BLOCKED') {
        wsConnectionErrorsTotal.inc({ reason: 'blocked' });
        client.disconnect();
        return;
      }
      // Cambiar estatus a ACTIVE al conectar (no bloquear handshake)
      if (user.estatus !== 'ACTIVE') {
        this.prisma.user
          .update({ where: { id: user.id }, data: { estatus: 'ACTIVE' } })
          .catch((e) => this.logger.warn(`Failed to set ACTIVE status: ${e?.message || e}`));
      }

      client.data.userId = user.id;
      client.data.userName = user.name || user.email;
      client.data.role = user.role;

      wsConnectionsTotal.inc();
      wsConnectionsActive.inc();
    } catch (err) {
      wsConnectionErrorsTotal.inc({ reason: 'auth_error' });
      this.logger.error(`Connection error: ${err?.message || 'unknown'}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    // Cambiar estatus a INACTIVE al desconectar solo si no está bloqueado
    wsDisconnectionsTotal.inc();
    wsConnectionsActive.dec();
    if (client.data?.userId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: client.data.userId },
        });
        if (user && user.estatus !== 'BLOCKED') {
          // Fire-and-forget: don't block disconnect processing on DB
          this.prisma.user
            .update({ where: { id: client.data.userId }, data: { estatus: 'INACTIVE' } })
            .catch((e) => this.logger.warn(`Failed to set INACTIVE status: ${e?.message || e}`));
        }
      } catch (err) {
        this.logger.warn(`Disconnect error: ${err?.message || 'unknown'}`);
      }
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string; clientId?: string },
  ) {
    if (!client.data.userId || !data?.content?.trim()) return;

    const user = await this.prisma.user.findUnique({
      where: { id: client.data.userId },
      select: { role: true },
    });

    if (user?.role === 'GUEST') {
      client.emit('error', { message: 'Los usuarios invitados no pueden escribir en el chat' });
      return;
    }

    const msg = await this.chatService.saveMessage(
      client.data.userId,
      data.content.trim(),
    );
    messagesSentTotal.inc({ role: user?.role || 'unknown' });
    client.emit('message:new', { ...msg, clientId: data.clientId });
    this.server.emit('message:new', { ...msg });
  }
}
