import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { OperationsService } from "../src/operations.ts";
import { parseInboundEvent, verifyWebhookSignature } from "../src/webhook.ts";

const orders = [{ id: "order-1", customerId: "customer-1", status: "shipped" as const }];

test("customers cannot read another customer's order", () => {
  const ops = new OperationsService(orders);
  assert.throws(() => ops.lookupOrder({ actorId: "customer-2", role: "customer", customerId: "customer-2" }, "order-1"));
  assert.equal(ops.audit[0]?.outcome, "rejected");
});

test("authorized customers can read their orders", () => {
  const ops = new OperationsService(orders);
  assert.equal(ops.lookupOrder({ actorId: "customer-1", role: "customer", customerId: "customer-1" }, "order-1").status, "shipped");
});

test("customers cannot resolve approvals", () => {
  const ops = new OperationsService(orders);
  const owner = { actorId: "customer-1", role: "customer" as const, customerId: "customer-1" };
  const item = ops.requestEscalation(owner, "customer-1", "Please check an exception");
  assert.throws(() => ops.resolveEscalation(owner, item.id), /authorization/i);
  assert.equal(ops.resolveEscalation({ actorId: "operator-1", role: "operator" }, item.id).status, "resolved");
});

test("duplicate webhook deliveries execute only once", async () => {
  const ops = new OperationsService(orders);
  let counter = 0;
  const event = { id: "message-10", customerId: "customer-1", channel: "web" as const, text: "Hi" };
  const one = await ops.processInbound(event, async () => ++counter);
  const two = await ops.processInbound(event, async () => ++counter);
  assert.deepEqual([one.duplicate, two.duplicate, counter], [false, true, 1]);
});

test("failed webhook processing can be retried", async () => {
  const ops = new OperationsService(orders);
  const event = { id: "message-11", customerId: "customer-1", channel: "web" as const, text: "Hi" };
  await assert.rejects(() => ops.processInbound(event, async () => { throw new Error("temporary"); }));
  const ret = await ops.processInbound(event, async () => "ok");
  assert.equal(ret.result, "ok");
});

test("webhook signature rejects tampered payloads", () => {
  const raw = JSON.stringify({ id: "msg", customerId: "demo", channel: "web", text: "Hello" });
  const secret = "test-secret";
  const sig = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  assert.equal(verifyWebhookSignature(raw, sig, secret), true);
  assert.equal(verifyWebhookSignature(raw + " ", sig, secret), false);
  assert.equal(parseInboundEvent(raw).id, "msg");
});
