# SMK

[![Storefront Deployment](https://img.shields.io/badge/Storefront-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://smk-tan.vercel.app/)
[![Agents Deployment](https://img.shields.io/badge/Multi--Agent%20System-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://ecommerce-agents.onrender.com)

> **SMK** is a production-grade, full-stack e-commerce application with a customer storefront, checkout flow, role-protected administration features, and autonomous inventory replenishment powered by event-driven multi-agent AI.

---

## 🌐 Live Deployments & Quick Access

| Service | Environment / Platform | Direct URL | Description |
| :--- | :--- | :--- | :--- |
| **🛍️ SMK Storefront & Customer Web App** | **Vercel** | [https://smk-tan.vercel.app/](https://smk-tan.vercel.app/) | Live production customer storefront, catalog browsing, cart, and checkout. |
| **🤖 Autonomous Procurement Multi-Agent Hub** | **Render** | [https://ecommerce-agents.onrender.com](https://ecommerce-agents.onrender.com) | Real-time multi-agent command center, PO approval UI, and ERP datastore. |

---

## Features

- Product browsing with categories, sizes, colors, HSN/tax data, stock, search/filter views, and product details
- Cart and wishlist management, including persisted user data
- Checkout with saved addresses, billing details, shipping configuration, order notes, and shipping charges
- Razorpay online payments with payment verification and payment-failure handling
- Cash-on-delivery order type in the domain model
- Customer accounts with password authentication, email OTP login/registration/password reset, and Google sign-in
- Customer order history, order details, invoices, order status history, and dispute actions
- Product reviews, review visibility controls, and out-of-stock notification requests
- Admin dashboard with product, category, size, color, HSN, user, order, company-information, courier, and shipping configuration management
- Admin order status updates and role management
- Audit logging for API activity and audit-log statistics
- Autonomous inventory agent integration: Emits low-stock Kafka events upon customer order placement and consumes agent replenishment events to automatically restock products and notify subscribed customers
- File uploads using Cloudflare R2-compatible object storage, with signed upload/download support
- Email delivery through SMTP for OTP and application messages

## Stack

### Frontend (`web_client`)

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS, Ant Design, and custom CSS
- Redux Toolkit and React Redux for cart, wishlist, product, and UI state
- Axios for API requests
- NextAuth/Google OAuth-related integrations
- Razorpay Checkout.js for online payments

### Backend (`server`)

- Node.js with Express 5 using ES modules
- Prisma ORM 7
- PostgreSQL 15
- Apache Kafka client (`kafkajs`) for event-driven autonomous inventory replenishment
- JWT authentication, bcrypt password hashing, Joi validation, Helmet, CORS, and Morgan logging
- Razorpay server SDK for payment order creation and verification
- Nodemailer for SMTP email
- AWS SDK S3 client for R2-compatible file storage

## Project structure

```text
.
├── web_client/       # Next.js storefront and admin UI
├── server/            # Express API and Prisma schema/migrations
├── docker-compose.yml # Local PostgreSQL service
└── NOTES.md           # Project-specific development notes
```

## Requirements

- Node.js 20 or later
- npm
- Docker and Docker Compose, or an available PostgreSQL 15 database

## Local setup

1. Start PostgreSQL with Docker Compose:

   ```bash
   docker compose up -d postgres
   ```

2. Configure the API environment:

   ```bash
   cd server
   cp env.example .env
   ```

   Set at least `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `SERVER_ADDRESS`, and the Razorpay credentials. Configure SMTP for email/OTP functionality and R2 variables when using object-storage uploads.

3. Install API dependencies, apply Prisma migrations, and start the API:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run dev
   ```

   The API is mounted under `/api`. The development frontend configuration expects `http://localhost:4000/api`; set `PORT=4000` if using that default.

4. Configure and start the frontend in a second terminal:

   ```bash
   cd web_client
   npm install
   touch .env.local
   npm run dev
   ```

   Update `NEXT_PUBLIC_API_BASE_URL` and provide the required Google and Razorpay public settings in `.env.local`.

## Environment variables

The server template is available at [`server/env.example`](server/env.example). Important server variables include:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | JWT configuration |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Server-side Razorpay integration |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | OTP and email delivery |
| `R2_*` | Optional Cloudflare R2-compatible file storage |
| `GOOGLE_CLIENT_ID` | Server-side Google token verification |
| `MOCK_ERP_URL` | URL of the autonomous procurement agent / ERP service (defaults to `http://localhost:8002`, production: `https://ecommerce-agents.onrender.com`) |
| `INVENTORY_AGENT_ENABLED` | Feature flag to enable Kafka stock event publishing & replenishment consumer (`true`/`1`) |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker endpoints (e.g., `localhost:9092` or managed Kafka broker) |
| `KAFKA_TOPIC_INVENTORY_EVENTS` | Kafka topic for outbound low-stock events (defaults to `inventory-events`) |
| `KAFKA_TOPIC_RESTOCK_EVENTS` | Kafka topic for inbound stock replenishment events (defaults to `inventory-restock`) |
| `KAFKA_RESTOCK_CONSUMER_GROUP_ID` | Consumer group ID for backend restock listener (defaults to `smk-backend-restock-group`) |
| `KAFKA_SECURITY_PROTOCOL`, `KAFKA_SASL_MECHANISM` | Optional Kafka SASL/SSL authentication settings for cloud brokers |
| `KAFKA_USERNAME`, `KAFKA_PASSWORD`, `KAFKA_CA_PATH` | Optional credentials & CA cert for secure Kafka connections |

The frontend uses `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RAZORPAY_CHECKOUT_LINK`, `NEXT_PUBLIC_PAYMENT_TIMEOUT_SECONDS`, and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

Do not commit real credentials or private environment files.

## 🔄 Kafka Event-Driven Autonomous Procurement Workflow

SMK integrates with an autonomous multi-agent procurement system ([`ecommerce-agents`](../ecommerce-agents)) via **Apache Kafka**. This creates a fully automated, closed-loop inventory replenishment cycle:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SMK STOREFRONT & BACKEND                             │
│                                                                                        │
│  [Customer Checkout]                                                                   │
│          │                                                                             │
│          ▼ (Payment Success)                                                           │
│  [Stock Decremented in DB]                                                             │
│          │                                                                             │
│          ▼ (publishInventoryEvent)                                                     │
│   Kafka Topic: `inventory-events` ────────┐                                            │
│                                           │                                            │
│                                           ▼                                            │
│                       ┌───────────────────────────────────────┐                        │
│                       │    AUTONOMOUS PROCUREMENT AGENTS      │                        │
│                       │      (`ecommerce-agents` service)     │                        │
│                       │                                       │                        │
│                       │  1. Deterministic Zero-Token Filter   │                        │
│                       │  2. Inventory Analyst (Sales Burn Rate)                        │
│                       │  3. PO Manager (Draft PO Generation)  │                        │
│                       │  4. Slack / UI Human Approval (HITL)  │                        │
│                       └───────────────────┬───────────────────┘                        │
│                                           │                                            │
│   Kafka Topic: `inventory-restock` ◄──────┘ (produce_restock_event upon approval)     │
│          │                                                                             │
│          ▼ (startRestockConsumer)                                                      │
│  [Restock Consumer: validate qty < 20]                                                 │
│          │                                                                             │
│          ▼ (productService.restockProduct)                                             │
│  [Database Stock Incremented] ───► [Trigger Customer Restock Email Notifications]      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. How Kafka Events Trigger the Workflow (Outbound Trigger)

When a customer places an order and payment is verified via Razorpay:
1. **Stock Decrement**: In [`server/services/orders.js`](server/services/orders.js), the order transitions to `PLACED` within a database transaction, decrementing product inventory.
2. **Feature Flag Check**: The backend verifies `INVENTORY_AGENT_ENABLED=true` (or `INVENTORY_AGENT=enabled`).
3. **Event Dispatch**: [`server/services/inventoryAgentProducer.js`](server/services/inventoryAgentProducer.js) dispatches an inventory level event to Kafka topic `inventory-events`:
   - Partition key: Product `slug` or `sku`.
   - Payload schema:
     ```json
     {
       "event_id": "evt-1730635200000-abc123",
       "timestamp": "2026-11-03T12:00:00.000Z",
       "sku": "classic-heavyweight-cotton-t-shirt",
       "slug": "classic-heavyweight-cotton-t-shirt",
       "product_id": 101,
       "product_name": "Classic Heavyweight Cotton T-Shirt",
       "current_stock": 4,
       "reorder_threshold": 10
     }
     ```
4. **Mock ERP Sync**: The producer also pushes an asynchronous activity record to the Mock ERP dashboard ([`https://ecommerce-agents.onrender.com/api/v1/activities`](https://ecommerce-agents.onrender.com/api/v1/activities) in production, or `http://localhost:8002/api/v1/activities` locally) so administrators see real-time order depletion on the command center monitor.

### 2. Multi-Agent Processing & Human-in-the-Loop Approval

Once published to `inventory-events`, the external [`ecommerce-agents`](../ecommerce-agents) system ingests the message:
- **Zero-Token Pre-Filter**: If remaining stock is healthy (`current_stock > reorder_threshold`) or if a draft PO is already pending for this SKU, the agent system skips processing immediately with zero LLM token cost.
- **Agent Analysis**: If stock is low (`current_stock <= reorder_threshold`), the multi-agent graph calculates the optimal replenishment quantity based on 30-day sales velocity, supplier MOQ, and lead time.
- **Draft PO & Human Approval**: The system creates a draft Purchase Order in the ERP and posts an interactive Block Kit approval card to Slack (`#procurement-alerts`) and the Command Center Web UI ([`https://ecommerce-agents.onrender.com`](https://ecommerce-agents.onrender.com) or `http://localhost:8002`). The workflow pauses for human decision (`interrupt_after=["po_manager"]`).

### 3. How the Workflow Completes (Inbound Restock Consumer)

When an authorized human clicks **"Approve Reorder"** in Slack or **"Approve"** on the Command Center UI ([`https://ecommerce-agents.onrender.com`](https://ecommerce-agents.onrender.com) / `http://localhost:8002`):
1. **PO Issuance**: The Purchase Order is updated to `ISSUED` status in the ERP.
2. **Restock Event Published**: The agent system dispatches a replenishment event to Kafka topic `inventory-restock` using [`produce_restock_event`](../ecommerce-agents/src/tools/ecommerce.py).
   - Payload schema:
     ```json
     {
       "event_id": "restock-a1b2c3d4",
       "event_type": "STOCK_RESTOCK",
       "action": "RESTOCK",
       "timestamp": "2026-11-03T12:05:00.000Z",
       "slug": "classic-heavyweight-cotton-t-shirt",
       "sku": "classic-heavyweight-cotton-t-shirt",
       "productId": 101,
       "quantity": 19,
       "po_number": "PO-9142",
       "poNumber": "PO-9142"
     }
     ```
3. **Consumer Ingestion**: On SMK server startup, [`server/services/inventoryRestockConsumer.js`](server/services/inventoryRestockConsumer.js) initiates a persistent consumer connected as consumer group `smk-backend-restock-group` subscribed to `inventory-restock`.
4. **Business Policy Enforcement**:
   - The consumer enforces the business constraint that replenishment additions per order must be strictly **less than 20 units** (capping quantity to `19` if any higher value is received).
5. **Database Stock Update**: The consumer executes [`productService.restockProduct(...)`](server/services/products.js):
   - Inserts a new `Stock` record of type `PRODUCT` with the replenished quantity into PostgreSQL via Prisma.
   - Computes updated available stock.
6. **Customer Notifications**: If the product was previously out of stock (`previousStock === 0`), `sendRestockNotifications` automatically sends back-in-stock notification emails to all customers registered on the product's waiting list.
7. **Cycle Completed**: The store catalog reflects the new inventory level in real time without requiring any manual database edits or HTTP restock endpoints.

---

## Database

The Prisma schema is at [`server/prisma/schema.prisma`](server/prisma/schema.prisma), and migration history is in [`server/prisma/migrations`](server/prisma/migrations). Useful commands from `server/`:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma studio
```

For development schema changes, follow the repository instructions in [`NOTES.md`](NOTES.md).

## Production builds

```bash
cd web_client
npm run build
npm run start
```

```bash
cd server
npm start
```

Both services include Dockerfiles and expose port `10000` in their container images. The included Compose file currently provisions PostgreSQL only; application services must be run separately or added to the Compose configuration.

## API areas

The Express API is available below `/api` and includes routes for authentication, products, categories, sizes, colors, users, addresses, files, cart, wishlist, orders, configuration, dashboard, HSN, and audit logs. Dashboard and audit-log routes are restricted to administrators.

## Status

This README describes the functionality and technology currently represented in the repository. No automated test suite is configured yet; the server `test` script is currently a placeholder.
