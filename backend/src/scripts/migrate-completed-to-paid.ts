import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import {
  BuyRequest,
  BuyRequestDocument,
} from '../buy-requests/schemas/buy-request.schema';

/**
 * Migration script to convert legacy "completed" status to "paid"
 *
 * This script:
 * 1. Updates all buy requests with status "completed" to "paid"
 * 2. Updates all statusHistory entries with status "completed" to "paid"
 *
 * Run with: pnpm migrate:completed-to-paid
 */
async function migrateCompletedToPaid() {
  console.log('Starting migration: completed -> paid');

  const app = await NestFactory.createApplicationContext(AppModule);
  const buyRequestModel = app.get<Model<BuyRequestDocument>>(
    getModelToken(BuyRequest.name),
  );

  try {
    // Update documents with status "completed" to "paid"
    console.log('Updating buy requests with status "completed"...');
    const statusResult = await buyRequestModel.updateMany(
      { status: 'completed' },
      { $set: { status: 'paid' } },
    );
    console.log(
      `✅ Updated ${statusResult.modifiedCount} buy requests (status field)`,
    );

    // Update statusHistory entries with status "completed" to "paid"
    console.log('Updating statusHistory entries with status "completed"...');
    const historyResult = await buyRequestModel.updateMany(
      { 'statusHistory.status': 'completed' },
      { $set: { 'statusHistory.$[elem].status': 'paid' } },
      {
        arrayFilters: [{ 'elem.status': 'completed' }],
      },
    );
    console.log(
      `✅ Updated ${historyResult.modifiedCount} buy requests (statusHistory entries)`,
    );

    // Count remaining "completed" entries (should be 0)
    const remainingStatus = await buyRequestModel.countDocuments({
      status: 'completed',
    });
    const remainingHistory = await buyRequestModel.countDocuments({
      'statusHistory.status': 'completed',
    });

    if (remainingStatus === 0 && remainingHistory === 0) {
      console.log(
        '✅ Migration completed successfully! All "completed" statuses have been converted to "paid".',
      );
    } else {
      console.warn(
        `⚠️  Warning: Found ${remainingStatus} documents with status "completed" and ${remainingHistory} statusHistory entries with "completed".`,
      );
      console.warn(
        '   You may need to run this script again or check for edge cases.',
      );
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await app.close();
    console.log('Application context closed');
  }
}

// Run migration
migrateCompletedToPaid()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
