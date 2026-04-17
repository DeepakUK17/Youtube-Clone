import nodemailer from "nodemailer";

// ─── Lazy Transporter (instantiate after dotenv loads) ─────────────────────
let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return _transporter;
};

// ─── Invoice email template ───────────────────────────────────────────────────
const buildInvoiceHTML = (user, plan, amount, orderId) => {
  const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
      .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #ff0000, #cc0000); padding: 32px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
      .header p  { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; }
      .body { padding: 32px; }
      .greeting { font-size: 16px; color: #333; margin-bottom: 24px; }
      .invoice-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; }
      .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #555; }
      .invoice-row:last-child { border-bottom: none; font-weight: bold; color: #111; font-size: 15px; }
      .badge { display: inline-block; background: #ff0000; color: #fff; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: bold; margin-bottom: 16px; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>▶ YourTube</h1>
        <p>Payment Invoice</p>
      </div>
      <div class="body">
        <p class="greeting">Hi <strong>${user.name || user.email}</strong>,</p>
        <p style="color:#555;font-size:14px;">Thank you for upgrading your plan! Here are your invoice details:</p>
        <span class="badge">${plan} Plan ✓</span>
        <div class="invoice-box">
          <div class="invoice-row"><span>Order ID</span><span>${orderId}</span></div>
          <div class="invoice-row"><span>Plan</span><span>${plan}</span></div>
          <div class="invoice-row"><span>Date</span><span>${date} IST</span></div>
          <div class="invoice-row"><span>Email</span><span>${user.email}</span></div>
          <div class="invoice-row"><span>Amount Paid</span><span>₹${amount}</span></div>
        </div>
        <p style="margin-top:24px;font-size:13px;color:#777;">
          Your plan is now active. Enjoy your upgraded viewing experience on YourTube!
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} YourTube. This is an automated invoice email.
      </div>
    </div>
  </body>
  </html>
  `;
};

// ─── Send invoice email ───────────────────────────────────────────────────────
export const sendInvoiceEmail = async (user, plan, amount, orderId) => {
  const mailOptions = {
    from:    `"YourTube" <${process.env.EMAIL_USER}>`,
    to:      user.email,
    subject: `✅ YourTube Invoice — ${plan} Plan Activated`,
    html:    buildInvoiceHTML(user, plan, amount, orderId),
  };

  await getTransporter().sendMail(mailOptions);
  console.log(`Invoice email sent to ${user.email} for ${plan} plan`);
};
