import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ModelPrice, ModelPriceDocument } from './schemas/model-price.schema';
import { CreateModelPriceDto } from './dto/create-model-price.dto';
import { UpdateModelPriceDto } from './dto/update-model-price.dto';

@Injectable()
export class ModelPricesService {
  constructor(
    @InjectModel(ModelPrice.name)
    private modelPriceModel: Model<ModelPriceDocument>,
  ) {}

  async create(createModelPriceDto: CreateModelPriceDto): Promise<ModelPrice> {
    const created = new this.modelPriceModel(createModelPriceDto);
    return created.save();
  }

  async findAll(
    activeOnly: boolean = false,
    limit?: number,
    skip?: number,
  ): Promise<ModelPrice[]> {
    const query = activeOnly ? { isActive: true } : {};
    const mongooseQuery = this.modelPriceModel.find(query);

    // Apply skip and limit only when provided
    if (skip !== undefined) {
      mongooseQuery.skip(skip);
    }
    if (limit !== undefined) {
      mongooseQuery.limit(limit);
    }

    return mongooseQuery.exec();
  }

  async findOne(id: string): Promise<ModelPrice> {
    return this.modelPriceModel.findById(id).exec();
  }

  async update(
    id: string,
    updateModelPriceDto: UpdateModelPriceDto,
  ): Promise<ModelPrice> {
    return this.modelPriceModel
      .findByIdAndUpdate(id, updateModelPriceDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<void> {
    await this.modelPriceModel.findByIdAndDelete(id).exec();
  }
}
