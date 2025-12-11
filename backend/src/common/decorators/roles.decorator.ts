import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../admin-users/schemas/admin-user.schema';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
