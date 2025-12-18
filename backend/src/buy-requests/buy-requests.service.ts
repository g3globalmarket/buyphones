import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BuyRequest,
  BuyRequestDocument,
  BuyRequestStatus,
} from './schemas/buy-request.schema';
import { CreateBuyRequestDto } from './dto/create-buy-request.dto';
import { UpdateBuyRequestDto } from './dto/update-buy-request.dto';
import { UpdateMyRequestDto } from '../me/dto/update-my-request.dto';
import { ModelPricesService } from '../model-prices/model-prices.service';
import { PaginatedResult } from '../common/dto/paginated-result.dto';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { getShippingInfo } from '../common/config/shipping.config';

@Injectable()
export class BuyRequestsService {
  private readonly logger = new AppLoggerService(BuyRequestsService.name);

  constructor(
    @InjectModel(BuyRequest.name)
    private buyRequestModel: Model<BuyRequestDocument>,
    private modelPricesService: ModelPricesService,
  ) {}

  /**
   * Normalize legacy "completed" status to "paid" for backward compatibility
   */
  private normalizeStatus(status: string): BuyRequestStatus {
    if (status === 'completed') {
      return 'paid';
    }
    return status as BuyRequestStatus;
  }

  /**
   * Normalize a buy request document, converting legacy "completed" status to "paid"
   */
  private normalizeBuyRequest(request: BuyRequestDocument): BuyRequest {
    const normalized = request.toObject();
    if (normalized.status === 'completed') {
      normalized.status = 'paid';
    }
    // Normalize statusHistory entries
    if (normalized.statusHistory) {
      normalized.statusHistory = normalized.statusHistory.map((entry) => ({
        ...entry,
        status: this.normalizeStatus(entry.status),
      }));
    }
    return normalized as BuyRequest;
  }

  async create(createBuyRequestDto: CreateBuyRequestDto): Promise<BuyRequest> {
    // Fetch the model price to include its details in the request
    const modelPrice = await this.modelPricesService.findOne(
      createBuyRequestDto.modelPriceId,
    );

    if (!modelPrice) {
      throw new NotFoundException('Model price not found');
    }

    if (!modelPrice.isActive) {
      throw new NotFoundException('Model price is not active');
    }

    // Validate IMEI/Serial based on device category
    let validatedImeiSerial = createBuyRequestDto.imeiSerial;
    if (createBuyRequestDto.imeiSerial) {
      const imeiSerial = createBuyRequestDto.imeiSerial.trim();
      const category = modelPrice.category;

      if (category === 'iphone') {
        // iPhone: must be exactly 15 digits
        if (imeiSerial.length !== 15) {
          throw new BadRequestException(
            '아이폰 IMEI는 정확히 15자리 숫자여야 합니다.',
          );
        }
        if (!/^\d{15}$/.test(imeiSerial)) {
          throw new BadRequestException(
            '아이폰 IMEI는 15자리 숫자만 입력할 수 있습니다.',
          );
        }
      } else if (category === 'ps5' || category === 'switch') {
        // PS5/Switch: minimum 8 characters, alphanumeric
        if (imeiSerial.length < 8) {
          throw new BadRequestException(
            '제품 시리얼 번호를 정확히 입력해주세요. (최소 8자)',
          );
        }
        if (!/^[A-Za-z0-9]+$/.test(imeiSerial)) {
          throw new BadRequestException(
            '제품 시리얼 번호는 영문자와 숫자만 사용할 수 있습니다.',
          );
        }
      }
      validatedImeiSerial = imeiSerial;
    }

    // Create buy request with model price details
    const now = new Date();
    const buyRequestData = {
      ...createBuyRequestDto,
      imeiSerial: validatedImeiSerial,
      deviceCategory: modelPrice.category,
      modelCode: modelPrice.modelCode,
      modelName: modelPrice.modelName,
      storageGb: modelPrice.storageGb,
      color: modelPrice.color,
      buyPrice: modelPrice.buyPrice,
      currency: modelPrice.currency,
      status: 'pending' as BuyRequestStatus,
      statusHistory: [
        { status: 'pending' as BuyRequestStatus, changedAt: now },
      ],
    };

    const created = new this.buyRequestModel(buyRequestData);
    const saved = await created.save();
    this.logger.logWithReq(
      { requestId: 'system' },
      `Buy request created: ${saved._id} for ${saved.customerEmail}`,
    );
    return this.normalizeBuyRequest(saved);
  }

