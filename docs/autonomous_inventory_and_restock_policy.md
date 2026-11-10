# SMK Autonomous Multi-Agent Inventory & Restock Policy

**Last Updated:** November 2026  
**Document ID:** SMK-DOC-AI-004  
**Applies to:** Catalog Availability, Out-of-Stock Notifications & Autonomous Procurement

---

## 1. Overview of Autonomous Procurement
SMK operates on an event-driven retail architecture powered by **Apache Kafka** and autonomous **LangGraph multi-agent AI**:
- Every customer checkout generates a telemetry event to determine stock velocity and sales burn rate.
- When an item drops below safety thresholds, the autonomous inventory agent system evaluates supplier lead times, seasonal demand spikes, and minimum order quantities.
- Human-in-the-Loop (HITL) approval via interactive Slack cards ensures human manager governance before Purchase Orders (POs) are dispatched.

---

## 2. Customer "Notify Me" Out-of-Stock Subscription
When a product variant (specific size or color) is temporarily sold out:
1. An active **"Notify Me When Available"** button appears on the product page.
2. Logged-in customers or guests can submit their email address to join the restock queue.
3. As soon as the autonomous agent completes the replenishment flow and the item is scanned into our warehouse:
   - The Kafka restock consumer atomically updates database inventory.
   - An instant automated back-in-stock notification email is dispatched to all subscribed customers with a direct purchase link.
   - Subscribed customers receive an exclusive 24-hour priority reservation window before general catalog availability.

---

## 3. Replenishment Lead Times & Frequency
- **Fast-Moving Essentials:** Typically replenished within **24–48 hours** via local supplier contracts.
- **Seasonal & Designer Collections:** Restocked within **5–7 business days** depending on artisan and manufacturer schedules.
- **Limited Edition Drops:** Clearly marked as "Limited Run - No Restock Planned".

---

## 4. Safety Guardrails & Order Limits
To prevent hoarding and unauthorized bulk reselling:
- Customers are limited to a maximum of **5 units per product variant** in a single order.
- Automated agent replenishment cycles strictly enforce a safety cap (< 20 units per automated PO draft) unless explicitly overridden by a senior procurement manager.

