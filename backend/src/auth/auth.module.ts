import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PermissionsGuard } from './permissions.guard';

@Global()
@Module({
    controllers: [AuthController],
    exports: [AuthService, JwtAuthGuard, JwtModule, PermissionsGuard],
    imports: [JwtModule.register({})],
    providers: [AuthService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class AuthModule {}
