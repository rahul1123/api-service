import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Res,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ResellerService } from './reseller.service'; // ✅ Update your path accordingly
import { CreateResellerDto ,UpdateResellerDto} from './reseller.dto'; // ✅ Define DTOs

@ApiTags('resellers')
@Controller('resellers')
export class ResellerController {
  constructor(private readonly resellerService: ResellerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all resellers' })
  async getAll(@Res() res: Response) {
    try {
      const resellers = await this.resellerService.findAll();
      return res.status(HttpStatus.OK).json(resellers);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to fetch resellers');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reseller by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getOne(@Param('id') id: number, @Res() res: Response) {
    try {
      const reseller = await this.resellerService.findOne(id);
      return res.status(HttpStatus.OK).json(reseller);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to fetch reseller');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new reseller' })
  async create(@Body() payload: CreateResellerDto, @Res() res: Response) {
    try {
      const newReseller = await this.resellerService.create(payload);
      return res.status(HttpStatus.CREATED).json(newReseller);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to create reseller');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a reseller by ID' })
  @ApiParam({ name: 'id', type: Number })
  async update(
    @Param('id') id: number,
    @Body() payload: UpdateResellerDto,
    @Res() res: Response,
  ) {
    try {
      const updated = await this.resellerService.update(id, payload);
      return res.status(HttpStatus.OK).json(updated);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to update reseller');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reseller by ID' })
  @ApiParam({ name: 'id', type: Number })
  async delete(@Param('id') id: number, @Res() res: Response) {
    try {
      await this.resellerService.remove(id);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Reseller deleted successfully' });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to delete reseller');
    }
  }

}
