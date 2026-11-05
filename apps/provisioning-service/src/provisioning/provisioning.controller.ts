import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ActivationRequested, TOPICS } from '@poc/contracts';
import { ProvisioningService } from './provisioning.service';

@Controller()
export class ProvisioningController {
  private readonly logger = new Logger(ProvisioningController.name);

  constructor(private readonly provisioning: ProvisioningService) {}

  @EventPattern(TOPICS.ACTIVATION_REQUESTED)
  async onActivationRequested(@Payload() event: ActivationRequested) {
    this.logger.log(`Recibido ActivationRequested ${event.correlationId}`);
    await this.provisioning.handleActivationRequested(event);
  }
}
