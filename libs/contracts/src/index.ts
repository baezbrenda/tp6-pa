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