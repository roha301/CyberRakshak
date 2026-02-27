import { RequestHandler } from "express";
import { ChecklistResponse } from "@shared/api";

// Mock database
const checklistItems = [
  {
    id: "account-security",
    category: "Account Security",
    title: "Secure Your Online Accounts",
    description: "Create strong passwords and enable two-factor authentication",
    steps: [
      "Create a unique password with 12+ characters including uppercase, lowercase, numbers, and symbols",
      "Enable two-factor authentication (2FA) on all important accounts",
      "Use a password manager to store credentials securely",
      "Review and update recovery options (email, phone number)",
      "Set up account activity alerts",
    ],
    priority: "high" as const,
    estimatedTime: "30 minutes",
  },
  {
    id: "device-security",
    category: "Device Security",
    title: "Secure Your Devices",
    description: "Keep your devices updated and protected from malware",
    steps: [
      "Enable automatic updates for your operating system",
      "Install reputable antivirus and anti-malware software",
      "Turn on firewall protection",
      "Disable remote access features if not needed",
      "Encrypt your hard drive with BitLocker or FileVault",
    ],
    priority: "high" as const,
    estimatedTime: "45 minutes",
  },
  {
    id: "email-security",
    category: "Email Security",
    title: "Protect Your Email Account",
    description: "Secure your primary email as it controls password recovery",
    steps: [
      "Create a strong, unique password for your email account",
      "Enable two-factor authentication",
      "Review connected applications and remove unknown ones",
      "Check forwarding rules for suspicious addresses",
      "Set up recovery phone number and alternate email",
    ],
    priority: "high" as const,
    estimatedTime: "20 minutes",
  },
  {
    id: "browser-security",
    category: "Browser Security",
    title: "Secure Your Browser",
    description: "Configure browser security settings for safer browsing",
    steps: [
      "Keep your browser updated to the latest version",
      "Enable pop-up blocking and advertising blockers",
      "Clear cookies and cache regularly",
      "Disable third-party cookies",
      "Install security extensions like HTTPS Everywhere",
    ],
    priority: "medium" as const,
    estimatedTime: "15 minutes",
  },
  {
    id: "wifi-security",
    category: "Network Security",
    title: "Secure Your WiFi Network",
    description: "Protect your home network from unauthorized access",
    steps: [
      "Change the default router password",
      "Use WPA3 encryption (or WPA2 if not available)",
      "Hide your SSID broadcast (optional)",
      "Enable router firewall",
      "Disable WPS (WiFi Protected Setup)",
    ],
    priority: "high" as const,
    estimatedTime: "25 minutes",
  },
  {
    id: "social-media-security",
    category: "Social Media",
    title: "Secure Social Media Accounts",
    description: "Control privacy settings and prevent unauthorized access",
    steps: [
      "Set profile to private on all social media platforms",
      "Enable login alerts and require approval for new locations",
      "Review and remove connected apps",
      "Don't share sensitive information publicly",
      "Limit who can contact you and see your posts",
    ],
    priority: "medium" as const,
    estimatedTime: "30 minutes",
  },
  {
    id: "financial-security",
    category: "Financial Security",
    title: "Secure Your Financial Accounts",
    description: "Protect your banking and payment information",
    steps: [
      "Enable fraud alerts with your bank",
      "Use virtual card numbers for online purchases",
      "Set up transaction limits on your accounts",
      "Monitor statements weekly for unauthorized transactions",
      "Register for credit monitoring services",
    ],
    priority: "high" as const,
    estimatedTime: "35 minutes",
  },
  {
    id: "backup-strategy",
    category: "Data Protection",
    title: "Create Regular Backups",
    description: "Protect your data against loss and ransomware",
    steps: [
      "Identify critical files and documents to back up",
      "Use cloud services like Google Drive or OneDrive",
      "Create external hard drive backups monthly",
      "Test your backups regularly",
      "Keep offline copies of sensitive documents",
    ],
    priority: "high" as const,
    estimatedTime: "30 minutes",
  },
  {
    id: "phishing-awareness",
    category: "Awareness Training",
    title: "Learn to Identify Phishing",
    description: "Recognize and avoid phishing scams",
    steps: [
      "Hover over links to see the actual URL",
      "Check sender email addresses carefully",
      "Look for urgency language in emails",
      "Verify requests through alternative channels",
      "Report suspicious emails to your provider",
    ],
    priority: "medium" as const,
    estimatedTime: "20 minutes",
  },
  {
    id: "regular-audits",
    category: "Ongoing Maintenance",
    title: "Perform Regular Security Audits",
    description: "Maintain security by checking your accounts regularly",
    steps: [
      "Review login activity on important accounts monthly",
      "Check for unauthorized connected apps",
      "Update security questions and answers",
      "Remove old email accounts no longer in use",
      "Review permission settings on apps",
    ],
    priority: "medium" as const,
    estimatedTime: "45 minutes",
  },
];

export const handleGetChecklist: RequestHandler = (req, res) => {
  try {
    const { category, priority } = req.query;

    let filtered = [...checklistItems];

    if (category && typeof category === "string") {
      filtered = filtered.filter((item) =>
        item.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (priority && typeof priority === "string") {
      filtered = filtered.filter((item) => item.priority === priority);
    }

    const response: ChecklistResponse = {
      data: filtered,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
};

export const handleGetChecklistItemById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const item = checklistItems.find((item) => item.id === id);

    if (!item) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch checklist item" });
  }
};

export const handleGetCategories: RequestHandler = (req, res) => {
  try {
    const categories = [...new Set(checklistItems.map((item) => item.category))];
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};
