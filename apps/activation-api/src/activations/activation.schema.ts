import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'activations', timestamps: true, minimize: false })
export class Activation {
  @Prop({ type: String })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  customerId: string;

  @Prop({ type: String, required: true })
  planId: string;

  @Prop({ type: String, default: 'web' })
  channel: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, default: 'none' })
  simulateFailure: string;

  @Prop({ type: Object, default: {} })
  steps: Record<string, { status: string; at: string }>;

  @Prop({ type: [Object], default: [] })
  history: { eventType: string; at: string }[];
}

export type ActivationDocument = HydratedDocument<Activation>;
export const ActivationSchema = SchemaFactory.createForClass(Activation);