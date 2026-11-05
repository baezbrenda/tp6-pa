import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import {
  ActivationCompletedPayload,
  ActivationFailedPayload,
  EventEnvelope,
  TOPICS,
  buildEvent,
} from '@poc/contracts';
import { Activation, ActivationDocument } from './activation.schema';

type Step = 'billing' | 'provisioning';

const OK_EVENTS = ['BillingAccountCreated', 'ProvisioningCompleted'];
const FAILED_EVENTS = ['BillingFailed', 'ProvisioningFailed'];

@Injectable()
export class AggregatorService {
  private readonly logger = new Logger(AggregatorService.name);

  constructor(
    @InjectModel(Activation.name) private readonly model: Model<ActivationDocument>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
  ) {}

  async handleResult(event: EventEnvelope<any>, step: Step): Promise<void> {
    const id = event.correlationId;
    const at = new Date().toISOString();
    const isOk = OK_EVENTS.includes(event.eventType);
    const isFailed = FAILED_EVENTS.includes(event.eventType);

    // Siempre se registra en el historial (también eventos tardíos o de compensación)
    const update: Record<string, any> = { $push: { history: { eventType: event.eventType, at } } };
    if (isOk || isFailed) {
      update.$set = { [`steps.${step}`]: { status: isOk ? 'OK' : 'FAILED', at } };
    }
    const doc: any = await this.model.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) {
      this.logger.warn(`Resultado para activación desconocida: ${id}`);
      return;
    }
    if (!isOk && !isFailed) return;

    // PENDING -> IN_PROGRESS con el primer resultado
    await this.model.updateOne({ _id: id, status: 'PENDING' }, { $set: { status: 'IN_PROGRESS' } });

    if (isFailed) {
      // Solo el primer fallo transiciona a FAILED y publica
      const moved = await this.model.findOneAndUpdate(
        { _id: id, status: { $in: ['PENDING', 'IN_PROGRESS'] } },
        { $set: { status: 'FAILED' }, $push: { history: { eventType: 'ActivationFailed', at } } },
        { new: true },
      );
      if (!moved) return;
      const failed = buildEvent<ActivationFailedPayload>({
        eventType: 'ActivationFailed',
        correlationId: id,
        customerId: doc.customerId,
        source: 'activation-api',
        payload: { reason: event.payload?.reason ?? 'Fallo', failedStep: step },
      });
      await lastValueFrom(
        this.kafka.emit(TOPICS.ACTIVATION_EVENTS, { key: doc.customerId, value: failed }),
      );
      this.logger.warn(`ActivationFailed publicado: ${id} (${step})`);
      return;
    }

    // Éxito: si ambos pasos están OK, transiciona a ACTIVE (solo una vez)
    const steps = doc.steps ?? {};
    if (steps.billing?.status === 'OK' && steps.provisioning?.status === 'OK') {
      const moved = await this.model.findOneAndUpdate(
        { _id: id, status: { $in: ['PENDING', 'IN_PROGRESS'] } },
        { $set: { status: 'ACTIVE' }, $push: { history: { eventType: 'ActivationCompleted', at } } },
        { new: true },
      );
      if (!moved) return;
      const completed = buildEvent<ActivationCompletedPayload>({
        eventType: 'ActivationCompleted',
        correlationId: id,
        customerId: doc.customerId,
        source: 'activation-api',
        payload: { planId: doc.planId },
      });
      await lastValueFrom(
        this.kafka.emit(TOPICS.ACTIVATION_EVENTS, { key: doc.customerId, value: completed }),
      );
      this.logger.log(`ActivationCompleted publicado: ${id}`);
    }
  }
}
