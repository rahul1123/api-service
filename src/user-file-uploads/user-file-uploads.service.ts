import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { UtilService } from '../util/util.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserFileUploadsService {
  constructor(
    private readonly configService: ConfigService,
    public dbService: DbService,
    public utilService: UtilService,
    @Inject(forwardRef(() => AuthService)) public AuthService: AuthService,
  ) {}

  async saveFileMetadata(req: {
    userId: number;
    fileName: string;
    filePath: string;
    batchId: string;
    remarks?: string;
  }) {
    let userId = req.userId;
    let fileName = req.fileName;
    let filePath = req.filePath;
    let batchId = req.batchId;
    let remarks = req.remarks || null;

    let now = new Date().toISOString();

    let query = `
      INSERT INTO user_file_uploads (user_id, file_name, file_path, batch_id, remarks, upload_time)
      VALUES (78, '${fileName}', '${filePath}', '${batchId}', ${remarks ? `'${remarks}'` : 'NULL'}, '${now}')
      RETURNING *;
    `;

    try {
      const result = await this.dbService.execute(query);

      if (result && result.rows && result.rows.length > 0) {
        const fileRecord = result.rows[0];
        const response = {
          type: 'file_upload',
          data: fileRecord,
        };
        return this.utilService.successResponse(response, 'File metadata saved successfully');
      } else {
        return this.utilService.failResponse('File upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async getAllUploads() {
    let query = `
      SELECT 
        id, 
        user_id, 
        file_name, 
        file_path, 
        batch_id, 
        remarks, 
        upload_time, 
        status, 
        processed_at
      FROM user_file_uploads
      ORDER BY upload_time DESC;
    `;

    try {
      const result = await this.dbService.execute(query);

      if (result && result && result.length > 0) {
        return this.utilService.successResponse(result, 'Uploads fetched successfully');
      } else {
        return this.utilService.successResponse([], 'No uploaded files found');
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      throw new InternalServerErrorException('Error fetching uploaded files');
    }
  }
}
