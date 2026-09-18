# DEC-001 — Start with one visible order lifecycle

- **Date:** 2026-09-18
- **Agent:** Project Lead / Developer
- **Context:** Empty repository; product specification requires a unified order domain.
- **Problem:** Building disconnected module mock-ups would obscure the core workflow.
- **Decision:** Deliver one functional local POS → order → kitchen lifecycle, with an explicit transition guard, before adding additional modules.
- **Reason:** It validates the product’s primary operational path and prevents invalid lifecycle jumps.
- **Evidence:** `src/order-engine.test.js` covers creation and valid/invalid transitions.
- **Result:** Implemented browser-local slice; backend persistence, authentication, and integrations remain unimplemented.
- **Status:** Approved for prototype baseline; not production-ready.
- **Related artefacts:** `src/order-engine.js`, `docs/architecture.md`
