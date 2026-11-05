import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Activation, ActivationSchema } from './activations/activation.schema';
import { ActivationsController } from './activations/activations.controller';
import { ActivationsService } from './activations/activations.service';
import { AggregatorController } from './activations/aggregator.controller';
import { AggregatorService } from './activations/aggregator.service';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27018/activation?directConnection=true',
    ),
    MongooseModule.forFeature([{ name: Activation.name, schema: ActivationSchema }]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: process.env.KAFKA_CLIENT_ID ?? 'activation-api',
            brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
          },
        },
      },
    ]),
  ],
  controllers: [ActivationsController, AggregatorController],
  providers: [ActivationsService, AggregatorService],
})
export class AppModule {}
