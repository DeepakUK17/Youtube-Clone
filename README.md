# ▶ YourTube — Full-Stack Advanced Video Streaming Platform

![YourTube Banner](yourtube/public/favicon.ico)

YourTube is a highly advanced, production-ready, YouTube clone built on the **MERN (MongoDB, Express, React, Node.js) Stack** utilizing the powerful **Next.js 15 App Router** architecture. It integrates a seamless monolithic scaling layout bridging the capabilities of Video Uploading, Live VoIP Call Interactions, WebRTC Streams, Razorpay Premium Subscriptions, Real-Time Cross-Region Dynamic Themes, and Geographic Multi-Factor Authentication.

## 🔥 Key Features

### 1. Robust Auth & Security
- **Firebase OAuth**: One-click Google Sign-in integrated with customized user session bridging to MongoDB.
- **Geographic Multi-Factor Authentication (OTP)**:
  - If the user's IP resolves to *South India* (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana), a 6-digit OTP is blasted directly to their registered Google Email (via **Nodemailer**).
  - If the user is logging in from *outside South India*, they are dynamically prompted for their 10-digit mobile number and authenticated via an SMS text message (via **Fast2SMS** API).

### 2. Time-Aware & Location-Aware Theming
- The Next.js frontend strictly obeys an intelligent Backend Node.js time tracker. 
- If the current local Indian Standard Time (IST) is strictly between `10:00 AM` and `12:00 PM` AND the user connects from South India, the website is forced into a **Light Mode** theme.
- All other times, or all other geographic locations instantly cascade into an immersive cinematic **Dark Mode** theme.

### 3. Monetization & Premium Memberships (Razorpay)
- Implemented three premium membership tiers (Bronze ₹10, Silver ₹50, Gold ₹100).
- Users can unlock "Premium Downloads", eliminating video limits.
- Fully cryptographically-validated **Razorpay Secure Webhooks**, directly issuing detailed automated HTML email receipts right from the Node.js server.
- Dynamic React context automatically renders distinct UI badges (`SILVER MEMBER`, `GOLD MEMBER`) across the Web Navigation sidebar exactly when an upgrade verifies.

### 4. Global Language Accessibility
- Full inclusive Unicode Regex algorithms permit comments dynamically written in complex Indic-scripts (`Tamil`, `Hindi`, `Arabic`).
- Users can translate comments into **any language (including English)** with a built-in localization service.
- **Moderation Framework**: Auto-blocks any special characters. If a specific comment is hit with **2 dislikes**, the backend engine executes an instantaneous automated deletion.
- Comments natively fingerprint and display the exact **City Name** the user posted from!

### 5. WebRTC P2P Integrated Video Calling
- Users can natively search for other users via an optimized $or string query matching against *Name, Channel Name, or Email Address*.
- Bypasses static streaming arrays by connecting callers straight across a native **WebRTC** Peer-to-Peer encrypted pipe, signaled globally via **Socket.io**.
- Supports interactive multi-tab Caller interfaces seamlessly.

### 6. Video Limits & Downloads
- Free tier members have an algorithmic block on their account strictly limiting them to **2 Video Downloads per 24 hours**. 
- Advanced Server-side CRON caching enforces this rolling window limit. Once upgraded by paying via Razorpay, all soft-locks are instantly disengaged.

## 🛠 Tech Stack

- **Frontend:** Next.js 15 (React 19), Tailwind CSS, Lucide Icons, Axios.
- **Backend:** Node.js (Express), Socket.io, Firebase Native SDK.
- **Database:** MongoDB Atlas (Mongoose ODM).
- **APIs & Plugins:** Razorpay Payment Gateway, Nodemailer SMTP, Fast2SMS, External IP Context Fetcher.

## 🚀 Setup & Installation (Local Environment)

### Prerequisites
- Node.js v20+
- MongoDB Local/Atlas URI
- Razorpay Sandbox Keys
- Firebase Web Keys

### Running the Project

**1. Clone the repository**
```bash
git clone https://github.com/DeepakUK17/Youtube-Clone.git
cd Youtube-Clone
```

**2. Setup Backend Server**
```bash
cd server
npm install
npm start
```
*Note: Make sure to create a `.env` inside `/server` referencing your DB connection vars.*

**3. Setup Frontend App**
```bash
cd yourtube
npm install
npm run dev
```
*Note: Make sure to create a `.env.local` inside `/yourtube` mapping the `NEXT_PUBLIC_FIREBASE` variables.*

## 🔒 Security Compliance
- Uses strictly scoped `Cross-Origin-Opener-Policy: same-origin-allow-popups` preventing Clickjacking vulnerabilities.
- Backend routing hides `.env` payloads globally tracking `uploads/` directories outside of GitHub's reach via custom `.gitignore` cascades.
- Implements rigid lazy initialization of Node.js modules effectively curing static state memory leaks.
