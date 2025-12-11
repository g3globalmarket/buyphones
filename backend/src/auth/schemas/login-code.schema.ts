import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LoginCodeDocument = LoginCode & Document;

@Schema({ timestamps: true })
export class LoginCode {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;
}

export const LoginCodeSchema = SchemaFactory.createForClass(LoginCode);

// Add index for efficient lookups
LoginCodeSchema.index({ email: 1, expiresAt: -1 });
LoginCodeSchema.index({ email: 1, codeHash: 1, used: 1 });
