// razorpay.js
import Razorpay from "razorpay";

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export const createPayment = async ({ amount }) => {
    try {
      const options = {
        amount: Math.round(Number(amount) * 100), // convert to paisa (must be an integer)
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };
      const payment = await razorpayInstance.orders.create(options);
      return payment;
    } catch (error) {
      console.error("Failed to initialize payment with Razorpay:", error);
      throw new Error("Failed to initialize payment");
    }
}