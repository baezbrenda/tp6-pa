import { randomUUID } from 'crypto';
export const TOPICS = {
  ACTIVATION_REQUESTED: 'activation.requested',
  BILLING_EVENTS: 'billing.events',
  PROVISIONING_EVENTS: 'provisioning.events',
  ACTIVATION_EVENTS: 'activation.events',
} as const;

export const dlq = (topic: string) => `${topic}.dlq`;

export type EventType =
  | 'ActivationRequested'
  | 'BillingAccountCreated'
  | 'BillingFailed'
  | 'BillingAccountCancelled'
  | 'ProvisioningCompleted'
  | 'ProvisioningFailed'
  | 'ActivationCompleted'
  | 'ActivationFailed';

export type FailureMode = 'none' | 'billing' | 'provisioning';

export type ActivationStatus = 'PENDING' | 'IN_PROGRESS' | 'ACTIVE' | 'FAILED';

export interface EventEnvelope<T = unknown> {
  eventId: string;        
  eventType: EventType;
  version: number;
  occurredAt: string;     
  correlationId: string;  
  customerId: string;     
  source: string;
  payload: T;
}

export interface ActivationRequestedPayload {
  planId: string;
  channel: string;
  simulateFailure: FailureMode;
}

export type ActivationRequested = EventEnvelope<ActivationRequestedPayload>;

export interface BillingAccountCreatedPayload { accountId: string; }
export interface BillingFailedPayload { reason: string; }
export interface BillingAccountCancelledPayload { accountId: string; reason: string; }
export interface ProvisioningCompletedPayload { orderId: string; }
export interface ProvisioningFailedPayload { reason: string; }
export interface ActivationCompletedPayload { planId: string; }
export interface ActivationFailedPayload { reason: string; failedStep: 'billing' | 'provisioning'; }

export type BillingAccountCreated = EventEnvelope<BillingAccountCreatedPayload>;
export type BillingFailed = EventEnvelope<BillingFailedPayload>;
export type BillingAccountCancelled = EventEnvelope<BillingAccountCancelledPayload>;
export type ProvisioningCompleted = EventEnvelope<ProvisioningCompletedPayload>;
export type ProvisioningFailed = EventEnvelope<ProvisioningFailedPayload>;
export type ActivationCompleted = EventEnvelope<ActivationCompletedPayload>;
export type ActivationFailed = EventEnvelope<ActivationFailedPayload>;

export function buildEvent<T>(params: {
  eventType: EventType;
  correlationId: string;
  customerId: string;
  source: string;
  payload: T;
  version?: number;
}): EventEnvelope<T> {
  return {
    eventId: randomUUID(),
    eventType: params.eventType,
    version: params.version ?? 1,
    occurredAt: new Date().toISOString(),
    correlationId: params.correlationId,
    customerId: params.customerId,
    source: params.source,
    payload: params.payload,
  };
}