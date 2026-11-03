import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { lastValueFrom } from 'rxjs';
import {
  ActivationRequested,
  BillingAccountCreatedPayload,
  BillingFailedPayload,
  TOPICS,
  buildEvent,
} from '@poc/contracts';
import { BillingAccount, BillingAccountDocument } from './billing-account.schema';

@Injectable()
export class BillingService implements OnModuleInit {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(BillingAccount.name) private readonly model: Model<BillingAccountDocument>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async handleActivationRequested(event: ActivationRequested): Promise<void> {
    const activationId = event.correlationId;

    // Fallo de negocio simulado: no es un error técnico, se publica como evento
    if (event.payload.simulateFailure === 'billing') {
      const failed = buildEvent<BillingFailedPayload>({
        eventType: 'BillingFailed',
        correlationId: activationId,
        customerId: event.customerId,
        source: 'billing-service',
        payload: { reason: 'Fallo de facturación simulado' },
      });
      await lastValueFrom(
        this.kafka.emit(TOPICS.BILLING_EVENTS, { key: event.customerId, value: failed }),
      );
      this.logger.warn(`BillingFailed publicado: ${activationId}`);
      return;
    }

    const accountId = `acc-${randomUUID().slice(0, 8)}`;
    await this.model.create({
      activationId,
      customerId: event.customerId,
      accountId,
      status: 'CREATED',
    });

    const created = buildEvent<BillingAccountCreatedPayload>({
      eventType: 'BillingAccountCreated',
      correlationId: activationId,
      customerId: event.customerId,
      source: 'billing-service',
      payload: { accountId },
    });
    await lastValueFrom(
      this.kafka.emit(TOPICS.BILLING_EVENTS, { key: event.customerId, value: created }),
    );
    this.logger.log(`BillingAccountCreated publicado: ${activationId} (${accountId})`);
  }
}