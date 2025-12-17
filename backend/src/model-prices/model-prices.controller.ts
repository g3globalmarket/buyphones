import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ModelPricesService } from './model-prices.service';
import { CreateModelPriceDto } from './dto/create-model-price.dto';
import { UpdateModelPriceDto } from './dto/update-model-price.dto';
import { AdminJwtAuthGuard } from '../common/guards/admin-jwt-auth.guard';

@Controller('model-prices')
export class ModelPricesController {
  constructor(private readonly modelPricesService: ModelPricesService) {}

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  create(@Body() createModelPriceDto: CreateModelPriceDto) {
    return this.modelPricesService.create(createModelPriceDto);
  }

  @Get()
  findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    // Parse and validate limit (0-200, cap at 200)
    let parsedLimit: number | undefined;
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum >= 0) {
        parsedLimit = Math.min(limitNum, 200); // Cap at 200
      }
    }

    // Parse and validate skip (>= 0)
    let parsedSkip: number | undefined;
    if (skip) {
      const skipNum = parseInt(skip, 10);
      if (!isNaN(skipNum) && skipNum >= 0) {
        parsedSkip = skipNum;
      }
    }

    return this.modelPricesService.findAll(
      activeOnly === 'true',
      parsedLimit,
      parsedSkip,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelPricesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateModelPriceDto: UpdateModelPriceDto,
  ) {
    return this.modelPricesService.update(id, updateModelPriceDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.modelPricesService.remove(id);
  }
}