  async findAll(
    status?: BuyRequestStatus,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<PaginatedResult<BuyRequest>> {
    const query: any = status ? { status } : {};

    // Add search filter if provided
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerEmail: regex },
        { customerName: regex },
        { customerPhone: regex },
        { imeiSerial: regex },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      this.buyRequestModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.buyRequestModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Normalize legacy "completed" status to "paid"
    const normalizedItems = items.map((item) => this.normalizeBuyRequest(item));

    return {
      items: normalizedItems,
      totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<BuyRequest> {
    const request = await this.buyRequestModel.findById(id).exec();
    if (!request) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }
    return this.normalizeBuyRequest(request);
  }

  async update(
    id: string,
    updateBuyRequestDto: UpdateBuyRequestDto,
  ): Promise<BuyRequest> {
    const request = await this.buyRequestModel.findById(id).exec();

    if (!request) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }

    // Track status change if status is being updated
    if (
      updateBuyRequestDto.status !== undefined &&
      updateBuyRequestDto.status !== request.status
    ) {
      const newStatus = updateBuyRequestDto.status;
      const now = new Date();

      request.status = newStatus;
      request.statusHistory = request.statusHistory || [];
      request.statusHistory.push({
        status: newStatus,
        changedAt: now,
      });

      // Set timestamp fields and audit trail when status changes to specific values
      if (newStatus === 'approved' && !request.approvedAt) {
        request.approvedAt = now;
        if (!request.approvedBy) {
          request.approvedBy = 'admin';
        }
        request.statusHistory[request.statusHistory.length - 1].changedBy =
          'admin';

        // Store shipping info snapshot when request is approved
        // This ensures the address is preserved even if env vars change later
        const shippingInfo = getShippingInfo();
        if (shippingInfo && !request.shippingInfo) {
          request.shippingInfo = shippingInfo;
          this.logger.logWithReq(
            { requestId: 'system' },
            `Shipping info snapshot stored for request ${id}`,
          );
        } else if (!shippingInfo) {
          this.logger.warnWithReq(
            { requestId: 'system' },
            `Shipping info env vars not configured, skipping snapshot for request ${id}`,
          );
        }
      } else if (newStatus === 'paid' && !request.paidAt) {
        request.paidAt = now;
        request.statusHistory[request.statusHistory.length - 1].changedBy =
          'admin';
      } else if (newStatus === 'cancelled' && !request.cancelledAt) {
        request.cancelledAt = now;
        if (!request.cancelledBy) {
          request.cancelledBy = 'admin';
        }
        request.statusHistory[request.statusHistory.length - 1].changedBy =
          'admin';
      } else {
        // For other status changes, set changedBy to admin
        request.statusHistory[request.statusHistory.length - 1].changedBy =
          'admin';
      }
    }

    // Update other fields
    if (updateBuyRequestDto.adminNotes !== undefined) {
      request.adminNotes = updateBuyRequestDto.adminNotes;
    }
    if (updateBuyRequestDto.finalPrice !== undefined) {
      request.finalPrice = updateBuyRequestDto.finalPrice;
    }

    const saved = await request.save();
    if (updateBuyRequestDto.status !== undefined) {
      this.logger.logWithReq(
        { requestId: 'system' },
        `Buy request ${id} status changed to ${saved.status}`,
      );
    }
    return this.normalizeBuyRequest(saved);
  }

  async remove(id: string): Promise<void> {
    await this.buyRequestModel.findByIdAndDelete(id).exec();
  }

