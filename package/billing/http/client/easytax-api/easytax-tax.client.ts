import { Injectable } from '@nestjs/common';
import { AppLogger } from '@tlc/shared-module/logger';
import {
  EasyTaxTransactionRequest,
  EasyTaxResponse,
  EasyTaxResponseLine,
  Address,
  TaxDetail,
  EasyTaxLineItem,
} from '../../../core/interface/tax-calculation.interface';

/**
 * EASYTAX TAX CLIENT
 * 
 * HTTP client for EasyTax external tax calculation API.
 * 
 * In production, this would:
 * - Make HTTP calls to EasyTax API
 * - Handle authentication
 * - Manage rate limiting
 * - Handle retries and circuit breaking
 * 
 * For demonstration, we:
 * - Mock realistic tax calculations
 * - Simulate API latency (100-300ms)
 * - Simulate occasional errors (5% failure rate)
 * - Return detailed jurisdiction breakdowns
 */
@Injectable()
export class EasyTaxClient {
  constructor(
    private readonly appLogger: AppLogger,
  ) {}

  /**
   * Create a tax transaction with EasyTax
   * 
   * Calculates taxes for all line items based on ship-from and ship-to addresses.
   * Returns detailed breakdown by jurisdiction (state, county, city, district).
   * 
   * @param request - Tax calculation request
   * @returns Tax calculation response with line-by-line breakdown
   */
  async createTransaction(request: EasyTaxTransactionRequest): Promise<EasyTaxResponse> {
    // Simulate API latency
    await this.simulateLatency();
    
    // Simulate occasional errors (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error('EasyTax API error: Service temporarily unavailable');
    }
    
    // Calculate taxes for each line
    const lines: EasyTaxResponseLine[] = request.lines.map((line: EasyTaxLineItem) => {
      // Determine tax rate based on ship-to address
      const taxRate = this.calculateTaxRate(line.addresses.shipTo);
      const tax = line.amount * taxRate;
      
      return {
        lineNumber: line.number,
        tax,
        rate: taxRate,
        taxableAmount: line.amount,
        jurisdictions: this.getJurisdictions(line.addresses.shipTo),
        details: this.getTaxDetails(line.amount, taxRate, line.addresses.shipTo),
      };
    });
    
    // Calculate total tax
    const totalTax = lines.reduce((sum, line) => sum + line.tax, 0);
    
    // Generate transaction ID
    const transactionId = `EASY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    return {
      totalTax,
      lines,
      transactionId,
    };
  }

  /**
   * Commit a tax transaction
   * 
   * In production, this would finalize the transaction with EasyTax,
   * making it part of official tax reporting.
   * 
   * Should be called after payment succeeds.
   * 
   * @param transactionId - Transaction ID to commit
   */
  async commitTransaction(transactionId: string): Promise<void> {
    // Simulate API latency
    await this.simulateLatency();
    
    this.appLogger.log('EasyTax transaction committed', {
      transactionId,
    });
  }

  /**
   * Calculate tax rate based on address
   * 
   * Realistic tax rates by state:
   * - California: 7.25% state + local (up to 10.5%)
   * - Texas: 6.25% state + local (up to 8.25%)
   * - New York: 4% state + local (up to 8.875%)
   * - Florida: 6% state + local (up to 7.5%)
   * 
   * @param address - Ship-to address
   * @returns Combined tax rate
   */
  private calculateTaxRate(address: Address): number {
    const stateTaxRates: Record<string, number> = {
      'CA': 0.0825,  // California: 8.25%
      'TX': 0.0725,  // Texas: 7.25%
      'NY': 0.08,    // New York: 8%
      'FL': 0.065,   // Florida: 6.5%
      'WA': 0.092,   // Washington: 9.2%
      'IL': 0.0625,  // Illinois: 6.25%
    };
    
    return stateTaxRates[address.state] || 0.07; // Default 7%
  }

  /**
   * Get jurisdiction names for an address
   * 
   * Returns hierarchical jurisdiction breakdown:
   * [State, County, City, Special District]
   * 
   * @param address - Address
   * @returns Array of jurisdiction names
   */
  private getJurisdictions(address: Address): string[] {
    // Mock jurisdiction hierarchy
    const jurisdictions = [address.state];
    
    // Add county (mock)
    if (address.city === 'Los Angeles') {
      jurisdictions.push('Los Angeles County');
    } else if (address.city === 'San Francisco') {
      jurisdictions.push('San Francisco County');
    } else {
      jurisdictions.push(`${address.city} County`);
    }
    
    // Add city
    jurisdictions.push(address.city);
    
    // Sometimes add special districts
    if (Math.random() > 0.7) {
      jurisdictions.push('Special District');
    }
    
    return jurisdictions;
  }

  /**
   * Get detailed tax breakdown by jurisdiction
   * 
   * @param amount - Taxable amount
   * @param totalRate - Total tax rate
   * @param address - Address
   * @returns Array of tax details
   */
  private getTaxDetails(amount: number, totalRate: number, address: Address): TaxDetail[] {
    // Break down total rate into jurisdiction components
    const stateRate = totalRate * 0.6; // 60% is state tax
    const countyRate = totalRate * 0.25; // 25% is county tax
    const cityRate = totalRate * 0.15; // 15% is city tax
    
    return [
      {
        taxName: `${address.state} State Sales Tax`,
        taxableAmount: amount,
        taxAmount: amount * stateRate,
        taxRate: stateRate,
        jurisdiction: address.state,
      },
      {
        taxName: `${address.city} County Tax`,
        taxableAmount: amount,
        taxAmount: amount * countyRate,
        taxRate: countyRate,
        jurisdiction: `${address.city} County`,
      },
      {
        taxName: `${address.city} City Tax`,
        taxableAmount: amount,
        taxAmount: amount * cityRate,
        taxRate: cityRate,
        jurisdiction: address.city,
      },
    ];
  }

  /**
   * Simulate API network latency
   * 
   * Realistic latency: 100-300ms
   */
  private async simulateLatency(): Promise<void> {
    const latency = 100 + Math.random() * 200; // 100-300ms
    await new Promise(resolve => setTimeout(resolve, latency));
  }
}

