import { Injectable } from '@nestjs/common';
import {
  PaymentRequest,
  PaymentResponse,
  RefundResponse,
} from '../../../core/interface/payment-result.interface';
import { PaymentStatus } from '../../../core/enum/payment-status.enum';

/**
 * PAYMENT GATEWAY CLIENT
 * 
 * HTTP client for payment gateway integration (Stripe, Braintree, etc).
 * 
 * Features:
 * - 90% success rate (realistic failure simulation)
 * - Various failure reasons (insufficient funds, card declined, etc)
 * - Simulated latency (500-1000ms for payment processing)
 * - Transaction ID generation
 * - Refund processing
 */
@Injectable()
export class PaymentGatewayClient {
  /**
   * Process a payment
   * 
   * Simulates credit card / payment method charging.
   * 
   * @param paymentData - Payment request details
   * @returns Payment result
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async processPayment(_paymentData: PaymentRequest): Promise<PaymentResponse> {
    // Simulate payment processing time
    await this.simulatePaymentLatency();
    
    // Simulate 90% success rate
    const success = Math.random() > 0.10; // 10% failure rate
    
    if (success) {
      return {
        success: true,
        status: PaymentStatus.Succeeded,
        transactionId: this.generateTransactionId(),
        processedAt: new Date(),
      };
    } else {
      // Generate realistic failure reason
      const failureReason = this.getRandomFailureReason();
      
      return {
        success: false,
        status: PaymentStatus.Failed,
        failureReason,
        processedAt: new Date(),
      };
    }
  }

  /**
   * Refund a payment
   * 
   * Simulates refund processing.
   * 
   * @param transactionId - Original transaction ID
   * @param amount - Amount to refund
   * @returns Refund result
   */
  async refundPayment(_transactionId: string, amount: number): Promise<RefundResponse> {
    // Simulate refund processing time
    await this.simulatePaymentLatency();
    
    return {
      success: true,
      refundId: this.generateTransactionId('REFUND'),
      amount,
      processedAt: new Date(),
    };
  }

  /**
   * Generate a transaction ID
   * 
   * Format: PAY-{timestamp}-{random}
   * 
   * @param prefix - Optional prefix
   * @returns Transaction ID
   */
  private generateTransactionId(prefix = 'PAY'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get a random realistic payment failure reason
   * 
   * @returns Failure reason
   */
  private getRandomFailureReason(): string {
    const reasons = [
      'Insufficient funds',
      'Card declined',
      'Invalid card number',
      'Card expired',
      'CVC check failed',
      'Processing error',
      'Bank declined transaction',
      'Card issuer unavailable',
      'Suspected fraud',
      'Amount exceeds limit',
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  /**
   * Simulate payment processing latency
   * 
   * Realistic payment processing: 500-1000ms
   */
  private async simulatePaymentLatency(): Promise<void> {
    const latency = 500 + Math.random() * 500; // 500-1000ms
    await new Promise(resolve => setTimeout(resolve, latency));
  }
}

