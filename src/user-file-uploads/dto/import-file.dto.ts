// src/user-file-uploads/dto/import-file.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ImportFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CSV file to upload',
  })
  file: any; // NOTE: Not validated by class-validator, handled via @UploadedFile()

  @ApiProperty({
    description: 'Batch ID (UUID)',
    example: 'ad7baf43-3b3d-4135-9819-d9cc9179506c',
  })
  @IsUUID()
  batchId: string;

  @ApiProperty({
    description: 'Optional remarks or description of the upload',
    required: false,
    example: 'Uploading October payroll data',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
