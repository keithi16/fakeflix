import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@tlc/shared-module/auth';
import { ClsService } from 'nestjs-cls';
import { plainToInstance } from 'class-transformer';
import { InvoiceService } from '../../../core/service/invoice.service';
import { InvoiceResponseDto } from '../dto/response/invoice-response.dto';

@Controller('invoices')
@UseGuards(AuthGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly clsService: ClsService,
  ) {}

  @Get()
  async getUserInvoices(): Promise<InvoiceResponseDto[]> {
    const userId = this.clsService.get('userId');
    const invoices = await this.invoiceService.getUserInvoices(userId);
    
    return invoices.map(invoice =>
      plainToInstance(InvoiceResponseDto, invoice, {
        excludeExtraneousValues: true,
      })
    );
  }

  @Get(':id')
  async getInvoice(@Param('id') id: string): Promise<InvoiceResponseDto> {
    const userId = this.clsService.get('userId');
    const invoice = await this.invoiceService.getInvoiceById(id, userId);
    
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    
    return plainToInstance(InvoiceResponseDto, invoice, {
      excludeExtraneousValues: true,
    });
  }
}

