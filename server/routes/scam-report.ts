import { RequestHandler } from "express";
import { ScamReportInput, ScamReportResponse } from "@shared/api";

// Mock database to store reports
const reports: (ScamReportInput & { id: string; timestamp: string })[] = [];

// Generate unique report ID
function generateReportId(): string {
  return `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// In-memory cache of stats
let reportStats = {
  total: 0,
  byType: {} as Record<string, number>,
  byMonth: {} as Record<string, number>,
};

export const handleSubmitScamReport: RequestHandler = (req, res) => {
  try {
    const {
      type,
      description,
      amount,
      url,
      email,
      phoneNumber,
      incidentDate,
      reportedTo,
    } = req.body as ScamReportInput;

    // Validation
    if (!type || !description || !incidentDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing required fields: type, description, incidentDate",
        });
    }

    const reportId = generateReportId();
    const timestamp = new Date().toISOString();

    const report = {
      id: reportId,
      type,
      description,
      amount,
      url,
      email,
      phoneNumber,
      incidentDate,
      reportedTo,
      timestamp,
    };

    reports.push(report);

    // Update stats
    reportStats.total++;
    reportStats.byType[type] = (reportStats.byType[type] || 0) + 1;

    const month = new Date(timestamp).toISOString().substring(0, 7);
    reportStats.byMonth[month] = (reportStats.byMonth[month] || 0) + 1;

    const response: ScamReportResponse = {
      success: true,
      reportId,
      message: `Your report has been recorded with ID: ${reportId}. Thank you for helping keep the community safe!`,
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit report",
    });
  }
};

export const handleGetReportStatus: RequestHandler = (req, res) => {
  try {
    const { reportId } = req.params;

    const report = reports.find((r) => r.id === reportId);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({
      reportId: report.id,
      status: "Under Review",
      submittedDate: report.timestamp,
      description: report.description,
      type: report.type,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report status" });
  }
};

export const handleGetReportStats: RequestHandler = (req, res) => {
  try {
    res.json({
      total: reportStats.total,
      byType: reportStats.byType,
      byMonth: reportStats.byMonth,
      averagePerMonth: Math.round(
        reportStats.total / Object.keys(reportStats.byMonth).length || 0
      ),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report statistics" });
  }
};

export const handleGetRecommendations: RequestHandler = (req, res) => {
  try {
    const { type } = req.query;

    const recommendations: Record<string, string[]> = {
      Phishing: [
        "Change your passwords immediately",
        "Enable two-factor authentication",
        "Monitor your accounts for suspicious activity",
        "Consider placing a fraud alert with credit bureaus",
        "Report the phishing page to the legitimate company",
      ],
      "UPI Fraud": [
        "Contact your bank immediately",
        "Request transaction reversal",
        "File an FIR with local police",
        "Monitor your account for further unauthorized transactions",
        "Consider blocking UPI access temporarily",
      ],
      "Identity Theft": [
        "Place a credit freeze with all three bureaus",
        "Monitor credit reports regularly",
        "File a report with the FTC",
        "Check all accounts for unauthorized activity",
        "Consider identity theft protection service",
      ],
      "Job Scam": [
        "Do not send any money or personal documents",
        "Report the job posting to the job board",
        "Report to local authorities if payment was made",
        "Monitor your email for further contact",
        "Be cautious of similar offers in the future",
      ],
      "SMS Fraud": [
        "Do not click any links in suspicious messages",
        "Block the sender's number",
        "Report the number to your telecom provider",
        "Forward suspicious SMS to short code 7726 (SPAM)",
        "Monitor your account statements",
      ],
      "Account Compromise": [
        "Change password immediately",
        "Review account activity",
        "Check connected apps and revoke access",
        "Update recovery information",
        "Enable login notifications",
      ],
    };

    const selectedRecommendations =
      recommendations[type as string] || recommendations["Phishing"];

    res.json({
      type: type || "Phishing",
      recommendations: selectedRecommendations,
      contactNumbers: {
        cybercrime:
          "1930 (Cybercrime Complaint for Rajasthan)",
        rbi: "1800-11-5525 (RBI Cyber Fraud Helpline)",
        ftc: "reportfraud.ftc.gov (US Federal Trade Commission)",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};

export const handleGetRecentReports: RequestHandler = (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    // Return stats summary (not actual reports for privacy)
    const summary = {
      totalReports: reportStats.total,
      commonTypes: Object.entries(reportStats.byType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      recentTrends: "Phishing and SMS fraud remain the most reported scams",
      lastUpdated: new Date().toISOString(),
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent reports" });
  }
};
