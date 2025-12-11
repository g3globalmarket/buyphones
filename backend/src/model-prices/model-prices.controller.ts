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
import { AdminTokenGuard } from '../common/guards/admin-token.guard';

@Controller('model-prices')
export class ModelPricesController {
  constructor(private readonly modelPricesService: ModelPricesService) {}

  @Post()
  @UseGuards(AdminTokenGuard)
  create(@Body() createModelPriceDto: CreateModelPriceDto) {
    return this.modelPricesService.create(createModelPriceDto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.modelPricesService.findAll(activeOnly === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelPricesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminTokenGuard)
  update(
    @Param('id') id: string,
    @Body() updateModelPriceDto: UpdateModelPriceDto,
  ) {
    return this.modelPricesService.update(id, updateModelPriceDto);
  }

  @Delete(':id')
  @UseGuards(AdminTokenGuard)
  remove(@Param('id') id: string) {
    return this.modelPricesService.remove(id);
  }
}
