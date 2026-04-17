import Razorpay from "razorpay";
import crypto from "crypto";
import users from "../Modals/Auth.js";
import { sendInvoiceEmail } from "../services/emailService.js";

// ── Plan price map (in paise: 1 INR = 100 paise) ─────────────────────────────
const PLAN_PRICES = {
  premium: 49900,  // ₹499  — generic premium (Task 2)
  bronze:  1000,   // ₹10   — Task 3
  silver:  5000,   // ₹50   — Task 3
  gold:    10000,  // ₹100  — Task 3
};

const PLAN_LABELS = {
  premium: "Premium",
  bronze:  "Bronze",
  silver:  "Silver",
  gold:    "Gold",
};

// ─── Lazy Razorpay instance (created on first use, after dotenv loads) ────────
let _razorpay = null;
const getRazorpay = () => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
};


// ─── POST /payment/create-order ───────────────────────────────────────────────
// Body: { plan: "premium" | "bronze" | "silver" | "gold", userId }
export const createOrder = async (req, res) => {
  const { plan, userId } = req.body;

  if (!PLAN_PRICES[plan]) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const order = await getRazorpay().orders.create({
      amount:   PLAN_PRICES[plan],
      currency: "INR",
      receipt:  `rcpt_${userId.slice(-6)}_${Date.now()}`,
      notes:    { plan, userId },
    });

    return res.status(200).json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      plan,
      keyId:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const msg = (error?.error?.description) || error?.message || "Unknown error";
    console.error("Create order error:", msg, error);
    return res.status(500).json({ message: `Payment order failed: ${msg}` });
  }
};


// ─── POST /payment/verify ─────────────────────────────────────────────────────
// Verifies Razorpay signature, upgrades user plan, sends invoice email
export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    plan,
  } = req.body;

  // 1. Verify HMAC-SHA256 signature
  const body        = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  try {
    // 2. Update user plan
    const isPremium = true; // any paid plan = premium downloads
    const updatedUser = await users.findByIdAndUpdate(
      userId,
      { $set: { plan, isPremium } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Send invoice email (Task 3)
    const amount = PLAN_PRICES[plan] / 100; // convert paise → INR
    try {
      await sendInvoiceEmail(updatedUser, PLAN_LABELS[plan], amount, razorpay_order_id);
    } catch (emailError) {
      console.error("Invoice email error (non-fatal):", emailError);
    }

    return res.status(200).json({
      success: true,
      plan,
      isPremium,
      message: `Successfully upgraded to ${PLAN_LABELS[plan]} plan!`,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};
