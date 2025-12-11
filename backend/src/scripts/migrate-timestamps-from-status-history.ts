import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import {
  BuyRequest,
  BuyRequestDocument,
} from '../buy-requests/schemas/buy-request.schema';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

/**
 * Migration script to backfill timestamp fields from statusHistory
 *
 * This script:
 * 1. Finds all buy requests with statusHistory entries
 * 2. Extracts the first occurrence of 'approved', 'paid', or 'cancelled' from statusHistory
 * 3. Sets approvedAt, paidAt, or cancelledAt based on the earliest statusHistory entry
 *
 * Run with: pnpm migrate:timestamps-from-history
 */
async function migrateTimestampsFromHistory() {
  console.log('Starting migration: timestamps from statusHistory');

  const app = await NestFactory.createApplicationContext(AppModule);
  const buyRequestModel = app.get<Model<BuyRequestDocument>>(
    getModelToken(BuyRequest.name),
  );

  try {
    // Find all buy requests with statusHistory
    const requests = await buyRequestModel
      .find({
        statusHistory: { $exists: true, $ne: [] },
      })
      .exec();

    console.log(`Found ${requests.length} buy requests with statusHistory`);

    let updatedCount = 0;
    let approvedCount = 0;
    let paidCount = 0;
    let cancelledCount = 0;

    for (const request of requests) {
      let needsUpdate = false;
      const updateData: any = {};

      // Find first occurrence of each status in statusHistory
      if (!request.approvedAt && request.statusHistory) {
        const approvedEntry = request.statusHistory.find(
          (entry) => entry.status === 'approved',
        );
        if (approvedEntry) {
          updateData.approvedAt = approvedEntry.changedAt;
          needsUpdate = true;
          approvedCount++;
        }
      }

      if (!request.paidAt && request.statusHistory) {
        const paidEntry = request.statusHistory.find(
          (entry) => entry.status === 'paid',
        );
        if (paidEntry) {
          updateData.paidAt = paidEntry.changedAt;
          needsUpdate = true;
          paidCount++;
        }
      }

      if (!request.cancelledAt && request.statusHistory) {
        const cancelledEntry = request.statusHistory.find(
          (entry) => entry.status === 'cancelled',
        );
        if (cancelledEntry) {
          updateData.cancelledAt = cancelledEntry.changedAt;
          needsUpdate = true;
          cancelledCount++;
        }
      }

      if (needsUpdate) {
        await buyRequestModel
          .updateOne({ _id: request._id }, { $set: updateData })
          .exec();
        updatedCount++;
      }
    }

    console.log(`✅ Migration completed:`);
    console.log(`   - Updated ${updatedCount} buy requests`);
    console.log(`   - Set approvedAt: ${approvedCount}`);
    console.log(`   - Set paidAt: ${paidCount}`);
    console.log(`   - Set cancelledAt: ${cancelledCount}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await app.close();
    console.log('Application context closed');
  }
}

// Run migration
migrateTimestampsFromHistory()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
