import fs from "fs";
import path from "path";
import { generateRandom } from "./cryptoUtils.js";
import { CONFIG_KEYS, ORDER_STATUS, ROLE_TYPES } from './constants.js';
import { sendMail } from "./mailUtils.js";
import configService from "../services/config.js";
import userService from "../services/users.js";
import { deleteR2FileByPath, isR2Configured } from "./r2.js";
import { getCurrentTenant } from "./tenantContext.js";

export const toCamelCase = (row) => {
  const obj = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    obj[camelKey] = row[key];
  }
  return obj;
};

export const convertToFullFilePath = (filePath) => {
  if (!filePath) return filePath;
  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }
  
  if (isR2Configured()) {
    const baseUrl = (process.env.R2_PUBLIC_BASE_URL || process.env.R2_ENDPOINT || "").replace(/\/+$/, "");
    const bucketPath = (process.env.R2_BUCKET_PATH || "uploads").replace(/^\/+|\/+$/g, "");
    return filePath ? `${baseUrl}/${bucketPath}/${filePath}` : filePath;
  }

  return process.env.SERVER_ADDRESS + filePath;
};

export const deleteFile = async(filePath) => {
  if (isR2Configured()) {
    await deleteR2FileByPath(filePath);
    return;
  }
  const fileFullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fileFullPath)) {
    fs.unlinkSync(fileFullPath);
  }
}

export const deleteFiles = (files) => {
  return Promise.all([
    files.map((file) => typeof file === "object" ? deleteFile(file.path) : deleteFile(file))
  ])
};

export const slugText = (text) => {
  return text.replace(/\s+/g, '-');
}

export const OTP_EXPIRY_MINUTES = 5 * 60 * 1000;

export function isOtpExpired(createdAt) {
  return (Date.now() - createdAt.getTime()) > OTP_EXPIRY_MINUTES;
}

export const getFullAddress = (address, isBilling=false) => {
  if(isBilling){
    return `${address.billingName},${address.billingMobile},${address.billingAddress}, ${address.billingCity}, ${address.billingState}, ${address.billingCountry} - ${address.billingPincode}`
  }
  return `${address.name},${address.mobile},${address.address}, ${address.city}, ${address.state}, ${address.country} - ${address.pincode}`
}

export const generateOrderNo = (userId) => {
  const date = new Date();
  const random = generateRandom();
  const formatted = String(userId) + date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0') +
        String(date.getHours()).padStart(2, '0') +
        String(date.getMinutes()).padStart(2, '0') +
        String(date.getSeconds()).padStart(2, '0') +
        String(date.getMilliseconds()).padStart(3, '0') +
        String(random);
  return formatted;
}

