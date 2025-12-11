import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BuyRequestsService } from './buy-requests.service';
import {
  BuyRequest,
  BuyRequestDocument,
  BuyRequestStatus,
} from './schemas/buy-request.schema';
import { ModelPricesService } from '../model-prices/model-prices.service';
import { CreateBuyRequestDto } from './dto/create-buy-request.dto';
import { UpdateBuyRequestDto } from './dto/update-buy-request.dto';

describe('BuyRequestsService', () => {
  let service: BuyRequestsService;
  let buyRequestModel: Model<BuyRequestDocument>;

  // Create a constructor function that can be used with 'new'
  const MockBuyRequestModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));

  // Add static methods to the constructor
  (MockBuyRequestModel as any).find = jest.fn();
  (MockBuyRequestModel as any).findById = jest.fn();
  (MockBuyRequestModel as any).findOne = jest.fn();
  (MockBuyRequestModel as any).findByIdAndUpdate = jest.fn();
  (MockBuyRequestModel as any).findByIdAndDelete = jest.fn();
  (MockBuyRequestModel as any).create = jest.fn();

  const mockBuyRequestModel = MockBuyRequestModel as any;

  const mockModelPricesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuyRequestsService,
        {
          provide: getModelToken(BuyRequest.name),
          useValue: mockBuyRequestModel,
        },
        {
          provide: ModelPricesService,
          useValue: mockModelPricesService,
        },
      ],
    }).compile();

    service = module.get<BuyRequestsService>(BuyRequestsService);
    buyRequestModel = module.get<Model<BuyRequestDocument>>(
      getModelToken(BuyRequest.name),
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should initialize status as pending and add initial statusHistory entry', async () => {
      const createDto: CreateBuyRequestDto = {
        customerName: 'Test User',
        customerPhone: '010-1234-5678',
        customerEmail: 'test@example.com',
        modelPriceId: '507f1f77bcf86cd799439011',
      };

      const mockModelPrice = {
        _id: '507f1f77bcf86cd799439011',
        category: 'iphone',
        modelCode: 'IP17',
        modelName: 'iPhone 17',
        storageGb: 256,
        color: 'Natural Titanium',
        buyPrice: 1000000,
        currency: 'KRW',
        isActive: true,
      };

      const now = new Date();
      const expectedRequestData = {
        ...createDto,
        deviceCategory: mockModelPrice.category,
        modelCode: mockModelPrice.modelCode,
        modelName: mockModelPrice.modelName,
        storageGb: mockModelPrice.storageGb,
        color: mockModelPrice.color,
        buyPrice: mockModelPrice.buyPrice,
        currency: mockModelPrice.currency,
        status: 'pending' as BuyRequestStatus,
        statusHistory: [
          {
            status: 'pending' as BuyRequestStatus,
            changedAt: now,
          },
        ],
      };

      const mockSavedRequest = {
        _id: '507f1f77bcf86cd799439012',
        ...expectedRequestData,
        save: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439012',
          ...expectedRequestData,
        }),
      };

      mockModelPricesService.findOne.mockResolvedValue(mockModelPrice);
      (buyRequestModel as any).mockImplementation(() => mockSavedRequest);

      const result = await service.create(createDto);

      expect(result.status).toBe('pending');
      expect(result.statusHistory).toBeDefined();
      expect(Array.isArray(result.statusHistory)).toBe(true);
      expect(result.statusHistory.length).toBe(1);
      expect(result.statusHistory[0].status).toBe('pending');
      expect(result.statusHistory[0].changedAt).toBeDefined();
      expect(result.statusHistory[0].changedAt).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('should append statusHistory entry when status changes', async () => {
      const requestId = '507f1f77bcf86cd799439012';
      const initialDate = new Date('2025-01-01T10:00:00Z');
      const mockRequest = {
        _id: requestId,
        status: 'pending' as BuyRequestStatus,
        statusHistory: [
          { status: 'pending' as BuyRequestStatus, changedAt: initialDate },
        ],
        adminNotes: undefined,
        finalPrice: undefined,
        save: jest.fn().mockResolvedValue({
          _id: requestId,
          status: 'approved' as BuyRequestStatus,
          statusHistory: [
            { status: 'pending' as BuyRequestStatus, changedAt: initialDate },
            {
              status: 'approved' as BuyRequestStatus,
              changedAt: expect.any(Date),
            },
          ],
        }),
      };

      (mockBuyRequestModel as any).findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequest),
      } as any);

      const updateDto: UpdateBuyRequestDto = {
        status: 'approved',
      };

      const result = await service.update(requestId, updateDto);

      expect(result.status).toBe('approved');
      expect(result.statusHistory.length).toBe(2);
      expect(result.statusHistory[0].status).toBe('pending');
      expect(result.statusHistory[1].status).toBe('approved');
      expect(result.statusHistory[1].changedAt).toBeDefined();
      expect(mockRequest.save).toHaveBeenCalled();
    });

    it('should not append statusHistory if status stays the same', async () => {
      const requestId = '507f1f77bcf86cd799439012';
      const initialDate = new Date('2025-01-01T10:00:00Z');
      const mockRequest = {
        _id: requestId,
        status: 'approved' as BuyRequestStatus,
        statusHistory: [
          { status: 'pending' as BuyRequestStatus, changedAt: initialDate },
          { status: 'approved' as BuyRequestStatus, changedAt: initialDate },
        ],
        adminNotes: undefined,
        finalPrice: undefined,
        save: jest.fn().mockResolvedValue({
          _id: requestId,
          status: 'approved' as BuyRequestStatus,
          statusHistory: [
            { status: 'pending' as BuyRequestStatus, changedAt: initialDate },
            { status: 'approved' as BuyRequestStatus, changedAt: initialDate },
          ],
        }),
      };

      (mockBuyRequestModel as any).findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequest),
      } as any);

      const updateDto: UpdateBuyRequestDto = {
        status: 'approved',
      };

      const result = await service.update(requestId, updateDto);

      expect(result.status).toBe('approved');
      expect(result.statusHistory.length).toBe(2);
      expect(mockRequest.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if request not found', async () => {
      const requestId = '507f1f77bcf86cd799439012';

      mockBuyRequestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const updateDto: UpdateBuyRequestDto = {
        status: 'approved',
      };

      await expect(service.update(requestId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsPaid', () => {
    it('should set status to paid and append statusHistory entry', async () => {
      const requestId = '507f1f77bcf86cd799439012';
      const initialDate = new Date('2025-01-01T10:00:00Z');
      const mockRequest = {
        _id: requestId,
        status: 'approved' as BuyRequestStatus,
        bankName: '국민은행',
        bankAccount: '123456-78-901234',
        bankHolder: '홍길동',
        shippingMethod: '택배',
        shippingTrackingCode: '1234567890',
        shippingTrackingUrl: 'https://tracking.example.com',
        statusHistory: [
          { status: 'pending' as BuyRequestStatus, changedAt: initialDate },
          { status: 'approved' as BuyRequestStatus, changedAt: initialDate },
        ],
        save: jest.fn().mockResolvedValue({
          _id: requestId,
          status: 'paid' as BuyRequestStatus,
          bankName: '국민은행',
          bankAccount: '123456-78-901234',
          bankHolder: '홍길동',
          shippingMethod: '택배',
          shippingTrackingCode: '1234567890',
          shippingTrackingUrl: 'https://tracking.example.com',
          statusHistory: [
            { status: 'pending' as BuyRequestStatus, changedAt: initialDate },
            { status: 'approved' as BuyRequestStatus, changedAt: initialDate },
            {
              status: 'paid' as BuyRequestStatus,
              changedAt: expect.any(Date),
            },
          ],
        }),
      };

      (mockBuyRequestModel as any).findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequest),
      } as any);

      const result = await service.markAsPaid(requestId);

      expect(result.status).toBe('paid');
      expect(result.statusHistory.length).toBe(3);
      expect(result.statusHistory[0].status).toBe('pending');
      expect(result.statusHistory[1].status).toBe('approved');
      expect(result.statusHistory[2].status).toBe('paid');
      expect(result.statusHistory[2].changedAt).toBeDefined();
      expect(mockRequest.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if request not found', async () => {
      const requestId = '507f1f77bcf86cd799439012';

      mockBuyRequestModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.markAsPaid(requestId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if status is not approved', async () => {
      const requestId = '507f1f77bcf86cd799439012';
      const mockRequest = {
        _id: requestId,
        status: 'pending' as BuyRequestStatus,
        bankName: '국민은행',
        bankAccount: '123456-78-901234',
        bankHolder: '홍길동',
        shippingMethod: '택배',
        shippingTrackingCode: '1234567890',
        shippingTrackingUrl: 'https://tracking.example.com',
      };

      (mockBuyRequestModel as any).findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequest),
      } as any);

      await expect(service.markAsPaid(requestId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if bank info is missing', async () => {
      const requestId = '507f1f77bcf86cd799439012';
      const mockRequest = {
        _id: requestId,
        status: 'approved' as BuyRequestStatus,
        bankName: undefined,
        bankAccount: undefined,
        bankHolder: undefined,
        shippingMethod: '택배',
        shippingTrackingCode: '1234567890',
        shippingTrackingUrl: 'https://tracking.example.com',
      };

      (mockBuyRequestModel as any).findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequest),
      } as any);

      await expect(service.markAsPaid(requestId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if shipping info is missing', async () => {
      const requestId = '507f1f77bcf86cd799439012';
      const mockRequest = {
        _id: requestId,
        status: 'approved' as BuyRequestStatus,
        bankName: '국민은행',
        bankAccount: '123456-78-901234',
        bankHolder: '홍길동',
        shippingMethod: undefined,
        shippingTrackingCode: undefined,
        shippingTrackingUrl: undefined,
      };

      (mockBuyRequestModel as any).findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRequest),
      } as any);

      await expect(service.markAsPaid(requestId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
