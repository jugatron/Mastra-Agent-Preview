import type { ActorContext, AuditEvent, Escalation, InboundEvent, Order } from "./types.ts";

/** Synthetic in-memory domain logic. Real deployments require durable data stores. */
export class OperationsService {
  readonly audit: AuditEvent[] = [];
  readonly escalations: Escalation[] = [];
  private orders = new Map<string, Order>();
  private claimedEvents = new Set<string>();

  constructor(orders: Order[] = []) {
    for (const order of orders) this.orders.set(order.id, { ...order });
  }

  private record(action: string, actor: ActorContext, target: string, outcome: "ok" | "rejected") {
    this.audit.push({ action, actorId: actor.actorId, target, outcome, timestamp: new Date().toISOString() });
  }

  lookupOrder(actor: ActorContext, orderId: string): Order {
    const order = this.orders.get(orderId);
    const allowed = !!order && (actor.role !== "customer" || actor.customerId === order.customerId);
    this.record("lookup_order", actor, orderId, allowed ? "ok" : "rejected");
    if (!allowed || !order) throw new Error("Order unavailable");
    return { ...order };
  }

  /** Anyone can request a review for their own records; only staff may resolve it. */
  requestEscalation(actor: ActorContext, customerId: string, reason: string): Escalation {
    const allowed = actor.role !== "customer" || actor.customerId === customerId;
    const safeReason = reason.trim().slice(0, 280);
    this.record("request_escalation", actor, customerId, allowed && !!safeReason ? "ok" : "rejected");
    if (!allowed || !safeReason) throw new Error("Escalation unavailable");
    const escalation: Escalation = {
      id: "esc-" + (this.escalations.length + 1),
      customerId,
      reason: safeReason,
      status: "pending_human_review"
    };
    this.escalations.push(escalation);
    return { ...escalation };
  }

  resolveEscalation(actor: ActorContext, id: string): Escalation {
    const escalation = this.escalations.find(item => item.id === id);
    const allowed = !!escalation && (actor.role === "operator" || actor.role === "system");
    this.record("resolve_escalation", actor, id, allowed ? "ok" : "rejected");
    if (!allowed || !escalation) throw new Error("Operator authorization required");
    escalation.status = "resolved";
    return { ...escalation };
  }

  /** Event claims are in-memory and intentionally only suitable for this demo. */
  async processInbound<T>(event: InboundEvent, action: () => Promise<T>): Promise<{ duplicate: boolean; result?: T }> {
    if (this.claimedEvents.has(event.id)) return { duplicate: true };
    this.claimedEvents.add(event.id);
    try {
      const result = await action();
      return { duplicate: false, result };
    } catch (error) {
      this.claimedEvents.delete(event.id);
      throw error;
    }
  }
}
