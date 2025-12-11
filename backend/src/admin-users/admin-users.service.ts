import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  AdminUser,
  AdminUserDocument,
  AdminRole,
} from './schemas/admin-user.schema';

@Injectable()
export class AdminUsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectModel(AdminUser.name)
    private adminUserModel: Model<AdminUserDocument>,
  ) {}

  async findByEmail(email: string): Promise<AdminUserDocument | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.adminUserModel.findOne({ email: normalizedEmail }).exec();
  }

  async findById(id: string): Promise<AdminUserDocument | null> {
    return this.adminUserModel.findById(id).exec();
  }

  async findAll(): Promise<AdminUserDocument[]> {
    return this.adminUserModel
      .find()
      .select('-passwordHash') // Exclude password hash from results
      .exec();
  }

  async createSuperAdminIfNoneExists(
    email: string,
    password: string,
    name?: string,
  ): Promise<AdminUserDocument | null> {
    // Check if any admin users exist
    const existingCount = await this.adminUserModel.countDocuments().exec();
    if (existingCount > 0) {
      return null; // Admins already exist, do nothing
    }

    // Create super admin
    return this.createAdmin(email, password, 'super_admin', name);
  }

  async createAdmin(
    email: string,
    password: string,
    role: AdminRole = 'admin',
    name?: string,
  ): Promise<AdminUserDocument> {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('이미 존재하는 관리자 이메일입니다.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create admin user
    const adminUser = new this.adminUserModel({
      email: normalizedEmail,
      passwordHash,
      role,
      name,
    });

    return adminUser.save();
  }

  async updateAdmin(
    id: string,
    updates: {
      role?: AdminRole;
      name?: string;
    },
  ): Promise<AdminUserDocument> {
    const adminUser = await this.findById(id);
    if (!adminUser) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }

    // If changing role, ensure at least one super_admin remains
    if (updates.role !== undefined && updates.role !== adminUser.role) {
      if (adminUser.role === 'super_admin' && updates.role === 'admin') {
        // Check if this is the only super_admin
        const superAdminCount = await this.adminUserModel
          .countDocuments({ role: 'super_admin' })
          .exec();
        if (superAdminCount <= 1) {
          throw new BadRequestException(
            '최소 한 명의 슈퍼 관리자가 필요합니다.',
          );
        }
      }
    }

    // Update fields
    if (updates.role !== undefined) {
      adminUser.role = updates.role;
    }
    if (updates.name !== undefined) {
      adminUser.name = updates.name;
    }

    return adminUser.save();
  }

  async changePassword(
    id: string,
    newPassword: string,
  ): Promise<AdminUserDocument> {
    const adminUser = await this.findById(id);
    if (!adminUser) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    adminUser.passwordHash = passwordHash;

    return adminUser.save();
  }

  async deleteAdmin(id: string): Promise<void> {
    const adminUser = await this.findById(id);
    if (!adminUser) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }

    // Prevent deleting the only super_admin
    if (adminUser.role === 'super_admin') {
      const superAdminCount = await this.adminUserModel
        .countDocuments({ role: 'super_admin' })
        .exec();
      if (superAdminCount <= 1) {
        throw new BadRequestException(
          '최소 한 명의 슈퍼 관리자가 필요합니다. 마지막 슈퍼 관리자는 삭제할 수 없습니다.',
        );
      }
    }

    await this.adminUserModel.deleteOne({ _id: id }).exec();
  }

  async verifyPassword(
    adminUser: AdminUserDocument,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, adminUser.passwordHash);
  }
}
