# SMK Order Management, Tracking & Dispute Guide

**Last Updated:** November 2026  
**Document ID:** SMK-DOC-ORD-006  
**Audience:** SMK Store Customers, Support Staff, and Logistics Operators  
**Applies to:** Pan-India Orders on SMK Store ([smk-tan.vercel.app](https://smk-tan.vercel.app/))

---

## 1. Accessing Your Orders (Dedicated Orders Screen)

Customers can view and manage all current and past orders directly on the dedicated **Orders Screen**:
- **Direct Portal URL:** [https://smk-tan.vercel.app/orders](https://smk-tan.vercel.app/orders)
- **Navigation:** Accessible from the main website header menu via **"Orders"**, as well as from **"My Account > Orders"**.
- **Authentication:** You must be signed in to your SMK customer account to view your order history.

### Features of the Orders Screen:
1. **Search by Order # or Item:** Quickly locate orders using your Order Number (e.g., `ORD-10023`) or product title.
2. **Status Filtering:** Filter your orders by stage:
   - **All Orders:** Complete historical list.
   - **Placed / Processing:** Orders currently being confirmed or packed at our fulfillment centers.
   - **Shipped:** Orders in transit with assigned courier partner and live AWB tracking number.
   - **Delivered:** Successfully completed orders.
   - **Cancelled / Disputed:** Orders that were cancelled or have an active dispute.
3. **One-Click Details:** Tap **"View Order Details & Tracking"** on any order card to open the comprehensive order breakdown.

---

## 2. Order Details & Live Courier Tracking Screen

Each order has a dedicated details page at `https://smk-tan.vercel.app/orders/{orderNo}`:
- **Visual Progress Timeline:** Real-time visual milestone tracker showing progress:
  `Order Placed` ➔ `Confirmed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`.
- **Courier & Live AWB Tracking:**
  - When your package is dispatched, courier details (e.g., BlueDart, Delhivery, XpressBees, DTDC) and the Air Waybill (AWB) number appear in the **Courier Details** card.
  - Click **"Track Courier"** to track the shipment directly on the courier partner's portal.
- **Tax Invoice & Print Bill:**
  - Click **"Print Bill"** to view and download a GST-compliant tax invoice showing HSN codes, tax breakdown, and shipping details.
- **Shipping & Billing Addresses:**
  - Displays the registered recipient name, contact number, delivery address, and billing address.

---

## 3. Order Lifecycle & Status Definitions

| Status | Meaning | Typical Duration | Customer Actions Available |
| :--- | :--- | :--- | :--- |
| **PLACED** | Order placed successfully; payment captured. | 0–2 hours | Self-service cancellation, view details. |
| **CONFIRMED** | Warehouse acknowledged; inventory reserved. | 2–6 hours | View details, print bill, contact support. |
| **PROCESSING** | Packing, barcoding, and quality inspection in progress. | 6–24 hours | View details, print bill. |
| **SHIPPED** | Handed over to logistics partner; AWB generated. | 1–5 business days | Live courier tracking via AWB link. |
| **DELIVERED** | Doorstep delivery confirmed by courier agent. | Final | Print invoice, request 30-day return, raise dispute. |
| **CANCELLED** | Cancelled by customer (within 2h) or system auto-reversal. | Final | Refund processed to source in 24–48h. |
| **REJECTED** | Order rejected due to payment failure or inventory unavailability. | Final | Full refund processed immediately. |

---

## 4. Raising and Managing Order Disputes

If you experience an issue with an order (such as a missing item, damaged goods, or delayed delivery):
1. Navigate to your order details page: [https://smk-tan.vercel.app/orders/{orderNo}](https://smk-tan.vercel.app/orders).
2. Scroll to the **Order Dispute Support** section.
3. Click **"Raise a Dispute"** and provide details describing the issue.
4. Once submitted, your dispute status is marked as **OPEN**, and an automated notification is dispatched to the SMK support team.
5. The support team will investigate with the warehouse or courier partner and update your dispute status to **RESOLVED** within 24 business hours.
6. Customers can edit their dispute notes anytime while the dispute is **OPEN**.

---

## 5. Frequently Asked Questions (FAQ)

**Q: Where can I see my order number?**  
**A:** Your order number is listed on the order confirmation screen, in your confirmation email/SMS, and at the top of every card on [https://smk-tan.vercel.app/orders](https://smk-tan.vercel.app/orders).

**Q: How do I cancel an order?**  
**A:** Orders can be cancelled within 2 hours of placement directly from your order details screen while the status is still **PLACED** or **CONFIRMED**.

**Q: Can I change my delivery address after placing an order?**  
**A:** If the order is still in **PLACED** status, reach out to live chat or WhatsApp support (`+91 98765 43210`) immediately with your order number to update your address before warehouse dispatch.

