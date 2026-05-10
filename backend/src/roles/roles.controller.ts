import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleActiveDto } from './dto/update-role-active.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @RequirePermissions('roles.view')
    @Get()
    findAll() {
        return this.rolesService.findAll();
    }

    @RequirePermissions('roles.view')
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }

    @RequirePermissions('roles.manage')
    @Post()
    create(@Body() dto: CreateRoleDto) {
        return this.rolesService.create(dto);
    }

    @RequirePermissions('roles.manage')
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.rolesService.update(id, dto);
    }

    @RequirePermissions('roles.editPermissions')
    @Patch(':id/permissions')
    updatePermissions(
        @Param('id') id: string,
        @Body() dto: UpdateRolePermissionsDto,
    ) {
        return this.rolesService.updatePermissions(id, dto);
    }

    @RequirePermissions('roles.manage')
    @Patch(':id/active')
    updateActive(@Param('id') id: string, @Body() dto: UpdateRoleActiveDto) {
        return this.rolesService.updateActive(id, dto);
    }

    @RequirePermissions('roles.manage')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rolesService.remove(id);
    }
}
