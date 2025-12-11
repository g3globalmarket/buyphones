import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceCategory = 'iphone' | 'ps5' | 'switch';

export type ModelPriceDocument = ModelPrice & Document;

@Schema({ timestamps: true })
export class ModelPrice {
  @Prop({ required: true, enum: ['iphone', 'ps5', 'switch'] })
  category: DeviceCategory;

  @Prop({ required: true })
  modelCode: string;

  @Prop({ required: true })
  modelName: string;

  @Prop()
  storageGb?: number;

  @Prop()
  color?: string;

  @Prop({ required: true })
  buyPrice: number;

  @Prop({ required: true, default: 'KRW' })
  currency: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const ModelPriceSchema = SchemaFactory.createForClass(ModelPrice);

// Create compound unique index on (modelCode, color) to support multiple colors per model+storage
// This allows: same modelCode with different colors = different prices
// Using partial filter: only enforce uniqueness when color is not null/undefined
// This allows multiple entries with color=null for the same modelCode (for "any color" pricing)
ModelPriceSchema.index(
  { modelCode: 1, color: 1 },
  {
    unique: true,
    partialFilterExpression: { color: { $exists: true, $ne: null } },
  },
);
