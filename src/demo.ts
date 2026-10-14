import { OperationsService } from "./operations.ts";
import type { InboundEvent } from "./types.ts";

/** Offline example: no secrets, model calls or customer systems. */
const ops = new OperationsService([
  { id: "DEMO-1024", customerId: "customer-demo", status: "in_production" }
]);
const event: InboundEvent = {
  id: "demo-event-1", customerId: "customer-demo", channel: "messaging", text: "Where is my order?"
};
const context = { actorId: "demo-user", role: "customer" as const, customerId: event.customerId };
const result = await ops.processInbound(event, async () => {
  const order = ops.lookupOrder(context, "DEMO-1024");
  const review = ops.requestEscalation(context, event.customerId, "Customer requested a production update");
  return { order, review };
});
console.log(JSON.stringify({ result, audit: ops.audit }, null, 2));
