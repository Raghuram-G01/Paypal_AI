# PurchaseGuard AI - PayPal AI Hackathon

> **Production-Quality Pre-Checkout Fraud Radar & Subscription Trap Shield for PayPal Shoppers.**

PurchaseGuard AI intercepts the checkout decision before money changes hands. It evaluates merchant reputation, scans fine print for hidden recurring auto-debit clauses, detects counterfeit clone patterns, and provides actionable purchase advice to ensure buyer protection under PayPal.

---

## 📁 Repository Structure

```
paypal_AI_Hackathon/
├── purchaseguard/       # Frontend client built with React 19, Vite, TypeScript, Lucide Icons, and PayPal JS SDK
├── server/              # Backend server built with Node.js & Express 5 (AI Fraud Analysis & Presets Engine)
├── .gitignore           # Git ignore configuration
└── README.md            # Main project documentation
```

---

## 🚀 Quick Start Guide

### 1. Start the Express Backend
```bash
cd server
npm install
npm start
```
*Backend runs on `http://localhost:5000` exposing `/api/health`, `/api/scenarios`, and `/api/analyze-checkout`.*

### 2. Start the React Frontend
```bash
cd purchaseguard
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 3. Build for Production
```bash
cd purchaseguard
npm run build
```

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite, `@paypal/react-paypal-js`, `lucide-react`
* **Design & Styling**: Linear/Stripe-inspired Fintech Design System with Vanilla CSS custom properties & micro-interactions
* **Backend**: Express 5, Node.js, CORS, Heuristic Fraud Evaluation Engine
* **Integration**: Official PayPal Smart Buttons with CAPTURE flow & live digital audit receipts
