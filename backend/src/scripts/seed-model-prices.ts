import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import {
  ModelPrice,
  ModelPriceDocument,
  DeviceCategory,
} from '../model-prices/schemas/model-price.schema';

interface SeedModelPrice {
  category: DeviceCategory;
  modelCode: string;
  modelName: string;
  storageGb?: number;
  color?: string;
  buyPrice: number;
  currency: string;
  isActive: boolean;
}

// Color options for iPhone 17 series
// iPhone 17 and 17 Plus colors
const IPHONE_17_BASE_COLORS = [
  'Lavender',
  'Sage',
  'Mist Blue',
  'White',
  'Black',
];

// iPhone 17 Pro and 17 Pro Max colors
const IPHONE_17_PRO_COLORS = ['Cosmic Orange', 'Deep Blue', 'Silver'];

// Base iPhone 17 models (without color)
const iphoneBaseModels: Omit<SeedModelPrice, 'color'>[] = [
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_128GB',
    modelName: 'iPhone 17',
    storageGb: 128,
    buyPrice: 950000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_256GB',
    modelName: 'iPhone 17',
    storageGb: 256,
    buyPrice: 1100000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_512GB',
    modelName: 'iPhone 17',
    storageGb: 512,
    buyPrice: 1350000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PLUS_128GB',
    modelName: 'iPhone 17 Plus',
    storageGb: 128,
    buyPrice: 1100000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PLUS_256GB',
    modelName: 'iPhone 17 Plus',
    storageGb: 256,
    buyPrice: 1250000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PLUS_512GB',
    modelName: 'iPhone 17 Plus',
    storageGb: 512,
    buyPrice: 1500000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PRO_256GB',
    modelName: 'iPhone 17 Pro',
    storageGb: 256,
    buyPrice: 1450000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PRO_512GB',
    modelName: 'iPhone 17 Pro',
    storageGb: 512,
    buyPrice: 1700000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PRO_1TB',
    modelName: 'iPhone 17 Pro',
    storageGb: 1024,
    buyPrice: 2000000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PRO_MAX_256GB',
    modelName: 'iPhone 17 Pro Max',
    storageGb: 256,
    buyPrice: 1600000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PRO_MAX_512GB',
    modelName: 'iPhone 17 Pro Max',
    storageGb: 512,
    buyPrice: 1850000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'iphone',
    modelCode: 'IPHONE_17_PRO_MAX_1TB',
    modelName: 'iPhone 17 Pro Max',
    storageGb: 1024,
    buyPrice: 2150000,
    currency: 'KRW',
    isActive: true,
  },
];

// Generate iPhone models with color variants
// Use base colors for iPhone 17 and 17 Plus, Pro colors for Pro models
const iphoneModelsWithColors: SeedModelPrice[] = iphoneBaseModels.flatMap(
  (base) => {
    // Determine which color set to use based on model name
    const isProModel =
      base.modelName.includes('Pro') || base.modelName.includes('Pro Max');
    const colors = isProModel ? IPHONE_17_PRO_COLORS : IPHONE_17_BASE_COLORS;

    return colors.map((color) => ({
      ...base,
      color,
    }));
  },
);

// PS5 and Switch models (no color)
const otherModels: SeedModelPrice[] = [
  // PlayStation 5
  {
    category: 'ps5',
    modelCode: 'PS5_STANDARD',
    modelName: 'PlayStation 5 (표준판)',
    buyPrice: 450000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'ps5',
    modelCode: 'PS5_DIGITAL',
    modelName: 'PlayStation 5 (디지털 에디션)',
    buyPrice: 380000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'ps5',
    modelCode: 'PS5_SLIM_STANDARD',
    modelName: 'PlayStation 5 Slim (표준판)',
    buyPrice: 470000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'ps5',
    modelCode: 'PS5_SLIM_DIGITAL',
    modelName: 'PlayStation 5 Slim (디지털 에디션)',
    buyPrice: 400000,
    currency: 'KRW',
    isActive: true,
  },
  // Nintendo Switch
  {
    category: 'switch',
    modelCode: 'SWITCH_OLED',
    modelName: 'Nintendo Switch OLED',
    buyPrice: 320000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'switch',
    modelCode: 'SWITCH_STANDARD',
    modelName: 'Nintendo Switch (표준판)',
    buyPrice: 280000,
    currency: 'KRW',
    isActive: true,
  },
  {
    category: 'switch',
    modelCode: 'SWITCH_LITE',
    modelName: 'Nintendo Switch Lite',
    buyPrice: 200000,
    currency: 'KRW',
    isActive: true,
  },
];

// Combine all seed data
const seedData: SeedModelPrice[] = [...iphoneModelsWithColors, ...otherModels];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const modelPriceModel = app.get<Model<ModelPriceDocument>>(
    getModelToken(ModelPrice.name),
  );

  console.log('🌱 Starting seed for ModelPrice collection...\n');

  // Delete all existing iPhone entries before reseeding
  console.log('🗑️  Deleting existing iPhone ModelPrice entries...');
  const deleteResult = await modelPriceModel.deleteMany({ category: 'iphone' });
  console.log(`   Deleted ${deleteResult.deletedCount} iPhone entries\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const data of seedData) {
    try {
      // Check if document exists before upsert for accurate logging
      // Use compound key (modelCode, color) to support multiple colors per model
      const query: any = { modelCode: data.modelCode };

      // Handle color: if undefined, treat as null for query
      if (
        data.color !== undefined &&
        data.color !== null &&
        data.color !== ''
      ) {
        query.color = data.color;
      } else {
        // For null/undefined/empty colors, explicitly set to null in query
        // This ensures we match entries with color: null
        query.color = null;
      }

      const existing = await modelPriceModel.findOne(query);

      // Prepare data for upsert: ensure color is null if undefined
      const upsertData = {
        ...data,
        color:
          data.color !== undefined && data.color !== null && data.color !== ''
            ? data.color
            : null,
      };

      // Use findOneAndUpdate with upsert for efficient find-or-create logic
      // Match on compound unique index (modelCode, color)
      await modelPriceModel.findOneAndUpdate(
        query,
        upsertData, // Update with new data
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return updated document
          setDefaultsOnInsert: true, // Apply schema defaults on insert
        },
      );

      const colorInfo = upsertData.color ? ` - ${upsertData.color}` : '';
      if (existing) {
        console.log(
          `✅ Updated: ${data.modelName}${colorInfo} (${data.modelCode})`,
        );
        updated++;
      } else {
        console.log(
          `✨ Created: ${data.modelName}${colorInfo} (${data.modelCode})`,
        );
        created++;
      }
    } catch (error) {
      console.error(
        `❌ Error processing ${data.modelCode}:`,
        error instanceof Error ? error.message : error,
      );
      skipped++;
    }
  }

  console.log('\n📊 Seed Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${seedData.length}\n`);

  await app.close();
  console.log('✅ Seed completed successfully!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
