# SMK Orders, Payments & Invoicing FAQ

**Last Updated:** November 2026  
**Document ID:** SMK-DOC-PAY-003  
**Audience:** SMK Customers & Support Administrators

---

## 1. Supported Payment Methods

All transactions on SMK are processed through PCI-DSS Level 1 compliant gateways powered by **Razorpay**:

1. **UPI (Zero Fee):** Google Pay, PhonePe, Paytm, BHIM, Cred, and all bank UPI apps.
2. **Credit & Debit Cards:** Visa, MasterCard, RuPay, Maestro, and American Express.
3. **Net Banking:** Supported across 50+ major national and private Indian banks (HDFC, SBI, ICICI, Axis, Kotak, etc.).
4. **Digital Wallets:** Paytm Wallet, Mobikwik, PhonePe Wallet.
5. **Cash on Delivery (COD):** Payable in cash or dynamic UPI QR scan upon doorstep delivery (orders up to ₹5,000).

---

## 2. Payment Failure & Auto-Reversal
**Q: Money was deducted from my bank/UPI, but the order failed or shows 'Pending'. What should I do?**  
**A:** In 99% of cases, this occurs due to a bank-gateway handshake timeout.
- Our system automatically reconciles pending transactions every 15 minutes.
- If the payment was captured, your order status will automatically update to **"Confirmed"** within 30 minutes, and you will receive a confirmation email.
- If the gateway marked the transaction as failed, the deducted funds are placed in auto-refund mode and returned to your account within **24–48 banking hours** (for UPI) or **3–5 business days** (for debit/credit cards).

---

## 3. Modifying or Canceling an Order

- **Self-Service Cancellation:** Orders can be viewed, tracked, and canceled directly from the dedicated **Orders Screen** at [https://smk-tan.vercel.app/orders](https://smk-tan.vercel.app/orders) (or via account page at [https://smk-tan.vercel.app/my-account](https://smk-tan.vercel.app/my-account)) within **2 hours** of placement, provided the status is still **"Processing"** or **"Confirmed"**.
- **After Dispatch:** Once an order moves to **"Shipped"** with an assigned courier AWB, cancellation is no longer possible. You may track package movement live on the Order Details screen or refuse delivery at the doorstep to initiate an automated refund.
- **Address Changes:** Contact live support immediately within 1 hour of placing the order to update delivery address or phone number prior to warehouse packing.

---

## 4. Invoices, GST, and Tax Breakdown

- **Tax Invoices:** Every order includes a GST-compliant tax invoice detailing:
  - HSN codes for each product category.
  - CGST + SGST (for intra-state shipments) or IGST (for inter-state shipments).
  - SMK legal entity tax registration number (GSTIN).
- **Download Invoice:** Open any order on the dedicated **Orders Screen** at [https://smk-tan.vercel.app/orders](https://smk-tan.vercel.app/orders), click **"View Details"**, and select **"Print Bill"** to print or save a clean PDF tax invoice.
- **Business GST Purchases:** Customers can input their company name and GSTIN at checkout to claim input tax credits (ITC).

---

## 5. Security & Fraud Protection
- 128-bit SSL encrypted checkout.
- Zero raw card numbers are stored on SMK servers; all card data is tokenized via RBI-compliant payment gateway tokens.
- 2-factor authentication (OTP) enforced on all Indian debit/credit card and Net Banking transactions.

