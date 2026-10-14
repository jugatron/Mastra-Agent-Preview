# Mastra Agent Preview — Agentic Operations Showcase

A clean-room, **privacy-safe** portfolio project demonstrating how I design tool-using business agents with Mastra and TypeScript.

**Disclosure:** This is an original, synthetic engineering demonstration inspired by patterns used in my professional work. It is NOT a copy, export, or fork of a private client repository, and it does not contain real client data, credentials, proprietary schemas, infrastructure URLs, or conversation history.

## What it demonstrates

- A Mastra Agent with typed tools for checking orders and requesting human review
- Record-level authorization enforced by backend code, not just an AI prompt
- Human escalation for sensitive or uncertain situations
- HMAC webhook verification over the raw request body
- At-least-once event processing with duplicate-event protection and retry on failure
- Audit trails for both accepted and rejected operations
- Offline tests and demo fixtures with fictional records

## Architecture

Inbound message -> validate signature and schema -> deduplicate event -> Mastra agent -> typed domain tools -> authorization + audit -> answer or human escalation.

## Run locally (no credentials required)

Requires Node.js 22.13 or newer.

1. Install Node.js 22.13+.
2. Run: npm test
3. Run: npm run demo

The demo and tests run entirely offline using built-in Node.js capabilities.

## Mastra integration

src/mastra-agent.ts illustrates the Mastra agent and typed tool bindings. To connect it to an actual model, install dependencies, provide your OWN model API key in an ignored local .env file, and wire buildSupportAgent() into an authenticated application endpoint. This example is not a production-ready HTTP server.

## Production-hardening roadmap

- Replace in-memory stores and deduplication with durable PostgreSQL transactions and uniqueness constraints
- Introduce authentication, strict tenancy, key rotation, queues, rate limits, and observability
- Gate sensitive actions behind durable human approval workflows
- Add model/tool evals, metrics for completion quality, time, cost, and escalation performance
- Test prompt injection, multi-tenant isolation, and retry behavior under concurrency

## Privacy & limitations

All business identifiers and events are intentionally fictional. No private customer application has been made public, and no private Git history was copied. See SECURITY.md.
