import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID ?? 'billing-service',
        brokers,
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID ?? 'billing-svc',
      },
      subscribe: { fromBeginning: false },
    },
  });

  await app.listen();
}
bootstrap();