import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dileepdeepakudaya@gmail.com",
    pass: "xfxgnvjpokndpxyq", 
  },
});

transporter.sendMail({
  from: '"YourTube" <dileepdeepakudaya@gmail.com>',
  to: "dileepdeepakudaya@gmail.com",
  subject: "✅ Test Email",
  html: "<p>If you see this, nodemailer works!</p>"
}, (error, info) => {
  if (error) {
    console.error("Error sending mail:", error);
  } else {
    console.log("Email sent! Message ID:", info.messageId);
  }
});
