import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'billing_accounts', timestamps: true })
export class BillingAccount {
  @Prop({ type: String, required: true, unique: true })
  activationId: string;

  @Prop({ type: String, required: true })
  customerId: string;

  @Prop({ type: String, required: true })
  accountId: string;

  @Prop({ type: String, required: true, default: 'CREATED' })
  status: 'CREATED' | 'CANCELLED';
}

export type BillingAccountDocument = HydratedDocument<BillingAccount>;
export const BillingAccountSchema = SchemaFactory.createForClass(BillingAccount);