import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BillingAccount, BillingAccountSchema } from './billing/billing-account.schema';
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27018/billing?directConnection=true',
    ),
    MongooseModule.forFeature([{ name: BillingAccount.name, schema: BillingAccountSchema }]),
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'billing-service-producer', brokers },
        },
      },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class AppModule {}