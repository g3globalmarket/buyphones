import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminRole = 'super_admin' | 'admin';

export type AdminUserDocument = AdminUser & Document;

@Schema({ timestamps: true })
export class AdminUser {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    required: true,
    enum: ['super_admin', 'admin'],
    default: 'admin',
  })
  role: AdminRole;

  @Prop()
  name?: string;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);

// Add index on email for faster lookups
AdminUserSchema.index({ email: 1 }, { unique: true });
