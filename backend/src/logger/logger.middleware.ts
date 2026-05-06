import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const methodColors: Record<string, string> = {
    GET: '\u001b[32m',
    POST: '\u001b[34m',
    PUT: '\u001b[33m',
    DELETE: '\u001b[31m',
};

const resetColor = '\u001b[0m';
const magenta = '\u001b[35m';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(request: Request, response: Response, next: NextFunction) {
        const color = methodColors[request.method] ?? '';
        const message = ` ${request.method} ${request.protocol}://${request.get('host')}${request.originalUrl}`;

        console.log(
            `${magenta}${this.formatDateTime()}${resetColor}`,
            `${color}${message}${resetColor}`,
        );
        next();
    }

    formatDateTime(date = new Date()): string {
        return `[${date.toISOString().replace('T', ' ').split('.')[0]}]`;
    }
}
