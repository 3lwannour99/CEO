import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @RequirePermissions('users.view')
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @RequirePermissions('users.view')
    @Get('roles')
    findRoles() {
        return this.usersService.findRoles();
    }

    @RequirePermissions('users.view')
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @RequirePermissions('users.manage')
    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @RequirePermissions('users.manage')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @RequirePermissions('users.manage')
    @Patch(':id/password')
    updatePassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto) {
        return this.usersService.updatePassword(id, dto);
    }

    @RequirePermissions('users.manage')
    @Patch(':id/roles')
    updateRoles(@Param('id') id: string, @Body() dto: UpdateUserRolesDto) {
        return this.usersService.updateRoles(id, dto);
    }

    @RequirePermissions('users.manage')
    @Get(':id/permissions')
    findPermissions(@Param('id') id: string) {
        return this.usersService.findPermissions(id);
    }

    @RequirePermissions('users.manage')
    @Patch(':id/permissions')
    updatePermissions(
        @Param('id') id: string,
        @Body() dto: UpdateUserPermissionsDto,
    ) {
        return this.usersService.updatePermissions(id, dto);
    }

    @RequirePermissions('users.manage')
    @Patch(':id/active')
    updateActive(@Param('id') id: string, @Body() dto: UpdateUserActiveDto) {
        return this.usersService.updateActive(id, dto);
    }
}
