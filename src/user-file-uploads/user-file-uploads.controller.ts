// src/user-file-uploads/user-file-uploads.controller.ts
import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  InternalServerErrorException,
  Get
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { UserFileUploadsService } from './user-file-uploads.service';
import { ImportFileDto } from './dto/import-file.dto';

@ApiTags('user-file-uploads')
@Controller('user-file-uploads')
export class UserFileUploadsController {
  constructor(private readonly service: UserFileUploadsService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import CSV file and store metadata' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'batchId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        remarks: {
          type: 'string',
        },
        batchId: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded and metadata saved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input or missing file',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype !== 'text/csv' &&
          file.mimetype !== 'application/vnd.ms-excel'
        ) {
          cb(new Error('Only CSV files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async importCsvFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ImportFileDto,
    @Res() res: Response,
  ) {
    if (!file) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'CSV file is required' });
    }

    try {
      const saved = await this.service.saveFileMetadata({
        userId: 1, // 🔁 Replace with actual user ID (e.g., from auth token)
        fileName: file.originalname,
        filePath: file.path,
        batchId: body.batchId,
        remarks: body.remarks,
      });

      return res.status(HttpStatus.OK).json({
        message: 'File uploaded successfully',
        data: saved,
      });
    } catch (err) {
      console.error('Upload error:', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Failed to upload file' });
    }
  }


   @Get()
  @ApiOperation({ summary: 'Get all uploaded files' })
  @ApiResponse({ status: 200, description: 'List of uploaded files' })
  @ApiResponse({ status: 500, description: 'Failed to fetch uploads' })
  async getAll(@Res() res: Response) {
    try {
      const files = await this.service.getAllUploads();
      return res.status(HttpStatus.OK).json(files);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to fetch uploaded files');
    }
  }


}