export const getOrderStatusEmailTemplate = async({
  status,
  orderNo,
  userName,
}) => {

  const orderLink = `${process.env.FRONTEND_URL}/orders/${orderNo}`;
  const appName = await getAppName();
  const baseTemplate = (title, message) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; font-size: 18px;">
      <h2 style="color:#333;">${title}</h2>

      <p>Hi ${userName},</p>
      <p>${message}</p>

      <p><strong>Order No:</strong> ${orderNo}</p>

      <div style="margin: 25px 0;">
        <a href="${orderLink}" 
           style="
             background-color: #2563eb;
             color: #ffffff;
             padding: 6px 8px;
             text-decoration: none;
             border-radius: 6px;
             display: inline-block;
             font-weight: bold;
           ">
           View Order Details
        </a>
      </div>

      <p style="font-size: 12px; color: #777;">
        If the button doesn’t work, copy this link:<br/>
        ${orderLink}
      </p>

      <br/>
      <p>Thanks,<br/>${appName}</p>
    </div>
  `;

  switch (status) {
    case ORDER_STATUS.PLACED:
      return {
        subject: `Order Placed Successfully - ${orderNo}`,
        html: baseTemplate(
          "Order Placed",
          "Your order has been placed successfully."
        ),
      };

    case ORDER_STATUS.CONFIRMED:
      return {
        subject: `Order Confirmed - ${orderNo}`,
        html: baseTemplate(
          "Order Confirmed",
          "Good news! Your order has been confirmed."
        ),
      };

    case ORDER_STATUS.SHIPPED:
      return {
        subject: `Order Shipped - ${orderNo}`,
        html: baseTemplate(
          "Order Shipped",
          "Your order is on the way 🚚"
        ),
      };

    case ORDER_STATUS.DELIVERED:
      return {
        subject: `Order Delivered - ${orderNo}`,
        html: baseTemplate(
          "Order Delivered",
          "Your order has been delivered. We hope you enjoy it!"
        ),
      };

    case ORDER_STATUS.CANCELLED:
      return {
        subject: `Order Cancelled - ${orderNo}`,
        html: baseTemplate(
          "Order Cancelled",
          "Your order has been cancelled successfully."
        ),
      };

    case ORDER_STATUS.REJECTED:
      return {
        subject: `Order Rejected - ${orderNo}`,
        html: baseTemplate(
          "Order Rejected",
          "Unfortunately, your order was rejected."
        ),
      };

    case ORDER_STATUS.PAYMENT_FAILED:
      return {
        subject: `Payment Failed - ${orderNo}`,
        html: baseTemplate(
          "Payment Failed",
          "Your payment attempt failed. Please try again."
        ),
      };

    case ORDER_STATUS.PAYMENT_PENDING:
      return {
        subject: `Payment Pending - ${orderNo}`,
        html: baseTemplate(
          "Payment Pending",
          "Your order is awaiting payment confirmation."
        ),
      };
    
    case "RECEIVED":
      return {
        subject: `New Order Received - ${orderNo}`,
        html: baseTemplate(
          "Order Received",
          "New Order Received"
        ),
      };

    default:
      return null;
  }
};

export const sendOrderStatusMail = async ({
  email,
  userName,
  orderNo,
  status,
}) => {
  const template = await getOrderStatusEmailTemplate({
    status,
    orderNo,
    userName,
  });

  if (!template) return;

  const appName = await getAppName();

  await sendMail({
    to: email,
    subject: `${appName} - ${template.subject}`,
    html: template.html,
  });

  //notify admins
  if(status === ORDER_STATUS.PLACED) {
    const adminUsers = await userService.getUsers({role: ROLE_TYPES.ADMIN});
    adminUsers.forEach(async (admin) => {
      const template = await getOrderStatusEmailTemplate({ status: "RECEIVED", orderNo, userName: admin.name })
      sendMail({ to: admin.email, subject: template.subject, html: template.html})
    });
  }
};

export const sendOrderDisputeMail = async ({
  orderNo,
  customerName,
  message,
  isEditing = false,
  updatedAt = null,
}) => {
  const adminUsers = await userService.getUsers({ role: ROLE_TYPES.ADMIN });
  if (!adminUsers?.length) return;

  const appName = await getAppName();
  const orderLink = `${process.env.FRONTEND_URL}/orders/${orderNo}`;
  const actionLabel = isEditing ? "updated" : "raised";
  const headingLabel = isEditing ? "Order Dispute Updated" : "New Order Dispute";
  const actionText = isEditing
    ? "A customer has updated an existing dispute for an order."
    : "A customer has raised a dispute for an order.";
  const updatedAtMarkup = isEditing && updatedAt
    ? `<p><strong>Updated At:</strong> ${new Date(updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>`
    : "";

  await Promise.all(
    adminUsers.map((admin) =>
      sendMail({
        to: admin.email,
        subject: `${appName} - Order dispute ${actionLabel} - ${orderNo}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; font-size: 16px;">
            <h2 style="color:#333;">${headingLabel}</h2>
            <p>Hi ${admin.name},</p>
            <p>${actionText}</p>
            <p><strong>Order No:</strong> ${orderNo}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Dispute:</strong><br/>${message}</p>
            ${updatedAtMarkup}
            <div style="margin: 25px 0;">
              <a href="${orderLink}"
                style="
                  background-color: #dc2626;
                  color: #ffffff;
                  padding: 8px 12px;
                  text-decoration: none;
                  border-radius: 6px;
                  display: inline-block;
                  font-weight: bold;
                ">
                View Order
              </a>
            </div>
            <p style="font-size: 12px; color: #777;">
              If the button doesn’t work, copy this link:<br/>
              ${orderLink}
            </p>
          </div>
        `,
      })
    )
  );
};

export const getAppName = async() => {
  const config = await configService.getAll({});
  const tenant = getCurrentTenant();
  return config[CONFIG_KEYS.COMP_INFO]?.name || tenant?.branding?.storeName || tenant?.name || '';
}

export const getShippingAmount = (shipData, shippingInfo) => {
  if(!shippingInfo?.country) throw new Error("Shipping Country is missing");
  if(!shippingInfo?.state) throw new Error("Shipping State is missing");
  const countryData = shipData?.countries?.find(i => i.name === shippingInfo.country)
  const stateWiseAmount = countryData?.states?.find(j => j.name === shippingInfo.state);
  if(stateWiseAmount) return stateWiseAmount?.amount || 0; 
  if(countryData) return countryData?.amount || 0; 
  return shipData?.amount || 0; 
}

export const getPriceWithoutTax = (priceWithTax, taxPercent) => {
  if (!priceWithTax || !taxPercent) return priceWithTax;

  const priceWithoutTax = priceWithTax / (1 + taxPercent / 100);
  return Number(priceWithoutTax.toFixed(2));
}

export function calculateInvoice(products) {
  let totalAmount = 0;
  let totalAmountWithoutTax = 0;
  let totalTaxAmount = 0;

  products.forEach(item => {
    const itemTotal = item.price * item.quantity;

    // base price per item
    const basePrice = getPriceWithoutTax(item.price, item.tax);

    const itemTotalWithoutTax = basePrice * item.quantity;

    const taxAmount = itemTotal - itemTotalWithoutTax;

    totalAmountWithoutTax += itemTotalWithoutTax;
    totalTaxAmount += taxAmount;
    totalAmount += itemTotal;
  });

  return {
    totalAmountWithoutTax: Number(totalAmountWithoutTax.toFixed(2)),
    totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}
