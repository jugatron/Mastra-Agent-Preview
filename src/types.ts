export type Role = "customer" | "operator" | "system";
export type Channel = "web" | "messaging" | "voice";
export type OrderStatus = "received" | "in_production" | "shipped" | "exception";

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  trackingUrl?: string;
}
export interface ActorContext {
  actorId: string;
  role: Role;
  customerId?: string;
}
export interface InboundEvent {
  id: string;
  channel: Channel;
  customerId: string;
  text: string;
}
export interface AuditEvent {
  action: string;
  actorId: string;
  target: string;
  timestamp: string;
  outcome: "ok" | "rejected";
}
export interface Escalation {
  id: string;
  customerId: string;
  reason: string;
  status: "pending_human_review" | "resolved";
}
