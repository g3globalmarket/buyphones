import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add index on email for faster lookups
UserSchema.index({ email: 1 }, { unique: true });
