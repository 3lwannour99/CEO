import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import colors from 'colors';
colors.enable();

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(request: Request, response: Response, next: NextFunction) {
        const methodColors: Partial<Record<any, string>> = {
            GET: 'green',
            POST: 'blue',
            PUT: 'yellow',
            DELETE: 'red',
        };

        const method = request.method;

        const color = methodColors[method] ?? 'white';

        const message: any = ` ${request.method} ${
            request.protocol
        }://${request.get('host')}${request.originalUrl}`;

        console.log(this.formatDateTime(), message[color]);
        next();
    }

    formatDateTime = (date = new Date()): string => {
        return `[${date.toISOString().replace('T', ' ').split('.')[0]}]`[
            'magenta'
        ];
    };
}
