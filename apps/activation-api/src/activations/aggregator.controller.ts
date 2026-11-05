import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventEnvelope, TOPICS } from '@poc/contracts';
import { AggregatorService } from './aggregator.service';

@Controller()
export class AggregatorController {
  constructor(private readonly aggregator: AggregatorService) {}

  @EventPattern(TOPICS.BILLING_EVENTS)
  onBilling(@Payload() event: EventEnvelope<any>) {
    return this.aggregator.handleResult(event, 'billing');
  }

  @EventPattern(TOPICS.PROVISIONING_EVENTS)
  onProvisioning(@Payload() event: EventEnvelope<any>) {
    return this.aggregator.handleResult(event, 'provisioning');
  }
}
