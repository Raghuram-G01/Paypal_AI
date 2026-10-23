import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Store,
  DollarSign,
  Globe,
  FileText,
  Clock,
  Layers,
  History,
  Lock,
  Unlock,
  Receipt,
  Sparkles,
  Filter,
  Trash2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import './App.css';

interface RiskFlag {
  type: 'positive' | 'warning' | 'danger';
  title: string;
  description: string;
}

interface AnalysisData {
  merchantName: string;
  merchantUrl: string;
  totalAmount: number;
  currency: string;
  analysis: {
    riskScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    verdict: string;
    flags: RiskFlag[];
    recommendations: string[];
    evidenceExcerpt?: string;
    domainAge?: string;
  };
  analyzedAt?: string;
}

interface OrderRecord {
  id: string;
  orderId: string;
  merchantName: string;
  merchantUrl: string;
  amount: number;
  currency: string;
  timestamp: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: 'PROTECTED_CAPTURED' | 'MANUAL_OVERRIDE_CAPTURED';
  verdict: string;
}

const BACKEND_URL = 'http://localhost:5000';

const INITIAL_ORDER_HISTORY: OrderRecord[] = [
  {
    id: 'ord-09812',
    orderId: '5KL89214NV389102X',
    merchantName: 'Acme Electronics Official Store',
    merchantUrl: 'https://acme-electronics-store.com/checkout',
    amount: 149.99,
    currency: 'USD',
    timestamp: '2026-10-12T14:22:00Z',
    riskScore: 94,
    riskLevel: 'LOW',
    status: 'PROTECTED_CAPTURED',
    verdict: 'Safe to proceed. Transparent pricing & verified seller history.'
  },
  {
    id: 'ord-09804',
    orderId: '3PP71029MK910481A',
    merchantName: 'Nordic Minimalist Gear',
    merchantUrl: 'https://nordic-gear-store.io/cart',
    amount: 68.50,
    currency: 'USD',
    timestamp: '2026-10-10T09:15:30Z',
    riskScore: 91,
    riskLevel: 'LOW',
    status: 'PROTECTED_CAPTURED',
    verdict: 'Verified merchant domain active for 4+ years. Clear 14-day exchange.'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState<'radar' | 'comparison' | 'history'>('radar');
  const [merchantName, setMerchantName] = useState('Acme Electronics Official Store');
  const [merchantUrl, setMerchantUrl] = useState('https://acme-electronics-store.com/checkout');
  const [totalAmount, setTotalAmount] = useState('149.99');
  const [activePreset, setActivePreset] = useState<string>('safe');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [allowCriticalOverride, setAllowCriticalOverride] = useState<boolean>(false);

  // Order History state (stored in localStorage)
  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('purchaseguard_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_ORDER_HISTORY;
  });

  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'LOW' | 'HIGH' | 'CRITICAL'>('ALL');

  // Success Receipt Modal state
  const [receiptModalOrder, setReceiptModalOrder] = useState<OrderRecord | null>(null);

  // Sync order history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('purchaseguard_history', JSON.stringify(orderHistory));
    } catch (e) {
      console.error('Failed to save order history', e);
    }
  }, [orderHistory]);

  // Check backend health on mount & trigger default preset
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/health`)
      .then((res) => res.json())
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));

    triggerPresetAnalysis('safe');
  }, []);

  const triggerPresetAnalysis = async (presetKey: string) => {
    setActivePreset(presetKey);
    setIsAnalyzing(true);
    setAllowCriticalOverride(false);

    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioPreset: presetKey })
      });
      const data = await res.json();
      if (data.success) {
        const enriched = enrichAnalysisWithEvidence(presetKey, data.data);
        setAnalysisResult(enriched);
        setMerchantName(enriched.merchantName);
        setMerchantUrl(enriched.merchantUrl);
        setTotalAmount(String(enriched.totalAmount));
      } else {
        setFallbackPreset(presetKey);
      }
    } catch {
      setFallbackPreset(presetKey);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const enrichAnalysisWithEvidence = (key: string, data: AnalysisData): AnalysisData => {
    if (key === 'safe') {
      return {
        ...data,
        analysis: {
          ...data.analysis,
          evidenceExcerpt: 'Terms of Sale §4.1: "Customers are eligible for a 100% money-back refund within 30 days of shipment receipt. No restocking fees or mandatory subscription requirements apply."',
          domainAge: 'Domain Active: 5.4 Years (ICANN Verified)'
        }
      };
    } else if (key === 'subscription_trap') {
      return {
        ...data,
        analysis: {
          ...data.analysis,
          evidenceExcerpt: 'Hidden Fine-Print Terms §8.2: "By confirming your $4.95 trial shipping, you expressly authorize an automated bi-weekly charge of $89.99 until cancelled via phone hotline with 7-day advance notice."',
          domainAge: 'Domain Registered: 18 Days Ago (Masked Privacy)'
        }
      };
    } else if (key === 'counterfeit_scam') {
      return {
        ...data,
        analysis: {
          ...data.analysis,
          evidenceExcerpt: 'Footer & Checkout Disclaimers: "Flash-sale items are sold AS-IS from overseas liquidation batches. No physical company address, registration number, or refund policy is provided."',
          domainAge: 'Domain Registered: 6 Days Ago (High-Risk TLD .store)'
        }
      };
    }
    return data;
  };

  const handleCustomAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setActivePreset('custom');
    setAllowCriticalOverride(false);

    const numericAmount = parseFloat(totalAmount) || 0;

    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName,
          merchantUrl,
          totalAmount: numericAmount,
          currency: 'USD'
        })
      });
      const data = await res.json();
      if (data.success) {
        setAnalysisResult({
          ...data.data,
          analysis: {
            ...data.data.analysis,
            evidenceExcerpt: `Heuristic Scan of ${merchantUrl}: Terms and checkout parameters evaluated against fraud pattern database.`,
            domainAge: 'Telemetry: Custom URL Analyzed in Real-Time'
          }
        });
      } else {
        setCustomFallback(numericAmount);
      }
    } catch {
      setCustomFallback(numericAmount);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const setCustomFallback = (amount: number) => {
    const urlLower = merchantUrl.toLowerCase();
    const isTrap = urlLower.includes('trial') || urlLower.includes('free');
    const isScam = urlLower.includes('discount') || urlLower.includes('sale') || urlLower.includes('cheap');

    let score = 78;
    let level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'MODERATE';
    const flags: RiskFlag[] = [];

    if (isTrap) {
      score = 32;
      level = 'HIGH';
      flags.push({
        type: 'danger',
        title: 'Trial Trap Pattern Detected',
        description: 'URL parameters match recurring auto-billing subscription funnels.'
      });
    } else if (isScam) {
      score = 15;
      level = 'CRITICAL';
      flags.push({
        type: 'danger',
        title: 'High Risk Flash-Sale Clone',
        description: 'Deep discount patterns with masked registrar indicators.'
      });
    } else {
      score = 88;
      level = 'LOW';
      flags.push({
        type: 'positive',
        title: 'Standard Checkout Signature',
        description: 'No deceptive recurring clauses or malicious redirection patterns detected.'
      });
    }

    setAnalysisResult({
      merchantName: merchantName || 'Custom Store',
      merchantUrl: merchantUrl || 'https://store-checkout.com',
      totalAmount: amount,
      currency: 'USD',
      analysis: {
        riskScore: score,
        riskLevel: level,
        verdict: level === 'LOW' ? 'Safe to proceed under PayPal Purchase Protection.' : 'Elevated risk parameters identified by AI scan.',
        flags,
        recommendations: [
          'Verify checkout authenticity before confirming PayPal authorization.',
          'Review PayPal transaction activity log post-checkout.'
        ],
        evidenceExcerpt: `Offline Heuristic Engine: Analyzed ${merchantUrl}.`,
        domainAge: 'SSL Encrypted Checkout'
      }
    });
  };

  const setFallbackPreset = (preset: string) => {
    if (preset === 'safe') {
      setMerchantName('Acme Electronics Official Store');
      setMerchantUrl('https://acme-electronics-store.com/checkout');
      setTotalAmount('149.99');
      setAnalysisResult({
        merchantName: 'Acme Electronics Official Store',
        merchantUrl: 'https://acme-electronics-store.com/checkout',
        totalAmount: 149.99,
        currency: 'USD',
        analysis: {
          riskScore: 94,
          riskLevel: 'LOW',
          verdict: 'Safe to proceed. Transparent pricing & verified seller history.',
          flags: [
            { type: 'positive', title: 'Clear Return Policy', description: '30-day money-back guarantee with free domestic returns.' },
            { type: 'positive', title: 'No Hidden Fees', description: 'No automatic recurring billing or subscription clause detected.' },
            { type: 'positive', title: 'Verified Seller', description: 'Merchant domain active for >5 years with high customer satisfaction.' }
          ],
          recommendations: ['Proceed using PayPal Purchase Protection for standard item coverage.'],
          evidenceExcerpt: 'Terms of Sale §4.1: "Customers are eligible for a 100% money-back refund within 30 days of shipment receipt. No restocking fees apply."',
          domainAge: 'Domain Active: 5.4 Years (ICANN Verified)'
        }
      });
    } else if (preset === 'subscription_trap') {
      setMerchantName('FitGlow QuickTrial Slim');
      setMerchantUrl('https://fitglow-special-trial-free.net/checkout');
      setTotalAmount('4.95');
      setAnalysisResult({
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
          ],
          evidenceExcerpt: 'Hidden Fine-Print Terms §8.2: "By confirming your $4.95 trial shipping, you expressly authorize an automated bi-weekly charge of $89.99 until cancelled via phone hotline with 7-day advance notice."',
          domainAge: 'Domain Registered: 18 Days Ago (Masked Privacy)'
        }
      });
    } else if (preset === 'counterfeit_scam') {
      setMerchantName('LuxBags-Discount-FlashSale-90off.store');
      setMerchantUrl('https://luxbags-discount-flashsale.store/cart');
      setTotalAmount('89.00');
      setAnalysisResult({
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
            { type: 'danger', title: 'No Physical Address', description: 'Checkout lacks legitimate physical contact address or verifiable tax ID.' },
            { type: 'warning', title: 'Suspicious Domain TLD', description: 'High-risk generic top-level domain frequently associated with flash-sale clone stores.' }
          ],
          recommendations: [
            'Avoid purchase. We strongly recommend purchasing only from official brand retailers.',
            'If this is an unfamiliar merchant, inspect customer reviews on independent rating platforms.'
          ],
          evidenceExcerpt: 'Footer & Checkout Disclaimers: "Flash-sale items are sold AS-IS from overseas liquidation batches. No physical company address, registration number, or refund policy is provided."',
          domainAge: 'Domain Registered: 6 Days Ago (High-Risk TLD .store)'
        }
      });
    }
  };

  // Record a captured order into Order History and trigger receipt modal
  const handleOrderCaptured = (paypalOrderId: string) => {
    if (!analysisResult) return;

    const newRecord: OrderRecord = {
      id: `ord-${Math.floor(10000 + Math.random() * 90000)}`,
      orderId: paypalOrderId,
      merchantName: analysisResult.merchantName,
      merchantUrl: analysisResult.merchantUrl,
      amount: analysisResult.totalAmount || parseFloat(totalAmount) || 1.0,
      currency: analysisResult.currency || 'USD',
      timestamp: new Date().toISOString(),
      riskScore: analysisResult.analysis.riskScore,
      riskLevel: analysisResult.analysis.riskLevel,
      status: allowCriticalOverride && analysisResult.analysis.riskLevel === 'CRITICAL'
        ? 'MANUAL_OVERRIDE_CAPTURED'
        : 'PROTECTED_CAPTURED',
      verdict: analysisResult.analysis.verdict
    };

    setOrderHistory((prev) => [newRecord, ...prev]);
    setReceiptModalOrder(newRecord);
  };

  const filteredHistory = orderHistory.filter((item) => {
    if (historyFilter === 'ALL') return true;
    return item.riskLevel === historyFilter;
  });

  const parsedAmount = parseFloat(totalAmount) || 0;
  const estimatedTax = parsedAmount > 0 ? Number((parsedAmount * 0.0825).toFixed(2)) : 0;
  const totalWithTax = Number((parsedAmount + estimatedTax).toFixed(2));

  return (
    <PayPalScriptProvider options={{ clientId: 'test', currency: 'USD' }}>
      <div className="pg-app">
        {/* Navigation Bar */}
        <header className="pg-navbar">
          <div className="pg-container pg-navbar-inner">
            <div className="pg-brand-lockup">
              <div className="pg-brand-icon">
                <ShieldCheck size={22} strokeWidth={2.4} />
              </div>
              <div className="pg-brand-meta">
                <div className="pg-brand-title">
                  PurchaseGuard AI
                  <span className="pg-brand-tag">Production Shield</span>
                </div>
                <div className="pg-brand-subtitle">
                  Intelligent Pre-Checkout Fraud & Trap Radar for PayPal
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="pg-nav-tabs">
              <button
                type="button"
                className={`pg-nav-tab ${activeTab === 'radar' ? 'active' : ''}`}
                onClick={() => setActiveTab('radar')}
              >
                <Sparkles size={16} />
                <span>Live Checkout Radar</span>
              </button>
              <button
                type="button"
                className={`pg-nav-tab ${activeTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setActiveTab('comparison')}
              >
                <Layers size={16} />
                <span>Protection Comparison</span>
              </button>
              <button
                type="button"
                className={`pg-nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={16} />
                <span>Order History</span>
                <span className="pg-tab-counter">{orderHistory.length}</span>
              </button>
            </nav>

            {/* Backend Connectivity Status */}
            <div className="pg-nav-status">
              <div className="pg-status-pill" title="Express 5 API Connection Status">
                <span className={`pg-pulse-dot ${backendOnline ? '' : 'offline'}`} />
                <span>{backendOnline ? 'API Connected' : 'Simulation Mode'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* View 1: Live Checkout Radar */}
        {activeTab === 'radar' && (
          <main className="pg-container">
            {/* Hero / Intro */}
            <section className="pg-hero">
              <div className="pg-hero-content">
                <div className="pg-hero-badge">
                  <ShieldCheck size={14} />
                  <span>Real-Time Decision Intelligence</span>
                </div>
                <h1 className="pg-hero-title">Pre-Checkout Fraud Radar & Trap Shield</h1>
                <p className="pg-hero-desc">
                  Inspect external merchant checkouts before funds leave your PayPal account. PurchaseGuard scans hidden recurring clauses, counterfeit markers, and seller track records.
                </p>
              </div>
            </section>

            {/* Hackathon Demo Presets */}
            <section className="pg-presets-wrapper">
              <div className="pg-presets-card">
                <div className="pg-presets-header">
                  <span className="pg-presets-title">
                    <Sparkles size={14} />
                    Verified Sandbox Scenarios
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Click a scenario to simulate immediate threat detection
                  </span>
                </div>

                <div className="pg-presets-grid">
                  <button
                    type="button"
                    className={`pg-preset-btn ${activePreset === 'safe' ? 'active' : ''}`}
                    onClick={() => triggerPresetAnalysis('safe')}
                  >
                    <div className="pg-preset-btn-top">
                      <span className="pg-preset-name">
                        <Store size={15} />
                        Verified Electronics
                      </span>
                      <span className="pg-risk-badge low">
                        <CheckCircle2 size={12} />
                        Safe (94/100)
                      </span>
                    </div>
                    <p className="pg-preset-desc">
                      Established seller with 30-day money-back guarantee and zero hidden terms.
                    </p>
                  </button>

                  <button
                    type="button"
                    className={`pg-preset-btn ${activePreset === 'subscription_trap' ? 'active' : ''}`}
                    onClick={() => triggerPresetAnalysis('subscription_trap')}
                  >
                    <div className="pg-preset-btn-top">
                      <span className="pg-preset-name">
                        <AlertTriangle size={15} />
                        Subscription Trap
                      </span>
                      <span className="pg-risk-badge high">
                        <AlertTriangle size={12} />
                        High Risk (28/100)
                      </span>
                    </div>
                    <p className="pg-preset-desc">
                      Deceptive $4.95 trial hiding an automated $89.99 recurring charge every 14 days.
                    </p>
                  </button>

                  <button
                    type="button"
                    className={`pg-preset-btn ${activePreset === 'counterfeit_scam' ? 'active' : ''}`}
                    onClick={() => triggerPresetAnalysis('counterfeit_scam')}
                  >
                    <div className="pg-preset-btn-top">
                      <span className="pg-preset-name">
                        <ShieldAlert size={15} />
                        Counterfeit Scam
                      </span>
                      <span className="pg-risk-badge critical">
                        <ShieldAlert size={12} />
                        Critical (12/100)
                      </span>
                    </div>
                    <p className="pg-preset-desc">
                      Suspicious 90% luxury clone site registered 6 days ago with zero address info.
                    </p>
                  </button>
                </div>
              </div>
            </section>

            {/* Main Two-Column Layout */}
            <div className="pg-layout-grid">
              {/* Left Column: Input Form & Price Breakdown */}
              <div className="pg-col-left">
                {/* Card 1: Checkout Inspector */}
                <section className="pg-card">
                  <div className="pg-card-header">
                    <h2 className="pg-card-title">
                      <Store size={18} />
                      Checkout Inspector
                    </h2>
                    <p className="pg-card-subtitle">
                      Simulate a customer attempting to pay via PayPal on an external merchant domain.
                    </p>
                  </div>

                  <form onSubmit={handleCustomAnalyze}>
                    <div className="pg-form-group">
                      <label className="pg-form-label">Merchant / Store Name</label>
                      <div className="pg-form-input-wrap">
                        <Store size={16} className="pg-form-input-icon" />
                        <input
                          type="text"
                          className="pg-form-input"
                          value={merchantName}
                          onChange={(e) => setMerchantName(e.target.value)}
                          placeholder="e.g. Acme Electronics"
                          required
                        />
                      </div>
                    </div>

                    <div className="pg-form-group">
                      <label className="pg-form-label">Checkout URL</label>
                      <div className="pg-form-input-wrap">
                        <Globe size={16} className="pg-form-input-icon" />
                        <input
                          type="url"
                          className="pg-form-input"
                          value={merchantUrl}
                          onChange={(e) => setMerchantUrl(e.target.value)}
                          placeholder="https://example.com/checkout"
                          required
                        />
                      </div>
                    </div>

                    <div className="pg-form-row">
                      <div className="pg-form-group">
                        <label className="pg-form-label">Cart Subtotal</label>
                        <div className="pg-form-input-wrap">
                          <DollarSign size={16} className="pg-form-input-icon" />
                          <input
                            type="number"
                            step="0.01"
                            className="pg-form-input num-tabular"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div className="pg-form-group">
                        <label className="pg-form-label">Settlement Currency</label>
                        <input
                          type="text"
                          className="pg-form-input"
                          value="USD"
                          disabled
                          style={{ backgroundColor: 'var(--bg-canvas-subtle)', color: 'var(--text-muted)' }}
                        />
                      </div>
                    </div>

                    <button type="submit" className="pg-btn-primary" disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <>
                          <Clock size={16} />
                          <span>Scanning with PurchaseGuard AI...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          <span>Scan Checkout with PurchaseGuard</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>

                {/* Card 2: Purchase Review & Price Breakdown */}
                <section className="pg-card">
                  <div className="pg-card-header">
                    <h2 className="pg-card-title">
                      <Receipt size={18} />
                      Purchase Review & Price Breakdown
                    </h2>
                    <p className="pg-card-subtitle">
                      Itemized order calculation verified prior to payment authorization.
                    </p>
                  </div>

                  <table className="pg-breakdown-table">
                    <tbody>
                      <tr>
                        <td className="pg-breakdown-label">Item Subtotal</td>
                        <td className="pg-breakdown-value num-tabular">${parsedAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="pg-breakdown-label">Estimated Sales Tax (8.25%)</td>
                        <td className="pg-breakdown-value num-tabular">${estimatedTax.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="pg-breakdown-label">Standard Delivery</td>
                        <td className="pg-breakdown-value num-tabular">$0.00</td>
                      </tr>
                      <tr>
                        <td className="pg-breakdown-label">
                          PurchaseGuard AI Fraud Shield
                          <span className="pg-included-pill">Free with PayPal</span>
                        </td>
                        <td className="pg-breakdown-value num-tabular">$0.00</td>
                      </tr>
                      <tr className="total-row">
                        <td className="pg-breakdown-label">Total Amount Due</td>
                        <td className="pg-breakdown-value num-tabular">${totalWithTax.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Billing disclosure pill */}
                  {analysisResult && (
                    <>
                      {analysisResult.analysis.riskLevel === 'LOW' && (
                        <div className="pg-billing-disclosure safe">
                          <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>One-Time Payment Confirmed:</strong> No recurring clauses or auto-renewal commitments detected in merchant checkout terms.
                          </div>
                        </div>
                      )}
                      {analysisResult.analysis.riskLevel === 'HIGH' && (
                        <div className="pg-billing-disclosure warning">
                          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Hidden Recurring Clause Detected:</strong> Fine print authorizes bi-weekly billing of $89.99 following this trial charge.
                          </div>
                        </div>
                      )}
                      {analysisResult.analysis.riskLevel === 'CRITICAL' && (
                        <div className="pg-billing-disclosure danger">
                          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>High-Risk Transaction Flag:</strong> Extremely high likelihood of fraudulent clone store or counterfeit merchandise.
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>

              {/* Right Column: AI Risk Assessment & PayPal Checkout */}
              <div className="pg-col-right">
                <section className="pg-card">
                  <div className="pg-card-header">
                    <h2 className="pg-card-title">
                      <Sparkles size={18} />
                      AI Purchase Assessment
                    </h2>
                    <p className="pg-card-subtitle">
                      Real-time forensic evaluation across seller history, fine-print clauses, and domain reputation.
                    </p>
                  </div>

                  {analysisResult && (
                    <>
                      {/* Trust Score Header */}
                      <div className={`pg-score-banner ${analysisResult.analysis.riskLevel === 'LOW' ? 'safe' : analysisResult.analysis.riskLevel === 'CRITICAL' ? 'danger' : 'warning'}`}>
                        <div className="pg-score-circle">
                          <span className="pg-score-num">{analysisResult.analysis.riskScore}</span>
                          <span className="pg-score-denom">Trust / 100</span>
                        </div>
                        <div className="pg-score-details">
                          <span className={`pg-risk-badge ${analysisResult.analysis.riskLevel.toLowerCase()}`}>
                            {analysisResult.analysis.riskLevel === 'LOW' ? (
                              <CheckCircle2 size={13} />
                            ) : analysisResult.analysis.riskLevel === 'CRITICAL' ? (
                              <ShieldAlert size={13} />
                            ) : (
                              <AlertTriangle size={13} />
                            )}
                            {analysisResult.analysis.riskLevel} RISK PROFILE
                          </span>
                          <p className="pg-score-verdict">{analysisResult.analysis.verdict}</p>
                          <span className="pg-score-meta">
                            Verified on {new Date().toLocaleTimeString()} • Powered by PurchaseGuard AI
                          </span>
                        </div>
                      </div>

                      {/* Evidence & Fine-Print Extraction */}
                      {analysisResult.analysis.evidenceExcerpt && (
                        <div className="pg-evidence-section">
                          <div className="pg-evidence-title">
                            <FileText size={15} />
                            Extracted Terms of Service & Telemetry Evidence
                          </div>
                          <div className={`pg-evidence-quote ${analysisResult.analysis.riskLevel === 'CRITICAL' || analysisResult.analysis.riskLevel === 'HIGH' ? 'danger' : ''}`}>
                            "{analysisResult.analysis.evidenceExcerpt}"
                          </div>
                          <div className="pg-evidence-telemetry">
                            <span className="pg-telemetry-item">
                              <Globe size={13} />
                              {analysisResult.analysis.domainAge || 'Domain SSL Verified'}
                            </span>
                            <span className="pg-telemetry-item">
                              <Lock size={13} />
                              TLS 1.3 256-bit
                            </span>
                            <span className="pg-telemetry-item">
                              <ExternalLink size={13} />
                              {analysisResult.merchantUrl}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Detected Risk Flags */}
                      <div>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          Risk Indicators & Audit Flags ({analysisResult.analysis.flags.length})
                        </h3>
                        <div className="pg-flags-list">
                          {analysisResult.analysis.flags.map((flag, idx) => (
                            <div key={idx} className={`pg-flag-item ${flag.type}`}>
                              <div className="pg-flag-icon-wrap">
                                {flag.type === 'positive' ? (
                                  <CheckCircle2 size={18} />
                                ) : flag.type === 'warning' ? (
                                  <AlertTriangle size={18} />
                                ) : (
                                  <ShieldAlert size={18} />
                                )}
                              </div>
                              <div className="pg-flag-content">
                                <span className="pg-flag-header">{flag.title}</span>
                                <p className="pg-flag-desc">{flag.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actionable Recommendations */}
                      {analysisResult.analysis.recommendations.length > 0 && (
                        <div className="pg-recommendations-box">
                          <div className="pg-recommendations-title">
                            <ShieldCheck size={15} />
                            Actionable Purchase Recommendations:
                          </div>
                          <ul className="pg-recommendations-list">
                            {analysisResult.analysis.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* PayPal Sandbox Checkout Area */}
                      <div className="pg-checkout-zone">
                        <div className="pg-security-badge">
                          <Lock size={14} />
                          <span>Official PayPal Sandbox Payment Portal • PurchaseGuard Protected</span>
                        </div>

                        {/* Critical Risk Hard Block with Override option */}
                        {analysisResult.analysis.riskLevel === 'CRITICAL' && !allowCriticalOverride ? (
                          <div className="pg-scam-block-card">
                            <ShieldAlert size={36} color="var(--crimson-primary)" />
                            <h4>Transaction Blocked by PurchaseGuard AI</h4>
                            <p>
                              Automated checkout has been halted to prevent fraudulent fund transfer to an unverified clone store.
                            </p>
                            <button
                              type="button"
                              className="pg-override-btn"
                              onClick={() => setAllowCriticalOverride(true)}
                            >
                              <Unlock size={14} />
                              Developer Sandbox Override: Test PayPal Button Anyway
                            </button>
                          </div>
                        ) : (
                          <div>
                            {analysisResult.analysis.riskLevel === 'CRITICAL' && allowCriticalOverride && (
                              <div className="pg-high-risk-alert" style={{ backgroundColor: 'var(--crimson-surface)', borderColor: 'var(--crimson-border)', color: 'var(--crimson-text)' }}>
                                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                                <div>
                                  <strong>Sandbox Override Active:</strong> You have overridden the safety block for demo testing purposes.
                                </div>
                              </div>
                            )}

                            {analysisResult.analysis.riskLevel === 'HIGH' && (
                              <div className="pg-high-risk-alert">
                                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                                <div>
                                  <strong>Caution:</strong> You are authorizing payment to a high-risk merchant with detected recurring terms. Check cancellation terms.
                                </div>
                              </div>
                            )}

                            {/* Live PayPal Smart Buttons */}
                            <PayPalButtons
                              style={{ layout: 'vertical', shape: 'rect', color: 'gold', height: 44 }}
                              createOrder={(_data, actions) => {
                                return actions.order.create({
                                  intent: 'CAPTURE',
                                  purchase_units: [
                                    {
                                      description: `${analysisResult.merchantName} - PurchaseGuard Protected Order`,
                                      amount: {
                                        currency_code: 'USD',
                                        value: (totalWithTax || 1.0).toFixed(2),
                                      },
                                    },
                                  ],
                                });
                              }}
                              onApprove={async (_data, actions) => {
                                if (actions.order) {
                                  const order = await actions.order.capture();
                                  handleOrderCaptured(order.id || `SIM-${Date.now()}`);
                                }
                              }}
                              onError={(err) => {
                                console.error('PayPal Buttons Error:', err);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </div>
          </main>
        )}

        {/* View 2: Product & Safety Comparison */}
        {activeTab === 'comparison' && (
          <main className="pg-container pg-comparison-view">
            <section className="pg-hero">
              <div className="pg-hero-content">
                <div className="pg-hero-badge">
                  <Layers size={14} />
                  <span>Feature & Safety Matrix</span>
                </div>
                <h1 className="pg-hero-title">Protection & Risk Profile Comparison</h1>
                <p className="pg-hero-desc">
                  Compare how PurchaseGuard AI elevates ordinary checkouts with pre-transaction intelligence, fine-print analysis, and proactive scam shielding.
                </p>
              </div>
            </section>

            {/* Table 1: Standard Checkout vs PurchaseGuard Protected Checkout */}
            <section className="pg-card" style={{ marginBottom: '32px' }}>
              <div className="pg-card-header">
                <h2 className="pg-card-title">
                  <ShieldCheck size={18} />
                  Direct Unprotected Checkout vs PurchaseGuard Protected Checkout
                </h2>
                <p className="pg-card-subtitle">
                  Key security and financial protection capabilities at the point of sale.
                </p>
              </div>

              <div className="pg-table-responsive">
                <table className="pg-matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Protection Dimension</th>
                      <th style={{ width: '35%' }}>Standard Direct Checkout</th>
                      <th style={{ width: '35%' }}>PurchaseGuard Protected Checkout</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pg-feature-name">
                        <FileText size={15} />
                        Hidden Fine-Print & Auto-Debit Radar
                      </td>
                      <td className="pg-cell-unprotected">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <X size={15} color="var(--crimson-primary)" />
                          Zero detection. Buyer must read 30+ pages of legal terms.
                        </span>
                      </td>
                      <td className="pg-cell-protected">
                        <Check size={15} color="var(--emerald-primary)" />
                        Real-time AI clause extraction flags hidden fees instantly.
                      </td>
                    </tr>
                    <tr>
                      <td className="pg-feature-name">
                        <Globe size={15} />
                        Domain Legitimacy & Clone Store Screening
                      </td>
                      <td className="pg-cell-unprotected">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <X size={15} color="var(--crimson-primary)" />
                          Blind payment. Fraudulent clone sites easily accept funds.
                        </span>
                      </td>
                      <td className="pg-cell-protected">
                        <Check size={15} color="var(--emerald-primary)" />
                        Domain age, WHOIS privacy, and discount heuristics verified.
                      </td>
                    </tr>
                    <tr>
                      <td className="pg-feature-name">
                        <Receipt size={15} />
                        Return & Refund Guarantee Enforcement
                      </td>
                      <td className="pg-cell-unprotected">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <X size={15} color="var(--crimson-primary)" />
                          Opaque return policies often revealed after shipment.
                        </span>
                      </td>
                      <td className="pg-cell-protected">
                        <Check size={15} color="var(--emerald-primary)" />
                        Scans for explicit 30-day money-back clauses prior to pay.
                      </td>
                    </tr>
                    <tr>
                      <td className="pg-feature-name">
                        <ShieldAlert size={15} />
                        Automated Scam Interception
                      </td>
                      <td className="pg-cell-unprotected">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <X size={15} color="var(--crimson-primary)" />
                          Transaction processes immediately regardless of scam signals.
                        </span>
                      </td>
                      <td className="pg-cell-protected">
                        <Check size={15} color="var(--emerald-primary)" />
                        Proactively halts PayPal authorization on critical-risk domains.
                      </td>
                    </tr>
                    <tr>
                      <td className="pg-feature-name">
                        <Lock size={15} />
                        One-Click Subscription Revocation Guidance
                      </td>
                      <td className="pg-cell-unprotected">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <X size={15} color="var(--crimson-primary)" />
                          Buyer often unaware of recurring debit agreement.
                        </span>
                      </td>
                      <td className="pg-cell-protected">
                        <Check size={15} color="var(--emerald-primary)" />
                        Direct links to PayPal Automatic Payments manager.
                      </td>
                    </tr>
                    <tr>
                      <td className="pg-feature-name">
                        <CheckCircle2 size={15} />
                        PayPal Purchase Protection Optimization
                      </td>
                      <td className="pg-cell-unprotected">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <AlertCircle size={15} color="var(--amber-primary)" />
                          Reactive dispute filing requiring manual proof gathering.
                        </span>
                      </td>
                      <td className="pg-cell-protected">
                        <Check size={15} color="var(--emerald-primary)" />
                        Evidence-backed audit logs recorded for instant dispute claims.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Table 2: Demo Scenarios Risk Profile Breakdown */}
            <section className="pg-card">
              <div className="pg-card-header">
                <h2 className="pg-card-title">
                  <Sparkles size={18} />
                  Demo Scenarios Risk Profile Comparison
                </h2>
                <p className="pg-card-subtitle">
                  Real-time benchmark comparison across the three hackathon test merchants.
                </p>
              </div>

              <div className="pg-table-responsive">
                <table className="pg-matrix-table">
                  <thead>
                    <tr>
                      <th>Merchant</th>
                      <th>Category</th>
                      <th>Trust Score</th>
                      <th>Primary Threat Detected</th>
                      <th>PurchaseGuard Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Acme Electronics</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>acme-electronics-store.com</div>
                      </td>
                      <td>Authorized Electronics</td>
                      <td>
                        <span className="pg-risk-badge low">
                          <CheckCircle2 size={12} />
                          94 / 100
                        </span>
                      </td>
                      <td>None (Clean policies & 5-year domain)</td>
                      <td style={{ color: 'var(--emerald-text)', fontWeight: 600 }}>
                        Approved for standard PayPal Checkout
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>FitGlow QuickTrial</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>fitglow-special-trial-free.net</div>
                      </td>
                      <td>Health & Wellness Trial</td>
                      <td>
                        <span className="pg-risk-badge high">
                          <AlertTriangle size={12} />
                          28 / 100
                        </span>
                      </td>
                      <td>Hidden $89.99 auto-debit every 14 days</td>
                      <td style={{ color: 'var(--amber-text)', fontWeight: 600 }}>
                        High-Risk Warning Banner & Revocation Guidance
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>LuxBags FlashSale</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>luxbags-discount-flashsale.store</div>
                      </td>
                      <td>Luxury Goods Clone</td>
                      <td>
                        <span className="pg-risk-badge critical">
                          <ShieldAlert size={12} />
                          12 / 100
                        </span>
                      </td>
                      <td>Unrealistic 90% discount, masked address</td>
                      <td style={{ color: 'var(--crimson-text)', fontWeight: 600 }}>
                        Automated Checkout Blocked & Intercepted
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        )}

        {/* View 3: Order & Protection History */}
        {activeTab === 'history' && (
          <main className="pg-container pg-history-view">
            <section className="pg-hero">
              <div className="pg-hero-content">
                <div className="pg-hero-badge">
                  <History size={14} />
                  <span>Audit Trail</span>
                </div>
                <h1 className="pg-hero-title">Order & Protection History</h1>
                <p className="pg-hero-desc">
                  Review all purchases captured through PayPal Sandbox with their verified risk scores, fine-print analysis, and transaction receipts.
                </p>
              </div>
            </section>

            <section className="pg-card">
              <div className="pg-history-header">
                <div className="pg-history-filters">
                  <button
                    type="button"
                    className={`pg-filter-btn ${historyFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setHistoryFilter('ALL')}
                  >
                    All Orders ({orderHistory.length})
                  </button>
                  <button
                    type="button"
                    className={`pg-filter-btn ${historyFilter === 'LOW' ? 'active' : ''}`}
                    onClick={() => setHistoryFilter('LOW')}
                  >
                    Low Risk (Verified)
                  </button>
                  <button
                    type="button"
                    className={`pg-filter-btn ${historyFilter === 'HIGH' ? 'active' : ''}`}
                    onClick={() => setHistoryFilter('HIGH')}
                  >
                    High Risk
                  </button>
                  <button
                    type="button"
                    className={`pg-filter-btn ${historyFilter === 'CRITICAL' ? 'active' : ''}`}
                    onClick={() => setHistoryFilter('CRITICAL')}
                  >
                    Critical Override
                  </button>
                </div>

                <div className="pg-history-actions">
                  <button
                    type="button"
                    className="pg-btn-subtle"
                    onClick={() => setOrderHistory(INITIAL_ORDER_HISTORY)}
                    title="Reset to default demonstration records"
                  >
                    <Filter size={14} />
                    Reset Demo Log
                  </button>
                  <button
                    type="button"
                    className="pg-btn-subtle"
                    onClick={() => setOrderHistory([])}
                    title="Clear transaction history"
                  >
                    <Trash2 size={14} />
                    Clear History
                  </button>
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="pg-empty-state">
                  <div className="pg-empty-icon">
                    <History size={24} />
                  </div>
                  <h3 className="pg-empty-title">No transactions found</h3>
                  <p className="pg-empty-desc">
                    {orderHistory.length === 0
                      ? 'No PayPal orders have been recorded yet. Complete a checkout in the Live Radar to log your first protected purchase.'
                      : 'No records matching the selected risk filter.'}
                  </p>
                  {orderHistory.length === 0 && (
                    <button
                      type="button"
                      className="pg-btn-primary"
                      style={{ width: 'auto', marginTop: '10px' }}
                      onClick={() => setActiveTab('radar')}
                    >
                      <Sparkles size={16} />
                      Go to Live Checkout Radar
                    </button>
                  )}
                </div>
              ) : (
                <div className="pg-table-responsive">
                  <table className="pg-matrix-table">
                    <thead>
                      <tr>
                        <th>PayPal Order ID</th>
                        <th>Merchant & URL</th>
                        <th>Date & Time</th>
                        <th>Amount</th>
                        <th>Trust Score</th>
                        <th>Protection Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((order) => (
                        <tr key={order.id}>
                          <td className="num-tabular" style={{ fontWeight: 600 }}>
                            {order.orderId}
                          </td>
                          <td>
                            <strong>{order.merchantName}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{order.merchantUrl}</div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(order.timestamp).toLocaleString()}
                          </td>
                          <td className="num-tabular" style={{ fontWeight: 700 }}>
                            ${order.amount.toFixed(2)} {order.currency}
                          </td>
                          <td>
                            <span className={`pg-risk-badge ${order.riskLevel.toLowerCase()}`}>
                              {order.riskScore} / 100
                            </span>
                          </td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: order.status === 'PROTECTED_CAPTURED' ? 'var(--emerald-text)' : 'var(--amber-text)' }}>
                              <ShieldCheck size={14} />
                              {order.status === 'PROTECTED_CAPTURED' ? 'Protected & Captured' : 'Override Captured'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="pg-btn-subtle"
                              onClick={() => setReceiptModalOrder(order)}
                            >
                              <Receipt size={14} />
                              Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        )}

        {/* Transaction Success Receipt Modal */}
        {receiptModalOrder && (
          <div className="pg-modal-backdrop" onClick={() => setReceiptModalOrder(null)}>
            <div className="pg-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="pg-modal-top">
                <div className="pg-modal-top-icon">
                  <CheckCircle2 size={26} />
                </div>
                <h3 className="pg-modal-title">Payment Captured via PayPal Sandbox</h3>
                <p className="pg-modal-desc">
                  Transaction verified and registered under PurchaseGuard AI protection.
                </p>
              </div>

              <div className="pg-modal-body">
                <div className="pg-receipt-row">
                  <span className="pg-receipt-label">PayPal Order ID</span>
                  <span className="pg-receipt-value num-tabular">{receiptModalOrder.orderId}</span>
                </div>
                <div className="pg-receipt-row">
                  <span className="pg-receipt-label">Merchant Name</span>
                  <span className="pg-receipt-value">{receiptModalOrder.merchantName}</span>
                </div>
                <div className="pg-receipt-row">
                  <span className="pg-receipt-label">Total Amount Paid</span>
                  <span className="pg-receipt-value num-tabular">
                    ${receiptModalOrder.amount.toFixed(2)} {receiptModalOrder.currency}
                  </span>
                </div>
                <div className="pg-receipt-row">
                  <span className="pg-receipt-label">Trust Score at Authorization</span>
                  <span className="pg-receipt-value">
                    <span className={`pg-risk-badge ${receiptModalOrder.riskLevel.toLowerCase()}`}>
                      {receiptModalOrder.riskScore} / 100 ({receiptModalOrder.riskLevel} Risk)
                    </span>
                  </span>
                </div>
                <div className="pg-receipt-row">
                  <span className="pg-receipt-label">Capture Timestamp</span>
                  <span className="pg-receipt-value" style={{ fontSize: '0.8rem' }}>
                    {new Date(receiptModalOrder.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="pg-receipt-row">
                  <span className="pg-receipt-label">Protection Status</span>
                  <span className="pg-receipt-value" style={{ color: 'var(--emerald-text)' }}>
                    Active • PayPal Buyer Coverage
                  </span>
                </div>
              </div>

              <div className="pg-modal-footer">
                <button
                  type="button"
                  className="pg-btn-primary"
                  onClick={() => setReceiptModalOrder(null)}
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PayPalScriptProvider>
  );
}

export default App;
