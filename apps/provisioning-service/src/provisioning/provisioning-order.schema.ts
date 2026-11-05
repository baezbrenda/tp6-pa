import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'provisioning_orders', timestamps: true })
export class ProvisioningOrder {
  @Prop({ type: String, required: true, unique: true })
  activationId: string;

  @Prop({ type: String, required: true })
  customerId: string;

  @Prop({ type: String, required: true })
  orderId: string;

  @Prop({ type: String, required: true, default: 'COMPLETED' })
  status: string;
}

export type ProvisioningOrderDocument = HydratedDocument<ProvisioningOrder>;
export const ProvisioningOrderSchema = SchemaFactory.createForClass(ProvisioningOrder);
