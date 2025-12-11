import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import {
  BuyRequest,
  BuyRequestDocument,
} from '../buy-requests/schemas/buy-request.schema';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

config({ path: resolve(__dirname, '../../.env') });

/**
 * Migration script to convert base64 photoUrls to file-based storage
 *
 * This script:
 * 1. Finds all BuyRequest documents with base64 data URLs in photoUrls
 * 2. Converts each base64 string to a file on disk in the uploads/ directory
 * 3. Replaces the base64 string with the file URL (/uploads/<filename>)
 * 4. Saves the updated document
 *
 * Run with: pnpm migrate:photos-base64
 *
 * Note: This script requires the uploads/ directory to exist or be creatable.
 * Files are saved with the same naming pattern as FilesController:
 * <timestamp>-<random16bytes>.<ext>
 */
function generateFileName(mimeType: string): string {
  const random = randomBytes(16).toString('hex');

  // Map MIME types to file extensions
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };

  const ext = mimeToExt[mimeType] || '.bin';
  return `${Date.now()}-${random}${ext}`;
}

function parseBase64DataUrl(dataUrl: string): {
  mimeType: string;
  base64Data: string;
} | null {
  // Format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  if (!dataUrl.startsWith('data:image/')) {
    return null;
  }

  const match = dataUrl.match(/^data:image\/([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const mimeType = `image/${match[1]}`;
  const base64Data = match[2];

  return { mimeType, base64Data };
}

async function migratePhotoBase64ToFiles() {
  console.log('Starting migration: base64 photoUrls to files');

  const app = await NestFactory.createApplicationContext(AppModule);
  const buyRequestModel = app.get<Model<BuyRequestDocument>>(
    getModelToken(BuyRequest.name),
  );

  // Ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
  }

  try {
    // Find all buy requests with photoUrls that contain base64 data URLs
    const requests = await buyRequestModel
      .find({
        photoUrls: { $exists: true, $ne: [] },
      })
      .exec();

    console.log(`Found ${requests.length} buy requests with photoUrls`);

    let processedCount = 0;
    let updatedCount = 0;
    let totalImagesConverted = 0;

    for (const request of requests) {
      if (!request.photoUrls || request.photoUrls.length === 0) {
        continue;
      }

      let hasBase64 = false;
      const updatedPhotoUrls: string[] = [];

      for (const photoUrl of request.photoUrls) {
        // Check if this is a base64 data URL
        if (photoUrl.startsWith('data:image/')) {
          hasBase64 = true;
          const parsed = parseBase64DataUrl(photoUrl);

          if (!parsed) {
            console.warn(
              `⚠️  Skipping invalid base64 URL in request ${request._id}`,
            );
            // Keep the original if we can't parse it
            updatedPhotoUrls.push(photoUrl);
            continue;
          }

          try {
            // Decode base64 to buffer
            const buffer = Buffer.from(parsed.base64Data, 'base64');

            // Generate filename
            const filename = generateFileName(parsed.mimeType);
            const filePath = join(uploadsDir, filename);

            // Write file to disk
            writeFileSync(filePath, buffer);

            // Replace with file URL
            updatedPhotoUrls.push(`/uploads/${filename}`);
            totalImagesConverted++;
          } catch (error) {
            console.error(
              `❌ Failed to convert base64 image in request ${request._id}:`,
              error,
            );
            // Keep the original if conversion fails
            updatedPhotoUrls.push(photoUrl);
          }
        } else {
          // Already a file URL, keep it as is
          updatedPhotoUrls.push(photoUrl);
        }
      }

      // Update document if we converted any base64 images
      if (hasBase64) {
        await buyRequestModel
          .updateOne(
            { _id: request._id },
            { $set: { photoUrls: updatedPhotoUrls } },
          )
          .exec();
        updatedCount++;
        processedCount++;
      } else {
        processedCount++;
      }
    }

    console.log(`✅ Migration completed:`);
    console.log(`   - Processed ${processedCount} buy requests`);
    console.log(`   - Updated ${updatedCount} buy requests`);
    console.log(
      `   - Converted ${totalImagesConverted} base64 images to files`,
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await app.close();
    console.log('Application context closed');
  }
}

// Run migration
migratePhotoBase64ToFiles()
  .then(() => {
    console.log('Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
