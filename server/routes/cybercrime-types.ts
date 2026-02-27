import { RequestHandler } from "express";
import { CrimeTypesResponse } from "@shared/api";

// Mock database
const crimeTypes = [
  {
    id: "phishing",
    name: "Phishing Scams",
    emoji: "🎣",
    description:
      "Fraudulent attempts to trick you into revealing sensitive information by impersonating trusted entities",
    examples: [
      "Fake banking emails requesting password verification",
      "Social media messages claiming your account is compromised",
      "Emails pretending to be from PayPal asking to confirm payment",
    ],
    signs: [
      "Urgent language requesting immediate action",
      "Generic greetings instead of your name",
      "Links that don't match the company domain",
      "Requests for personal or financial information",
      "Poor spelling and grammar",
    ],
    prevention: [
      "Never click links in unexpected emails",
      "Verify sender email addresses carefully",
      "Go directly to websites by typing the URL",
      "Check for HTTPS and padlock icon",
      "Enable two-factor authentication",
    ],
    tips: [
      {
        id: "1",
        title: "Hover Over Links",
        description:
          "Hover over links to see the actual URL before clicking",
        emoji: "🖱️",
      },
      {
        id: "2",
        title: "Check Email Headers",
        description: "Look at the full email header to verify the sender",
        emoji: "📋",
      },
      {
        id: "3",
        title: "Use Email Filters",
        description:
          "Enable spam filters and create rules for suspicious emails",
        emoji: "🔍",
      },
    ],
  },
  {
    id: "ransomware",
    name: "Ransomware Attacks",
    emoji: "🔒",
    description:
      "Malicious software that encrypts your files and demands payment for decryption",
    examples: [
      "Malware downloaded from suspicious websites",
      "Email attachments that contain encrypted threats",
      "Compromised USB drives containing malicious code",
    ],
    signs: [
      "Files become inaccessible or corrupted",
      "Strange file extensions on your documents",
      "Popup messages demanding payment",
      "System performance slows down dramatically",
      "Files are replaced with encrypted versions",
    ],
    prevention: [
      "Keep software and OS updated",
      "Use reliable antivirus software",
      "Backup important files regularly",
      "Be cautious with email attachments",
      "Don't download files from untrusted sources",
    ],
    tips: [
      {
        id: "1",
        title: "Regular Backups",
        description: "Maintain offline backups of critical data",
        emoji: "💾",
      },
      {
        id: "2",
        title: "Update Patches",
        description: "Install security patches as soon as they're available",
        emoji: "🔧",
      },
      {
        id: "3",
        title: "Network Segmentation",
        description: "Separate critical systems from public networks",
        emoji: "🔗",
      },
    ],
  },
  {
    id: "identity-theft",
    name: "Identity Theft",
    emoji: "👤",
    description:
      "Unauthorized use of your personal information to commit fraud",
    examples: [
      "Opening credit cards in your name",
      "Taking out loans using your identity",
      "Filing fraudulent tax returns",
      "Opening bank accounts illegally",
    ],
    signs: [
      "Credit card statements for accounts you didn't open",
      "Bills for services you never signed up for",
      "Calls from debt collectors about unknown debts",
      "Suspicious activity on your credit report",
      "Missing mail or receiving statements from unknown accounts",
    ],
    prevention: [
      "Monitor your credit reports regularly",
      "Use strong, unique passwords",
      "Shred sensitive documents",
      "Don't share SSN unnecessarily",
      "Check bank and credit statements monthly",
    ],
    tips: [
      {
        id: "1",
        title: "Credit Freeze",
        description: "Freeze your credit with major bureaus",
        emoji: "❄️",
      },
      {
        id: "2",
        title: "Identity Theft Protection",
        description: "Consider identity theft protection services",
        emoji: "🛡️",
      },
      {
        id: "3",
        title: "Dark Web Monitoring",
        description: "Monitor the dark web for your information",
        emoji: "🌐",
      },
    ],
  },
  {
    id: "upi-fraud",
    name: "UPI Fraud",
    emoji: "📱",
    description:
      "Fraudulent transactions using Unified Payments Interface in India",
    examples: [
      "QR code scams where wrong amount is transferred",
      "Fake UPI apps that steal bank details",
      "SMS-based scams requesting UPI approval",
      "Screen share fraud where attackers initiate false transactions",
    ],
    signs: [
      "Requests to share your UPI ID",
      "Unexpected UPI transaction requests",
      "Pop-ups asking for UPI credentials",
      "SMS messages with UPI links from unknown sources",
      "Screens showing wrong transaction amounts",
    ],
    prevention: [
      "Never share your UPI PIN or OTP",
      "Download apps only from official stores",
      "Verify recipient details before sending money",
      "Use transaction limits on your UPI",
      "Enable biometric authentication",
    ],
    tips: [
      {
        id: "1",
        title: "Verify QR Codes",
        description: "Always verify QR codes before scanning",
        emoji: "📲",
      },
      {
        id: "2",
        title: "Use UPI Lite",
        description: "Use UPI Lite for smaller transactions",
        emoji: "💰",
      },
      {
        id: "3",
        title: "Merchant Verification",
        description: "Verify merchant details in the app",
        emoji: "✓",
      },
    ],
  },
  {
    id: "deepfake",
    name: "Deepfake Scams",
    emoji: "🎭",
    description:
      "AI-generated videos or audio impersonating trusted individuals",
    examples: [
      "Video calls claiming to be family members asking for money",
      "Fake videos of executives requesting fund transfers",
      "Audio messages impersonating bosses requesting urgent actions",
      "Deepfake celebrity endorsement videos for fake products",
    ],
    signs: [
      "Unnatural blinking or lip movements",
      "Poor audio quality or lip-sync issues",
      "Unusual requests from known contacts",
      "Pressure to act urgently",
      "Requests made outside normal communication channels",
    ],
    prevention: [
      "Verify requests through alternative channels",
      "Ask security questions only known to them",
      "Be skeptical of video calls requesting money",
      "Use official communication channels",
      "Report suspicious content immediately",
    ],
    tips: [
      {
        id: "1",
        title: "Verification Call",
        description: "Call the person back using a trusted number",
        emoji: "☎️",
      },
      {
        id: "2",
        title: "Spot Artifacts",
        description: "Look for visual artifacts in videos",
        emoji: "👀",
      },
      {
        id: "3",
        title: "Report Deepfakes",
        description: "Report suspicious content to platforms",
        emoji: "🚨",
      },
    ],
  },
];

export const handleGetCrimeTypes: RequestHandler = (req, res) => {
  try {
    const response: CrimeTypesResponse = {
      data: crimeTypes,
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch crime types" });
  }
};

export const handleGetCrimeTypeById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const crimeType = crimeTypes.find((ct) => ct.id === id);

    if (!crimeType) {
      return res.status(404).json({ error: "Crime type not found" });
    }

    res.json(crimeType);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch crime type" });
  }
};
