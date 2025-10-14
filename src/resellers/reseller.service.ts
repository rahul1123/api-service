import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service';
import { UtilService } from '../util/util.service';
import { CreateResellerDto ,UpdateResellerDto} from './reseller.dto'; // ✅ Define DTOs
@Injectable()
export class ResellerService {
  constructor(
    private readonly dbService: DbService,
    public utilService: UtilService,
  ) {}

  // 📌 Get All Resellers
  async findAll() {
    try {
      const query = `SELECT * FROM users  where role='R' ORDER BY updated_at DESC`;
      const list = await this.dbService.execute(query);
      // Transform each reseller
    const transformedList = list.map(reseller => {
      // Fallback email to reseller.email if reseller_primary_email is null
      const email = reseller.reseller_primary_email || reseller.email || null;

      // If primary first/last name are not provided, try to parse from reseller.name
      let firstName = reseller.reseller_primary_first_name;
      let lastName = reseller.reseller_primary_last_name;

      if (!firstName || !lastName) {
        // Try splitting reseller.name by space
        if (reseller.name) {
          const nameParts = reseller.name.trim().split(' ');
          firstName = firstName || nameParts[0] || null;
          lastName = lastName || nameParts.slice(1).join(' ') || null;
        }
      }

      return {
        ...reseller,
        primaryContactInfo: {
          email,
          firstName,
          lastName,
        }
      };
    });

    return this.utilService.successResponse(
      transformedList.length > 0 ? transformedList : [],
      'get All resellers Successfully.'
    );
    } catch (error) {
      console.error('Error fetching resellers:', error);
      throw new InternalServerErrorException('Failed to fetch resellers');
    }
  }

  // 📌 Get Reseller By ID
  async findOne(id: number) {
    try {
      const query = 'SELECT * FROM users  WHERE id = $1';
      const result = await this.dbService.executeQuery(query, [id]);

      if (result.length === 0) {
        throw new NotFoundException(`Reseller with ID ${id} not found`);
      }

      return result[0];
    } catch (error) {
      console.error(`Error fetching reseller with ID ${id}:`, error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to fetch reseller');
    }
  }

  // 📌 Create Reseller
  async create(dto: CreateResellerDto) {
    try {
      const query = `
        INSERT INTO users  (
          domain,
          org_display_name,
          alternate_email,
          primary_email,
          primary_first_name,
          primary_last_name,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *;
      `;

      const values = [
        dto.domain,
        dto.orgDisplayName,
        dto.alternateEmail,
        dto.primaryContactInfo.email,
        dto.primaryContactInfo.firstName,
        dto.primaryContactInfo.lastName,
      ];

      const result = await this.dbService.executeQuery(query, values);
      return this.utilService.successResponse(result[0], 'Reseller created successfully');
    } catch (error) {
      console.error('Error creating reseller:', error);
      throw new InternalServerErrorException('Failed to create reseller');
    }
  }

  // 📌 Update Reseller
  async update(id: number, dto: UpdateResellerDto) {
    try {
      const query = `
        UPDATE users  SET
          domain = $1,
          org_display_name = $2,
          alternate_email = $3,
          primary_email = $4,
          primary_first_name = $5,
          primary_last_name = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *;
      `;

      const values = [
        dto.domain,
        dto.orgDisplayName,
        dto.alternateEmail,
        dto.primaryContactInfo.email,
        dto.primaryContactInfo.firstName,
        dto.primaryContactInfo.lastName,
        id,
      ];

      const result = await this.dbService.executeQuery(query, values);

      if (result.length === 0) {
        throw new NotFoundException(`Reseller with ID ${id} not found`);
      }

      return this.utilService.successResponse(result[0], 'Reseller updated successfully');
    } catch (error) {
      console.error(`Error updating reseller with ID ${id}:`, error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to update reseller');
    }
  }

  // 📌 Delete Reseller
  async remove(id: number) {
    try {
      const query = 'DELETE FROM users  WHERE id = $1 RETURNING *';
      const result = await this.dbService.executeQuery(query, [id]);

      if (result.length === 0) {
        throw new NotFoundException(`Reseller with ID ${id} not found`);
      }

      return this.utilService.successResponse(
        `Reseller with ID ${id} deleted successfully`,
      );
    } catch (error) {
      console.error(`Error deleting reseller with ID ${id}:`, error);
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to delete reseller');
    }
  }

  // 📌 Bulk Delete Resellers
  async bulkDelete(ids: number[]) {
    try {
      const query = `DELETE FROM users  WHERE id = ANY($1::int[]) RETURNING id`;
      const result = await this.dbService.executeQuery(query, [ids]);

      return this.utilService.successResponse(
        result,
        `${result.length} reseller(s) deleted successfully`,
      );
    } catch (error) {
      console.error('Error during bulk delete:', error);
      throw new InternalServerErrorException('Failed to bulk delete resellers');
    }
  }
}
