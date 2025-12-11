import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

function generateFileName(originalName: string): string {
  const random = randomBytes(16).toString('hex');
  const ext = extname(originalName) || '';
  return `${Date.now()}-${random}${ext}`;
}

@Controller('files')
export class FilesController {
  @Post('photos')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadsDir = join(process.cwd(), 'uploads');
          // Ensure directory exists
          if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
          }
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          cb(null, generateFileName(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('이미지 파일만 업로드할 수 있습니다.'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
      },
    }),
  )
  async uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('업로드된 파일이 없습니다.');
    }

    const urls = files.map((file) => {
      // Return URLs relative to the API base
      return `/uploads/${file.filename}`;
    });

    return { urls };
  }
}
