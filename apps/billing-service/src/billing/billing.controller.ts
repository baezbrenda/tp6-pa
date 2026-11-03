import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ActivationRequested, TOPICS } from '@poc/contracts';
import { BillingService } from './billing.service';

@Controller()
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billing: BillingService) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  async onActivationRequested(@Payload() event: ActivationRequested) {
    this.logger.log(`Recibido ActivationRequested ${event.correlationId}`);
    await this.billing.handleActivationRequested(event);
  }
}