import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for admin JWT authentication
 * Uses the 'admin-jwt' strategy to validate admin tokens
 * This is separate from user JWT authentication
 */
@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('admin-jwt') {}
