# SMK Store Knowledge Base Documents

This directory contains official, verified documentation files for the **SMK E-Commerce Platform**. These documents are designed to be ingested into the **Autonomous Chatbot Service & Qdrant Knowledge Hub** to provide accurate, grounded answers to customer inquiries.

---

## 📄 Available Document Files

| File | Size | Description & Key Topics Covered |
| :--- | :--- | :--- |
| [**`return_and_refund_policy.md`**](./return_and_refund_policy.md) | ~3.1 KB | 30-day return window, eligibility conditions, non-returnables, Razorpay/UPI/COD refund timelines, reverse logistics fee (₹99), free exchanges. |
| [**`shipping_and_delivery_guide.md`**](./shipping_and_delivery_guide.md) | ~3.0 KB | Shipping zones (Metro: 1–3 days, Pan-India: 3–7 days), Free shipping threshold (₹999+), standard ₹79 fee, COD rules & ₹49 fee, courier tracking (BlueDart, Delhivery, XpressBees). |
| [**`orders_and_payments_faq.md`**](./orders_and_payments_faq.md) | ~2.9 KB | Supported payments (UPI, Cards, NetBanking, COD), payment failure 24–48h auto-reversals, 2-hour self-service cancellation window, GST tax invoices & HSN breakdown. |
| [**`order_management_and_tracking_guide.md`**](./order_management_and_tracking_guide.md) | ~3.2 KB | Dedicated `/orders` screen, order statuses, live courier AWB tracking (BlueDart, Delhivery, DTDC), Order Details view, dispute resolution, tax bill printing. |
| [**`autonomous_inventory_and_restock_policy.md`**](./autonomous_inventory_and_restock_policy.md) | ~2.3 KB | Multi-agent Kafka event replenishment, "Notify Me" customer restock subscriptions, 24-48h restock velocity, max 5 units/order anti-hoarding limit. |
| [**`customer_support_and_contact.md`**](./customer_support_and_contact.md) | ~1.9 KB | 24/7 AI chat widget, email (`support@smk.store`), toll-free (`1800-SMK-RETAIL`), WhatsApp (+91 98765 43210), escalation hierarchy, Bengaluru registered office. |
| [**`size_and_fit_guide.md`**](./size_and_fit_guide.md) | ~2.2 KB | Upper apparel chest/shoulder size charts (S to XXL), lower apparel waist/inseam charts (28 to 38), unisex footwear UK/US/EU conversion chart, measurement advice. |

---

## 🚀 How to Ingest into the Chatbot Application

### Option A: Via Admin Document Hub (UI)
1. Open the Chatbot Admin Dashboard: [http://localhost:8005/admin/documents](http://localhost:8005/admin/documents).
2. Sign in with your admin credentials (`admin@smk.internal` / `SupportAdmin@123`).
3. Drag and drop any of the files from this directory (`smk/docs/`) into the upload dropzone.
4. The system will parse the file in-memory, generate dense vector embeddings, and index the chunks in Qdrant with zero files stored on disk.

### Option B: Via Command Line (REST API)
```bash
# 1. Obtain Admin JWT Token
TOKEN=$(curl -s -X POST http://localhost:8005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smk.internal","password":"SupportAdmin@123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Upload and index all docs in-memory
curl -X POST http://localhost:8005/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@smk/docs/return_and_refund_policy.md" \
  -F "files=@smk/docs/shipping_and_delivery_guide.md" \
  -F "files=@smk/docs/orders_and_payments_faq.md" \
  -F "files=@smk/docs/order_management_and_tracking_guide.md" \
  -F "files=@smk/docs/autonomous_inventory_and_restock_policy.md" \
  -F "files=@smk/docs/customer_support_and_contact.md" \
  -F "files=@smk/docs/size_and_fit_guide.md"
```

