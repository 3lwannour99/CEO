import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    controllers: [UsersController],
    exports: [UsersService],
    imports: [AuthModule],
    providers: [UsersService],
})
export class UsersModule {}
