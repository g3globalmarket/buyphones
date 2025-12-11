import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

/**
 * Seed script to create initial super admin
 *
 * This script:
 * 1. Reads SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD from .env
 * 2. If no admin users exist, creates a super_admin with those credentials
 * 3. If admin users already exist, does nothing
 *
 * Run with: pnpm migrate:seed-super-admin
 *
 * Note: This is a one-time script. Run manually after initial deployment.
 */

async function seedSuperAdmin() {
  console.log('Starting super admin seed...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const adminUsersService = app.get(AdminUsersService);

  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error(
        '❌ Error: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env',
      );
      process.exit(1);
    }

    if (password.length < 8) {
      console.error(
        '❌ Error: SUPER_ADMIN_PASSWORD must be at least 8 characters',
      );
      process.exit(1);
    }

    console.log(`Attempting to create super admin: ${email}`);

    const result = await adminUsersService.createSuperAdminIfNoneExists(
      email,
      password,
    );

    if (result) {
      console.log('✅ Super admin created successfully!');
      console.log(`   Email: ${result.email}`);
      console.log(`   Role: ${result.role}`);
    } else {
      console.log(
        'ℹ️  Admin users already exist. Skipping super admin creation.',
      );
    }
  } catch (error) {
    console.error('❌ Failed to seed super admin:', error);
    throw error;
  } finally {
    await app.close();
    console.log('Application context closed');
  }
}

// Run seed
seedSuperAdmin()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
