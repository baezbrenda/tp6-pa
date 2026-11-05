import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ProvisioningOrder,
  ProvisioningOrderSchema,
} from './provisioning/provisioning-order.schema';
import { ProvisioningController } from './provisioning/provisioning.controller';
import { ProvisioningService } from './provisioning/provisioning.service';

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27018/provisioning?directConnection=true',
    ),
    MongooseModule.forFeature([
      { name: ProvisioningOrder.name, schema: ProvisioningOrderSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'provisioning-service-producer', brokers },
        },
      },
    ]),
  ],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
})
export class AppModule {}
