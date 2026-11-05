import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { lastValueFrom } from 'rxjs';
import {
  ActivationRequested,
  ProvisioningCompletedPayload,
  ProvisioningFailedPayload,
  TOPICS,
  buildEvent,
} from '@poc/contracts';
import { ProvisioningOrder, ProvisioningOrderDocument } from './provisioning-order.schema';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class ProvisioningService implements OnModuleInit {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    @InjectModel(ProvisioningOrder.name) private readonly model: Model<ProvisioningOrderDocument>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async handleActivationRequested(event: ActivationRequested): Promise<void> {
    const activationId = event.correlationId;

    // Retardo simulado de 1 a 3 segundos
    await sleep(1000 + Math.floor(Math.random() * 2000));

    if (event.payload.simulateFailure === 'provisioning') {
      const failed = buildEvent<ProvisioningFailedPayload>({
        eventType: 'ProvisioningFailed',
        correlationId: activationId,
        customerId: event.customerId,
        source: 'provisioning-service',
        payload: { reason: 'Fallo de aprovisionamiento simulado' },
      });
      await lastValueFrom(
        this.kafka.emit(TOPICS.PROVISIONING_EVENTS, { key: event.customerId, value: failed }),
      );
      this.logger.warn(`ProvisioningFailed publicado: ${activationId}`);
      return;
    }

    const orderId = `ord-${randomUUID().slice(0, 8)}`;
    await this.model.create({
      activationId,
      customerId: event.customerId,
      orderId,
      status: 'COMPLETED',
    });

    const completed = buildEvent<ProvisioningCompletedPayload>({
      eventType: 'ProvisioningCompleted',
      correlationId: activationId,
      customerId: event.customerId,
      source: 'provisioning-service',
      payload: { orderId },
    });
    await lastValueFrom(
      this.kafka.emit(TOPICS.PROVISIONING_EVENTS, { key: event.customerId, value: completed }),
    );
    this.logger.log(`ProvisioningCompleted publicado: ${activationId} (${orderId})`);
  }
}
