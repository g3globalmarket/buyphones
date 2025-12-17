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
import { Throttle } from '@nestjs/throttler';
import { BuyRequestsService } from './buy-requests.service';
import { CreateBuyRequestDto } from './dto/create-buy-request.dto';
import { UpdateBuyRequestDto } from './dto/update-buy-request.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { ListBuyRequestsQueryDto } from './dto/list-buy-requests-query.dto';

@Controller('buy-requests')
export class BuyRequestsController {
  constructor(private readonly buyRequestsService: BuyRequestsService) {}

  @Post()
  create(@Body() createBuyRequestDto: CreateBuyRequestDto) {
    return this.buyRequestsService.create(createBuyRequestDto);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  @Throttle({
    default: {
      limit: 100, // Higher limit for admin list operations
      ttl: 60 * 1000, // 100 requests per 60 seconds per IP
    },
  })
  findAll(@Query() query: ListBuyRequestsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search;
    const status = query.status;
    return this.buyRequestsService.findAll(status, page, limit, search);
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  findOne(@Param('id') id: string) {
    return this.buyRequestsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateBuyRequestDto: UpdateBuyRequestDto,
  ) {
    return this.buyRequestsService.update(id, updateBuyRequestDto);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.buyRequestsService.remove(id);
  }

  @Patch(':id/mark-paid')
  @UseGuards(AdminAuthGuard)
  markPaid(@Param('id') id: string) {
    return this.buyRequestsService.markAsPaid(id);
  }
}
