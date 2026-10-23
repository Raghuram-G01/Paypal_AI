# PurchaseGuard AI

> **PayPal AI Hackathon Project**  
> Production-Quality Pre-Checkout Fraud Radar & Subscription Trap Shield for PayPal Shoppers.

PurchaseGuard AI intercepts the checkout decision before money changes hands. It evaluates merchant reputation, scans fine print for hidden recurring auto-debit clauses, detects counterfeit clone patterns, and provides actionable purchase advice to ensure buyer protection under PayPal.

Designed with a modern fintech aesthetic inspired by **Linear, Stripe, and Ramp**: warm off-white canvas, deep slate/navy typography, emerald trust accents, amber caution alerts, crimson threat blocks, tabular figures, and Lucide vector iconography.

---

## Key Features & Production Capabilities

1. **AI Checkout Risk Radar**:
   * Evaluates merchant domains and checkout URLs on a calibrated 0–100 Trust Score.
   * Categorized risk profiles: Low Risk (Verified Safe), High Risk (Trap Warning), Critical Risk (Scam Blocked).

2. **Fine-Print Clause & Evidence Extraction**:
   * Highlights specific extracted legal clauses (e.g. *"§8.2 Auto-Renewal: Fine print authorizes a recurring charge of $89.99 every 14 days"*).
   * Verifies domain registration age, WHOIS privacy status, and SSL/TLS encryption cipher.

3. **Itemized Purchase Review & Price Breakdown**:
   * Real-time calculation of item subtotal, estimated sales tax, shipping fee, and free PurchaseGuard protection under PayPal.
   * Explicit billing disclosure badge verifying one-time authorization vs recurring subscription agreements.

4. **Scam Interception & Hard Block**:
   * Proactively halts automated PayPal transactions on critical-risk domains to protect balances.
   * Includes developer sandbox override toggle for full testing flexibility.

5. **Official PayPal Sandbox Smart Payment Buttons**:
   * Powered by `@paypal/react-paypal-js`.
   * Real order creation (`intent: 'CAPTURE'`) and approval capture handler.
   * Generates production-grade **Transaction Receipts** with captured PayPal Order IDs.

6. **Order & Protection History Ledger**:
   * Persistent audit log (stored in `localStorage`) tracking past protected purchases.
   * Filter orders by risk profile (All, Low Risk, High Risk, Critical Override).
   * Detailed receipt drawer with audit flags and transaction proof.

7. **Product & Protection Comparison Matrix**:
   * Direct side-by-side comparison between **Unprotected Direct Checkout** vs **PurchaseGuard Protected Checkout** across 6 security dimensions.
   * Benchmark comparison table across the three demo scenarios.

8. **Hackathon Demo Presets**:
   * **Verified Electronics**: Transparent 30-day refund policy, 94/100 score.
   * **Subscription Trap**: Hidden $89.99 bi-weekly recurring fee fine print, 28/100 score.
   * **Counterfeit Scam**: Unrealistic 90% luxury clone site, 12/100 score (payment blocked).

---

## Running the Application Locally

### 1. Start the Express Backend
```powershell
cd server
npm start
```
*Backend runs on `http://localhost:5000` exposing `/api/health`, `/api/scenarios`, and `/api/analyze-checkout`.*

### 2. Start the React Frontend
```powershell
cd purchaseguard
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 3. Build for Production
```powershell
cd purchaseguard
npm run build
```

---

## Technical Stack

* **Frontend**: React 19, TypeScript, Vite, `@paypal/react-paypal-js`, `lucide-react`
* **Styling**: Production Fintech Design System (Vanilla CSS with CSS Custom Properties, no bloated utility libraries)
* **Backend**: Express 5, Node.js, CORS, Heuristic Fraud Evaluation Engine
