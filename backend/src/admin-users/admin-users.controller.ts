import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Roles('super_admin') // Only super_admin can manage admin users
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async findAll() {
    const admins = await this.adminUsersService.findAll();
    return admins.map((admin) => ({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      name: admin.name,
      createdAt: (admin as any).createdAt,
      updatedAt: (admin as any).updatedAt,
    }));
  }

  @Post()
  async create(@Body() createAdminDto: CreateAdminDto) {
    const admin = await this.adminUsersService.createAdmin(
      createAdminDto.email,
      createAdminDto.password,
      createAdminDto.role,
      createAdminDto.name,
    );

    return {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      name: admin.name,
      createdAt: (admin as any).createdAt,
      updatedAt: (admin as any).updatedAt,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    const admin = await this.adminUsersService.updateAdmin(id, updateAdminDto);

    return {
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      name: admin.name,
      createdAt: (admin as any).createdAt,
      updatedAt: (admin as any).updatedAt,
    };
  }

  @Patch(':id/password')
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.adminUsersService.changePassword(
      id,
      changePasswordDto.newPassword,
    );

    return { message: '비밀번호가 변경되었습니다.' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.adminUsersService.deleteAdmin(id);
    return { message: '관리자가 삭제되었습니다.' };
  }
}