  async findByEmail(
    email: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<BuyRequest>> {
    const normalizedEmail = email.trim().toLowerCase();
    const query = { customerEmail: normalizedEmail };
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      this.buyRequestModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.buyRequestModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Normalize legacy "completed" status to "paid"
    const normalizedItems = items.map((item) => this.normalizeBuyRequest(item));

    return {
      items: normalizedItems,
      totalCount,
      page,
      limit,
      totalPages,
    };
  }

  async updateByUser(
    id: string,
    email: string,
    dto: UpdateMyRequestDto,
  ): Promise<BuyRequest> {
    const normalizedEmail = email.trim().toLowerCase();
    const request = await this.buyRequestModel
      .findOne({ _id: id, customerEmail: normalizedEmail })
      .exec();

    if (!request) {
      throw new NotFoundException('해당 신청을 찾을 수 없습니다.');
    }

    // Only allow update when status is 'approved'
    if (request.status !== 'approved') {
      throw new ForbiddenException('승인된 신청만 수정할 수 있습니다.');
    }

    if (dto.bankName !== undefined) request.bankName = dto.bankName;
    if (dto.bankAccount !== undefined) request.bankAccount = dto.bankAccount;
    if (dto.bankHolder !== undefined) request.bankHolder = dto.bankHolder;

    if (dto.shippingMethod !== undefined)
      request.shippingMethod = dto.shippingMethod;
    if (dto.shippingTrackingCode !== undefined)
      request.shippingTrackingCode = dto.shippingTrackingCode;
    if (dto.shippingTrackingUrl !== undefined)
      request.shippingTrackingUrl = dto.shippingTrackingUrl;

    // If any shipping field is provided, update shippingSubmittedAt
    if (
      dto.shippingMethod !== undefined ||
      dto.shippingTrackingCode !== undefined ||
      dto.shippingTrackingUrl !== undefined
    ) {
      request.shippingSubmittedAt = new Date();
    }

    const saved = await request.save();
    return this.normalizeBuyRequest(saved);
  }

  async markAsPaid(id: string): Promise<BuyRequest> {
    const request = await this.buyRequestModel.findById(id).exec();

    if (!request) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }

    // Enforce that it must be approved
    if (request.status !== 'approved') {
      throw new BadRequestException(
        'approved 상태에서만 입금 완료 처리할 수 있습니다.',
      );
    }

    // Optionally check that bank and shipping info are present
    const hasBankInfo =
      !!request.bankName && !!request.bankAccount && !!request.bankHolder;
    const hasShippingInfo =
      !!request.shippingMethod &&
      !!request.shippingTrackingCode &&
      !!request.shippingTrackingUrl;

    if (!hasBankInfo || !hasShippingInfo) {
      throw new BadRequestException(
        '입금 정보와 배송 정보가 모두 제출된 경우에만 입금 완료 처리할 수 있습니다.',
      );
    }

    const now = new Date();
    request.status = 'paid';
    if (!request.paidAt) {
      request.paidAt = now;
    }
    request.statusHistory = request.statusHistory || [];
    request.statusHistory.push({
      status: 'paid',
      changedAt: now,
      changedBy: 'admin',
    });
    const saved = await request.save();
    this.logger.logWithReq(
      { requestId: 'system' },
      `Buy request ${id} marked as paid`,
    );
    return this.normalizeBuyRequest(saved);
  }

  async cancelMyRequest(userEmail: string, id: string): Promise<BuyRequest> {
    const normalizedEmail = userEmail.trim().toLowerCase();
    const request = await this.buyRequestModel
      .findOne({ _id: id, customerEmail: normalizedEmail })
      .exec();

    if (!request) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }

    if (!['pending', 'approved'].includes(request.status)) {
      throw new BadRequestException('이 상태에서는 취소할 수 없습니다.');
    }

    // Block cancel if already paid
    if (
      request.status === 'approved' &&
      request.statusHistory?.some((s) => s.status === 'paid')
    ) {
      throw new BadRequestException('입금 처리된 신청은 취소할 수 없습니다.');
    }

    const now = new Date();
    request.status = 'cancelled';
    if (!request.cancelledAt) {
      request.cancelledAt = now;
    }
    if (!request.cancelledBy) {
      request.cancelledBy = 'user';
    }
    request.statusHistory = request.statusHistory || [];
    request.statusHistory.push({
      status: 'cancelled',
      changedAt: now,
      changedBy: 'user',
    });

    const saved = await request.save();
    this.logger.logWithReq(
      { requestId: 'system' },
      `Buy request ${id} cancelled by user ${normalizedEmail}`,
    );
    return this.normalizeBuyRequest(saved);
  }

  async deleteMyRequest(userEmail: string, id: string): Promise<void> {
    const normalizedEmail = userEmail.trim().toLowerCase();
    const request = await this.buyRequestModel
      .findOne({ _id: id, customerEmail: normalizedEmail })
      .exec();

    if (!request) {
      throw new NotFoundException('요청을 찾을 수 없습니다.');
    }

    if (!['pending', 'rejected', 'cancelled'].includes(request.status)) {
      throw new BadRequestException('이 상태에서는 삭제할 수 없습니다.');
    }

    await this.buyRequestModel.deleteOne({ _id: id }).exec();
  }
}
