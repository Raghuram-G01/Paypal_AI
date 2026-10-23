const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Preset mock scenarios for Hackathon live demo
const PRESET_SCENARIOS = {
  safe: {
    merchantName: 'Acme Electronics Official Store',
    merchantUrl: 'https://acme-electronics-store.com/checkout',
    totalAmount: 149.99,
    currency: 'USD',
    analysis: {
      riskScore: 94, // 0 - 100 trust score (higher is safer)
      riskLevel: 'LOW',
      verdict: 'Safe to proceed. Transparent pricing & verified seller history.',
      flags: [
        { type: 'positive', title: 'Clear Return Policy', description: '30-day money-back guarantee with free domestic returns.' },
        { type: 'positive', title: 'No Hidden Fees', description: 'No automatic recurring billing or subscription clause detected.' },
        { type: 'positive', title: 'Verified Seller', description: 'Merchant domain active for >5 years with high customer satisfaction score.' }
      ],
      recommendations: [
        'Proceed using PayPal Purchase Protection for standard item coverage.'
      ]
    }
  },
  subscription_trap: {
    merchantName: 'FitGlow QuickTrial Slim',
    merchantUrl: 'https://fitglow-special-trial-free.net/checkout',
    totalAmount: 4.95,
    currency: 'USD',
    analysis: {
      riskScore: 28,
      riskLevel: 'HIGH',
      verdict: 'Subscription Trap Detected! Hidden recurring billing clauses in checkout fine print.',
      flags: [
        { type: 'danger', title: 'Deceptive "Free Trial" Clause', description: 'Fine print authorizes a recurring charge of $89.99 every 14 days unless cancelled via telephone.' },
        { type: 'danger', title: 'Buried Cancellation Terms', description: 'Mandatory 7-day advance notice required to prevent automated renewal.' },
        { type: 'warning', title: 'Recent Domain Creation', description: 'Domain registered 18 days ago with masked registrar details.' }
      ],
      recommendations: [
        'Do NOT submit payment without reading section 8.2 of Terms of Service.',
        'If proceeding, use PayPal Automatic Payments manager to instantly revoke billing permissions.'
      ]
    }
  },
  counterfeit_scam: {
    merchantName: 'LuxBags-Discount-FlashSale-90off.store',
    merchantUrl: 'https://luxbags-discount-flashsale.store/cart',
    totalAmount: 89.00,
    currency: 'USD',
    analysis: {
      riskScore: 12,
      riskLevel: 'CRITICAL',
      verdict: 'High Likelihood of Counterfeit or Non-Delivery Scam.',
      flags: [
        { type: 'danger', title: 'Unrealistic Deep Discount', description: 'Claiming authentic luxury goods at 90% below MSRP.' },
        { type: 'danger', title: 'No Physical Address or Phone', description: 'Checkout lacks legitimate physical contact address or verifiable tax ID.' },
        { type: 'warning', title: 'Suspicious Domain TLD', description: 'New high-risk generic top-level domain frequently associated with fleeting flash-sale clone stores.' }
      ],
      recommendations: [
        'Avoid purchase. We strongly recommend purchasing only from official brand retailers.',
        'If this is an unfamiliar merchant, inspect customer reviews on independent rating platforms.'
      ]
    }
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PurchaseGuard AI Backend',
    timestamp: new Date().toISOString()
  });
});

// Get preset demo scenarios
app.get('/api/scenarios', (req, res) => {
  res.json({
    success: true,
    scenarios: PRESET_SCENARIOS
  });
});

// Dynamic Checkout Analysis Endpoint
app.post('/api/analyze-checkout', (req, res) => {
  const { merchantName, merchantUrl, totalAmount, currency = 'USD', scenarioPreset } = req.body;

  // If a preset was requested, return that preset
  if (scenarioPreset && PRESET_SCENARIOS[scenarioPreset]) {
    const presetData = PRESET_SCENARIOS[scenarioPreset];
    return res.json({
      success: true,
      data: {
        ...presetData,
        analyzedAt: new Date().toISOString()
      }
    });
  }

  // Dynamic heuristic fallback for custom inputs
  const urlLower = (merchantUrl || '').toLowerCase();
  const nameLower = (merchantName || '').toLowerCase();

  let riskScore = 75;
  let riskLevel = 'MODERATE';
  const flags = [];
  const recommendations = [];

  if (urlLower.includes('trial') || urlLower.includes('free') || nameLower.includes('trial')) {
    riskScore -= 35;
    flags.push({
      type: 'danger',
      title: 'Potential Trial Trap',
      description: 'URL keywords suggest recurring trial clauses. Check for auto-debit renewals.'
    });
    recommendations.push('Inspect recurring payment agreements before confirming.');
  }

  if (urlLower.includes('discount') || urlLower.includes('cheap') || urlLower.includes('sale90')) {
    riskScore -= 25;
    flags.push({
      type: 'warning',
      title: 'Aggressive Discount Pattern',
      description: 'Heuristic flags high risk of substandard or counterfeit merchandise.'
    });
    recommendations.push('Cross-reference item reviews on external trusted platforms.');
  }

  if (flags.length === 0) {
    flags.push({
      type: 'positive',
      title: 'Standard Checkout Pattern',
      description: 'No obvious fraudulent domain signatures or hidden recurring markers identified.'
    });
    recommendations.push('Safe to proceed under PayPal Purchase Protection.');
    riskScore = 88;
    riskLevel = 'LOW';
  } else if (riskScore < 40) {
    riskLevel = 'HIGH';
  }

  return res.json({
    success: true,
    data: {
      merchantName: merchantName || 'Unknown Merchant',
      merchantUrl: merchantUrl || 'https://unknown-merchant.com',
      totalAmount: totalAmount || 0,
      currency,
      analysis: {
        riskScore,
        riskLevel,
        verdict: riskLevel === 'LOW' ? 'Standard transaction risk profile.' : 'Elevated risk parameters identified by AI scan.',
        flags,
        recommendations
      },
      analyzedAt: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`PurchaseGuard AI Backend running on http://localhost:${PORT}`);
});
