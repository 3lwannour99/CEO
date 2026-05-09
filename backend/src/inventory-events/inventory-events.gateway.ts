import {
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import type { InventoryUpdatedPayload } from './inventory-events.service';

@WebSocketGateway({
    namespace: '/inventory',
    cors: {
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
        credentials: true,
    },
})
export class InventoryEventsGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    private readonly logger = new Logger(InventoryEventsGateway.name);

    @WebSocketServer()
    server?: Server;

    handleConnection(@ConnectedSocket() client: Socket) {
        this.logger.log(`Inventory socket connected: ${client.id}`);
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        this.logger.log(`Inventory socket disconnected: ${client.id}`);
    }

    emitInventoryUpdated(payload: InventoryUpdatedPayload) {
        this.server?.emit('inventory.updated', payload);
        this.logger.log(
            `Emitted inventory.updated for sync ${payload.syncRunId} (${payload.status}, ${payload.totalRows} rows)`,
        );
    }
}
