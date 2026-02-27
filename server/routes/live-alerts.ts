import { RequestHandler } from "express";
import { LiveAlertsResponse } from "@shared/api";

// Mock database
const alerts = [
  {
    id: "alert-001",
    title: "Fake ICICI Bank App Warning",
    description:
      "Multiple reports of fake ICICI Bank app on Google Play Store that steals banking credentials",
    severity: "critical" as const,
    type: "Phishing",
    targetAudience: "ICICI Bank Users",
    reportedCases: 1247,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    preventionTips: [
      "Only download from official Google Play Store",
      "Verify app developer is ICICI Bank Limited",
      "Check the blue verification badge",
      "Report suspicious apps immediately",
    ],
  },
  {
    id: "alert-002",
    title: "Amazon Gift Card Scam Surge",
    description:
      "Spike in SMS scams asking users to confirm purchases with gift cards",
    severity: "high" as const,
    type: "SMS Fraud",
    targetAudience: "All Amazon Users",
    reportedCases: 3892,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    preventionTips: [
      "Amazon never asks for payment via gift cards",
      "Never click links in unsolicited SMS",
      "Log in to your Amazon account directly",
      "Report phishing to Amazon security team",
    ],
  },
  {
    id: "alert-003",
    title: "Cryptocurrency Exchange Hack",
    description:
      "Major cryptocurrency exchange experiencing suspicious withdrawal activity",
    severity: "critical" as const,
    type: "Account Compromise",
    targetAudience: "Crypto Investors",
    reportedCases: 5621,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    preventionTips: [
      "Enable two-factor authentication",
      "Use hardware wallets for storage",
      "Never share seed phrases",
      "Monitor your account activity regularly",
    ],
  },
  {
    id: "alert-004",
    title: "Tax Return Phishing Campaign",
    description:
      "Income Tax Department impersonation emails asking for personal information",
    severity: "high" as const,
    type: "Phishing",
    targetAudience: "Taxpayers",
    reportedCases: 2156,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    preventionTips: [
      "Income Tax Department never asks for passwords via email",
      "Visit only official income-tax.gov.in website",
      "Be suspicious of urgent tax demands",
      "Verify sender email address carefully",
    ],
  },
  {
    id: "alert-005",
    title: "LinkedIn Job Scam Network",
    description:
      "Organized job scam targeting professionals on LinkedIn with fake tech job offers",
    severity: "medium" as const,
    type: "Job Scam",
    targetAudience: "Job Seekers",
    reportedCases: 1834,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    preventionTips: [
      "Research companies before applying",
      "Be wary of jobs requiring upfront payments",
      "Verify email addresses are from official domains",
      "Use LinkedIn's official messaging system only",
    ],
  },
  {
    id: "alert-006",
    title: "WhatsApp Gold Variant Spreading",
    description:
      "Modified WhatsApp malware variant targeting Indian users with promise of 'WhatsApp Gold'",
    severity: "high" as const,
    type: "Malware",
    targetAudience: "WhatsApp Users",
    reportedCases: 4523,
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    preventionTips: [
      "Only download WhatsApp from official app stores",
      "Ignore forwarded messages about new WhatsApp versions",
      "Don't click links from unknown contacts",
      "Keep your app updated",
    ],
  },
  {
    id: "alert-007",
    title: "OTP Theft Prevention Alert",
    description: "Recent surge in social engineering attacks targeting OTP codes",
    severity: "medium" as const,
    type: "Social Engineering",
    targetAudience: "All Users",
    reportedCases: 6234,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    preventionTips: [
      "Never share your OTP with anyone",
      "Banks never ask for OTP in calls or emails",
      "Use OTP only for intended transactions",
      "Report if OTP is received unexpectedly",
    ],
  },
];

export const handleGetLiveAlerts: RequestHandler = (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const paginatedAlerts = alerts.slice(
      offset,
      Math.min(offset + limit, alerts.length)
    );

    const response: LiveAlertsResponse = {
      data: paginatedAlerts,
      total: alerts.length,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch live alerts" });
  }
};

export const handleGetAlertById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const alert = alerts.find((a) => a.id === id);

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch alert" });
  }
};

export const handleGetAlertsByType: RequestHandler = (req, res) => {
  try {
    const { type } = req.params;
    const filteredAlerts = alerts.filter((a) => a.type === type);

    res.json({
      data: filteredAlerts,
      total: filteredAlerts.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch alerts by type" });
  }
};
