import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findOrCreateByEmail(email: string): Promise<UserDocument> {
    const normalizedEmail = email.trim().toLowerCase();

    let user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      user = new this.userModel({ email: normalizedEmail });
      await user.save();
    }

    return user;
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.userModel.findOne({ email: normalizedEmail }).exec();
  }
}
