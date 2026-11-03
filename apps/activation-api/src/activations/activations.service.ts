import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { ActivationRequestedPayload, TOPICS, buildEvent } from '@poc/contracts';
import { Activation, ActivationDocument } from './activation.schema';
import { CreateActivationDto } from './create-activation.dto';

@Injectable()
export class ActivationsService implements OnModuleInit {
  private readonly logger = new Logger(ActivationsService.name);

  constructor(
    @InjectModel(Activation.name) private readonly model: Model<ActivationDocument>,
    @Inject('KAFKA_CLIENT') private readonly kafka: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async create(dto: CreateActivationDto) {
    const activationId = `act-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    await new this.model({
      _id: activationId,
      customerId: dto.customerId,
      planId: dto.planId,
      channel: dto.channel ?? 'web',
      simulateFailure: dto.simulateFailure ?? 'none',
      status: 'PENDING',
      steps: {},
      history: [{ eventType: 'ActivationRequested', at: now }],
    }).save();

    const event = buildEvent<ActivationRequestedPayload>({
      eventType: 'ActivationRequested',
      correlationId: activationId,
      customerId: dto.customerId,
      source: 'activation-api',
      payload: {
        planId: dto.planId,
        channel: dto.channel ?? 'web',
        simulateFailure: dto.simulateFailure ?? 'none',
      },
    });

    await lastValueFrom(
      this.kafka.emit(TOPICS.ACTIVATION_REQUESTED, {
        key: dto.customerId,
        value: event,
      }),
    );
    this.logger.log(`ActivationRequested publicado: ${activationId}`);

    return { activationId, status: 'PENDING' };
  }

   async findOne(id: string): Promise<Record<string, unknown>> {
    const doc = await this.model.findById(id).lean<Record<string, unknown>>();
    if (!doc) throw new NotFoundException(`Activación ${id} no existe`);
    return doc;
  }
}