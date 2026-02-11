import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'ws';
import { IncomingMessage } from 'http';
import { env } from '../config/env';

type WebSocketClient = WebSocket & { userId?: string | null; userEmail?: string | null; send: (data: string) => void; readyState: number; close: (code?: number, reason?: string) => void };

@WebSocketGateway({ path: '/ws' })
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: WebSocketClient, request?: IncomingMessage) {
    const url = new URL(request?.url ?? '', `http://${request?.headers?.host ?? 'localhost'}`);
    const token =
      url.searchParams.get('token') ??
      (request?.headers?.['sec-websocket-protocol'] as string)?.replace('Bearer ', '');
    const allowAnonymous = env.nodeEnv === 'development' && process.env.WS_ALLOW_ANONYMOUS === 'true';

    if (!token && !allowAnonymous) {
      client.close(4001, 'Missing auth token');
      return;
    }

    if (token) {
      try {
        const decoded = this.jwtService.verify<{ sub: string; email?: string }>(token, {
          secret: env.sessionSecret,
        });
        client.userId = decoded.sub;
        client.userEmail = decoded.email;
        client.send(JSON.stringify({ type: 'connected', userId: decoded.sub, email: decoded.email }));
      } catch {
        client.close(4002, 'Invalid or expired token');
        return;
      }
    } else {
      client.userId = null;
      client.userEmail = null;
      client.send(JSON.stringify({ type: 'connected', message: 'Anonymous (dev only)' }));
    }
  }

  handleDisconnect(_client: WebSocket) {}

  @SubscribeMessage('message')
  handleMessage(
    client: WebSocketClient,
    payload: unknown,
  ): { type: string; from: string; payload: unknown } {
    const from = client.userEmail ?? 'anonymous';
    this.server.clients.forEach((c) => {
      if (c.readyState === 1) {
        c.send(JSON.stringify({ type: 'message', from, payload }));
      }
    });
    return { type: 'message', from, payload };
  }
}
