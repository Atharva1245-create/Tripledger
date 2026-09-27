# 🚀 TripLedger

> **"Your trip. Your expenses. One smart ledger."**

TripLedger is an AI-powered group trip expense and financial operating system. Designed for group travelers, student trips, and vacationers, TripLedger solves real-world group money problems beyond simple split calculators.

---

## 🌟 The 5 Primary Differentiating Features

1. **🤖 AI Receipt Scanner + Smart Bill Split (Primary USP)**
   - Upload receipt images, drag-and-drop, or use webcam OCR.
   - Powered by Gemini Vision AI with fallback OCR parser.
   - Extracts merchant name, line items (Pizza, Burger, Drinks), prices, tax, discounts, and totals.
   - **"Who had what?" Checkbox Matrix**: Select specific participants per item (e.g., Pizza for Rahul & Amit, Burger for Neha, Drinks for All).
   - Automatically calculates item-level individual shares while enforcing user verification safety rules.

2. **🧠 AI Trip Financial Assistant**
   - Contextual RAG AI assistant specifically tied to each trip's authorized ledger.
   - Answers questions like *"How much did we spend on food?"*, *"How much do I owe?"*, *"Who paid the most?"*, *"What was our biggest expense?"*.
   - Never invents data; outputs exact reference badges for relevant expenses.

3. **💰 Smart Settlement Optimizer**
   - Calculates net balances ($B_i = \text{Paid}_i - \text{Owed}_i$).
   - Greedily optimizes debt graphs to minimize unnecessary transactions (e.g., reduces group balances to a minimal 3-step payment plan).

4. **💳 UPI Payment Integration Architecture**
   - Deep-link generator (`upi://pay?pa=...&pn=...&am=...&cu=INR`).
   - Interactive QR code generator & development **Mock Payment Mode** with live status progression (`Pending` -> `Payment Initiated` -> `Paid` -> `Confirmed` with confetti celebration).

5. **📲 WhatsApp Vendor Messaging**
   - Associate vendors (Hotels, Restaurants, Cab providers) with trip expenses.
   - Context-aware editable pre-filled message generator (`wa.me` deep link) with templates for Booking Confirmations, Payment Proofs, and Bill Clarifications.

---

## 🎨 Design System & Visual Aesthetics

- **Sidebar**: Deep Purple / Plum (`#3D1B5B`) with gold active indicators and bottom user profile card.
- **Main Canvas**: Warm Cream & Soft Peach gradient background (`#FAF2EA` to `#F4E7DA`).
- **Cards**: Soft white rounded containers (`rounded-3xl`) with shadow depth.
- **WhatsApp Action Buttons**: Vibrant WhatsApp Green (`#22C55E`) pill buttons.

---

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas-Confetti
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL / SQLite (`dev.db` pre-configured out of the box)
- **AI / OCR**: Google Gemini 1.5 Flash (`@google/generative-ai`) Vision & Text API
- **Auth**: JWT (JSON Web Token) + bcryptjs password hashing

---

## 🗄️ Database Schema Summary

The relational database architecture is defined in `backend/prisma/schema.prisma`:
- `User`: Accounts, credentials, default UPI ID, avatar
- `Trip`: Group trips, budget, start/end dates
- `TripMember`: Registered users or Guest members participating in expenses
- `Expense`: Expense records, split types, vendor phone & category
- `ExpenseItem`: Itemized receipt lines
- `ExpenseParticipant`: Individual itemized/percentage member shares
- `Settlement`: Transaction statuses (`Pending`, `Payment Initiated`, `Paid`, `Confirmed`)
- `AIQuery`: RAG logs for trip assistant questions

---

## ⚙️ Environment Variables

Create `.env` inside `backend/`:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="tripledger_super_secret_jwt_key_2026"
GEMINI_API_KEY="your_optional_gemini_api_key"
NODE_ENV="development"
```

---

## 🛠️ Quick Start & Local Setup

### 1. Backend Setup & Database Seeding
```bash
cd backend
npm install
npm run prisma:generate
npx prisma db push
npm run seed
npm run dev
```
> **Backend runs on:** `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> **Frontend runs on:** `http://localhost:3000`

---

## 🎭 Hackathon Demo Walkthrough Flow

1. **Pre-Seeded Demo Account**:
   - **Email**: `rahul@tripledger.com`
   - **Password**: `password123`
2. **Dashboard Overview**:
   - View Goa Trip overall spent (**₹42,500**) and personal balance (**You owe ₹1,850**).
   - View member balance cards (Rahul +₹4,500, Amit -₹1,200, Neha -₹2,000, Sameer -₹1,300, Rohit Guest).
3. **AI Receipt Scan & Smart Item Split**:
   - Click `✨ Scan Receipt (AI)` on Add Expense page.
   - Upload receipt image -> AI extracts Pizza (₹600), Burger (₹300), Drinks (₹400), Tax (₹130).
   - Select member checkboxes per item -> Save Expense -> Dashboard live-updates.
4. **Ask AI Assistant**:
   - Navigate to `AI Assistant`.
   - Click prompt chip *"How much did we spend on food?"* or *"Who paid the most?"*.
   - View precise ledger answer with expense reference badges.
5. **Smart Settlement Optimizer**:
   - Navigate to `Settlements`.
   - View optimized 3-payment plan.
   - Click `Pay via UPI` -> Experience QR code & simulated settlement success with confetti!
6. **WhatsApp Vendor Contact**:
   - Click `Whatsapp Vendor` on Beach Cafe / Hotel Paradise expense -> Customize message template -> Open WhatsApp.
