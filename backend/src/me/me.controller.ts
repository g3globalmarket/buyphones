import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { BuyRequestsService } from '../buy-requests/buy-requests.service';
import { UserJwtAuthGuard } from '../auth/guards/user-jwt-auth.guard';
import { UpdateMyRequestDto } from './dto/update-my-request.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('me')
export class MeController {
  constructor(private readonly buyRequestsService: BuyRequestsService) {}

  @UseGuards(UserJwtAuthGuard)
  @Get('requests')
  async getMyRequests(
    @Req() req: any,
    @Query() pagination?: PaginationQueryDto,
  ) {
    const userEmail = req.user.email;
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    return this.buyRequestsService.findByEmail(userEmail, page, limit);
  }

  @UseGuards(UserJwtAuthGuard)
  @Patch('requests/:id')
  async updateMyRequest(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateMyRequestDto,
  ) {
    const email = req.user.email;
    return this.buyRequestsService.updateByUser(id, email, dto);
  }

  @UseGuards(UserJwtAuthGuard)
  @Patch('requests/:id/cancel')
  async cancelMyRequest(@Param('id') id: string, @Req() req: any) {
    const email = req.user.email;
    return this.buyRequestsService.cancelMyRequest(email, id);
  }

  @UseGuards(UserJwtAuthGuard)
  @Delete('requests/:id')
  async deleteMyRequest(@Param('id') id: string, @Req() req: any) {
    const email = req.user.email;
    await this.buyRequestsService.deleteMyRequest(email, id);
    return { success: true };
  }
}
