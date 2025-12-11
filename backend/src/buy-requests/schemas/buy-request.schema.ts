import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BuyRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled';

export interface StatusHistoryEntry {
  status: BuyRequestStatus;
  changedAt: Date;
  changedBy?: string; // 'user' | 'admin' | admin email
}

export type BuyRequestDocument = BuyRequest & Document;

@Schema({ timestamps: true })
export class BuyRequest {
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ required: true })
  customerEmail: string;

  @Prop({ type: Types.ObjectId, ref: 'ModelPrice', required: true })
  modelPriceId: Types.ObjectId;

  @Prop({ required: true })
  deviceCategory: string;

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

  @Prop({ required: true, default: 'pending' })
  status: BuyRequestStatus;

  @Prop()
  notes?: string;

  @Prop()
  adminNotes?: string;

  @Prop()
  imeiSerial?: string;

  @Prop({ default: false })
  hasReceipt?: boolean;

  @Prop({ type: [String], default: [] })
  photoUrls?: string[];

  @Prop()
  finalPrice?: number;

  @Prop()
  bankName?: string;

  @Prop()
  bankAccount?: string;

  @Prop()
  bankHolder?: string;

  @Prop()
  shippingMethod?: string;

  @Prop()
  shippingTrackingCode?: string;

  @Prop()
  shippingTrackingUrl?: string;

  @Prop()
  shippingSubmittedAt?: Date;

  @Prop()
  approvedAt?: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  approvedBy?: string; // 'admin' | admin email

  @Prop()
  cancelledBy?: string; // 'user' | 'admin' | admin email

  @Prop({
    type: [
      {
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected', 'paid', 'cancelled'],
          required: true,
        },
        changedAt: { type: Date, required: true },
        changedBy: { type: String },
      },
    ],
    default: [],
  })
  statusHistory: StatusHistoryEntry[];
}

export const BuyRequestSchema = SchemaFactory.createForClass(BuyRequest);

// Add indexes for common queries
BuyRequestSchema.index({ customerEmail: 1 });
BuyRequestSchema.index({ status: 1 });
BuyRequestSchema.index({ createdAt: -1 });
BuyRequestSchema.index({ status: 1, createdAt: -1 }); // Compound index for filtered + sorted queries
