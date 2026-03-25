import os
import time
import uuid
import jwt
from collections import Counter
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.genai as genai
from google.genai import types as genai_types

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "cyber-rakshak-super-secret-key-21")
ADMIN_USERNAME = "CyberRakshak_21"
ADMIN_PASSWORD = "CyberRakshak@1234"
GEMINI_API_KEY = os.environ.get("GOOGLE_GENAI_API_KEY", "")

client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

# --- MOCK DATABASES ---

# 1. Cybercrime Types
CRIME_TYPES = [
    {
        "id": "phishing",
        "name": "Phishing Scams",
        "emoji": "🎣",
        "description": "Fraudulent attempts to trick you into revealing sensitive information by impersonating trusted entities",
        "examples": [
            "Fake banking emails requesting password verification",
            "Social media messages claiming your account is compromised",
            "Emails pretending to be from PayPal asking to confirm payment"
        ],
        "signs": [
            "Urgent language requesting immediate action",
            "Generic greetings instead of your name",
            "Links that don't match the company domain",
            "Requests for personal or financial information",
            "Poor spelling and grammar"
        ],
        "prevention": [
            "Never click links in unexpected emails",
            "Verify sender email addresses carefully",
            "Go directly to websites by typing the URL",
            "Check for HTTPS and padlock icon",
            "Enable two-factor authentication"
        ],
        "tips": [
            {"id": "1", "title": "Hover Over Links", "description": "Hover over links to see the actual URL before clicking", "emoji": "🖱️"},
            {"id": "2", "title": "Check Email Headers", "description": "Look at the full email header to verify the sender", "emoji": "📋"},
            {"id": "3", "title": "Use Email Filters", "description": "Enable spam filters and create rules for suspicious emails", "emoji": "🔍"}
        ]
    },
    {
        "id": "ransomware",
        "name": "Ransomware Attacks",
        "emoji": "🔒",
        "description": "Malicious software that encrypts your files and demands payment for decryption",
        "examples": [
            "Malware downloaded from suspicious websites",
            "Email attachments that contain encrypted threats",
            "Compromised USB drives containing malicious code"
        ],
        "signs": [
            "Files become inaccessible or corrupted",
            "Strange file extensions on your documents",
            "Popup messages demanding payment",
            "System performance slows down dramatically"
        ],
        "prevention": [
            "Keep software and OS updated",
            "Use reliable antivirus software",
            "Backup important files regularly",
            "Be cautious with email attachments"
        ],
        "tips": [
            {"id": "1", "title": "Regular Backups", "description": "Maintain offline backups of critical data", "emoji": "💾"},
            {"id": "2", "title": "Update Patches", "description": "Install security patches as soon as they're available", "emoji": "🔧"},
            {"id": "3", "title": "Network Segmentation", "description": "Separate critical systems from public networks", "emoji": "🔗"}
        ]
    },
    {
        "id": "identity-theft",
        "name": "Identity Theft",
        "emoji": "👤",
        "description": "Unauthorized use of your personal information to commit fraud",
        "examples": [
            "Opening credit cards in your name",
            "Taking out loans using your identity",
            "Filing fraudulent tax returns"
        ],
        "signs": [
            "Credit card statements for accounts you didn't open",
            "Suspicious activity on your credit report",
            "Missing mail or reception of unknown statements"
        ],
        "prevention": [
            "Monitor your credit reports regularly",
            "Use strong, unique passwords",
            "Shred sensitive documents"
        ],
        "tips": [
            {"id": "1", "title": "Credit Freeze", "description": "Freeze your credit with major bureaus", "emoji": "❄️"},
            {"id": "2", "title": "Identity Theft Protection", "description": "Consider protection services", "emoji": "🛡️"}
        ]
    },
    {
        "id": "upi-fraud",
        "name": "UPI Fraud",
        "emoji": "📱",
        "description": "Fraudulent transactions using Unified Payments Interface in India",
        "examples": [
            "QR code scams where the incorrect amount is transferred",
            "Fake UPI apps that steal bank details",
            "SMS-based scams requesting UPI approval"
        ],
        "signs": [
            "Requests to share your UPI ID or PIN",
            "Unexpected UPI transaction requests",
            "Pop-ups asking for UPI credentials"
        ],
        "prevention": [
            "Never share your UPI PIN or OTP",
            "Download apps only from official stores",
            "Verify recipient details before sending money"
        ],
        "tips": [
            {"id": "1", "title": "Verify QR Codes", "description": "Always verify QR codes before scanning", "emoji": "📲"},
            {"id": "2", "title": "Use UPI Lite", "description": "Use UPI Lite for smaller transactions", "emoji": "💰"}
        ]
    },
    {
        "id": "deepfake",
        "name": "Deepfake Scams",
        "emoji": "🎭",
        "description": "AI-generated videos or audio impersonating trusted individuals",
        "examples": [
            "Video calls claiming to be family members asking for money",
            "Fake videos of executives requesting fund transfers"
        ],
        "signs": [
            "Unnatural blinking or lip movements",
            "Poor audio quality or lip-sync issues",
            "Unusual requests from known contacts"
        ],
        "prevention": [
            "Verify requests through alternative channels",
            "Ask security questions only known to them",
            "Be skeptical of video calls requesting money"
        ],
        "tips": [
            {"id": "1", "title": "Verification Call", "description": "Call the person back using a trusted number", "emoji": "☎️"},
            {"id": "2", "title": "Spot Artifacts", "description": "Look for visual artifacts in videos", "emoji": "👀"}
        ]
    }
]

# 2. Live Alerts
LIVE_ALERTS = [
    {
        "id": "alert-001",
        "title": "Fake ICICI Bank App Warning",
        "description": "Multiple reports of fake ICICI Bank app on Google Play Store that steals banking credentials",
        "severity": "critical",
        "type": "Phishing",
        "targetAudience": "ICICI Bank Users",
        "reportedCases": 1247,
        "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
        "preventionTips": ["Only download from official stores", "Verify app developer is ICICI Bank Ltd", "Check blue verification badge"]
    },
    {
        "id": "alert-002",
        "title": "Amazon Gift Card Scam Surge",
        "description": "Spike in SMS scams asking users to confirm purchases with gift cards",
        "severity": "high",
        "type": "SMS Fraud",
        "targetAudience": "All Amazon Users",
        "reportedCases": 3892,
        "timestamp": (datetime.now() - timedelta(hours=4)).isoformat(),
        "preventionTips": ["Amazon never asks for gift cards as payment", "Never click links in unsolicited SMS", "Log in directly to Amazon"]
    },
    {
        "id": "alert-003",
        "title": "Cryptocurrency Exchange Hack",
        "description": "Major cryptocurrency exchange experiencing suspicious withdrawal activity",
        "severity": "critical",
        "type": "Account Compromise",
        "targetAudience": "Crypto Investors",
        "reportedCases": 5621,
        "timestamp": (datetime.now() - timedelta(hours=6)).isoformat(),
        "preventionTips": ["Enable 2FA", "Use hardware wallets", "Never share seed phrases"]
    },
    {
        "id": "alert-004",
        "title": "Tax Return Phishing Campaign",
        "description": "Income Tax Department impersonation emails asking for personal information",
        "severity": "high",
        "type": "Phishing",
        "targetAudience": "Taxpayers",
        "reportedCases": 2156,
        "timestamp": (datetime.now() - timedelta(hours=8)).isoformat(),
        "preventionTips": ["Verify sender carefully", "Visit official site directly", "Income Tax dept never asks passwords over email"]
    }
]

# 3. Quiz Questions
QUIZ_QUESTIONS = [
    {
        "id": "q1",
        "question": "What is the most common way hackers steal passwords online?",
        "options": ["Phishing emails and fake websites", "Breaking into data centers", "Hacking your WiFi router", "Using a microscope"],
        "correctAnswer": 0,
        "explanation": "Phishing emails and fake websites are the most common methods used by hackers to trick users.",
        "difficulty": "easy",
        "category": "Phishing"
    },
    {
        "id": "q2",
        "question": "What does 2FA (Two-Factor Authentication) provide?",
        "options": ["A second email address", "Protection using something you know AND have", "Double storage space", "Two OS"],
        "correctAnswer": 1,
        "explanation": "2FA combines something you know (password) with something you have (phone/key).",
        "difficulty": "easy",
        "category": "Account Security"
    },
    {
        "id": "q3",
        "question": "What is a characteristic of a strong password?",
        "options": ["Birth year and pet name", "Simple word like password123", "12+ chars with mixed case, numbers, symbols", "Username twice"],
        "correctAnswer": 2,
        "explanation": "A strong password has 12+ chars with diverse characters.",
        "difficulty": "easy",
        "category": "Password Security"
    },
    {
        "id": "q5",
        "question": "What is ransomware?",
        "options": ["Free antivirus", "Malware that encrypts files and demands payment", "Backup service", "Password manager"],
        "correctAnswer": 1,
        "explanation": "Ransomware encrypts files and demands ransom for decryption.",
        "difficulty": "medium",
        "category": "Malware"
    },
    {
        "id": "q7",
        "question": "What is social engineering in cybersecurity?",
        "options": ["Building social networks", "Manipulating people into revealing confidential info", "Engineering social apps", "Studying behavior"],
        "correctAnswer": 1,
        "explanation": "Social engineering uses psychological manipulation to get sensitive info.",
        "difficulty": "medium",
        "category": "Social Engineering"
    },
    {
        "id": "q10",
        "question": "How should you respond if you suspect a deepfake video call?",
        "options": ["Send money immediately", "Verify via alternative channel with known contact", "Ignore it", "Ask for their password"],
        "correctAnswer": 1,
        "explanation": "Always verify unexpected calls requesting money through another trusted method.",
        "difficulty": "hard",
        "category": "Deepfake Scams"
    }
]

# 4. Safety Checklist
SAFETY_CHECKLIST = [
    {
        "id": "account-security",
        "category": "Account Security",
        "title": "Secure Your Online Accounts",
        "description": "Create strong passwords and enable two-factor authentication",
        "steps": ["Create 12+ char unique password", "Enable 2FA", "Use password manager", "Review recovery options", "Set activity alerts"],
        "priority": "high",
        "estimatedTime": "30 mins"
    },
    {
        "id": "device-security",
        "category": "Device Security",
        "title": "Secure Your Devices",
        "description": "Keep your devices updated and protected from malware",
        "steps": ["Enable auto-updates", "Install antivirus", "Turn on firewall", "Disable remote access", "Encrypt hard drive"],
        "priority": "high",
        "estimatedTime": "45 mins"
    },
    {
        "id": "upi-security",
        "category": "Financial Security",
        "title": "Secure UPI/Banking Transactions",
        "description": "Protect your financial apps and transaction PINs",
        "steps": ["Never share UPI PIN/OTP", "Verify merchant name before scanning QR", "Set transaction limits", "Enable screen lock for bank apps"],
        "priority": "high",
        "estimatedTime": "15 mins"
    }
]

# In-memory stores for dynamic data
scam_reports_store = []
ai_queries_store = []

REPORT_RECOMMENDATIONS = {
    "phishing": [
        "Change passwords for any account you entered on the suspicious site or message.",
        "Contact the affected bank or platform and ask them to secure the account immediately.",
        "Do not click follow-up links or reply to the scammer.",
    ],
    "upi fraud": [
        "Call your bank or payment provider immediately and report the unauthorized transaction.",
        "Block the compromised account or app session if available.",
        "Save transaction IDs, messages, and screenshots for investigation.",
    ],
    "identity theft": [
        "Reset passwords for email, banking, and social accounts first.",
        "Review recent account activity and lock compromised services.",
        "Collect proof of fake profiles, account changes, or fraudulent transactions.",
    ],
    "job scam": [
        "Stop further communication and do not pay additional fees.",
        "Keep the job post, email thread, payment proofs, and call details.",
        "Warn the platform where the fake listing appeared.",
    ],
    "sms fraud": [
        "Block the sender and avoid tapping any links from the message.",
        "Review bank, wallet, and email access for unusual activity.",
        "Report the SMS to your carrier or the relevant platform if possible.",
    ],
    "account compromise": [
        "Reset the password immediately and sign out of other active sessions.",
        "Enable two-factor authentication before reusing the account.",
        "Check recovery email, phone number, and linked devices for tampering.",
    ],
}

COMMON_CONTACTS = {
    "bank": "Use the official support number listed in your banking app or on your card.",
    "platform": "Use the verified support page of the affected app, marketplace, or social platform.",
    "cybercrime": "Report the incident through your local cybercrime reporting channel or police cyber cell.",
}

# --- HELPERS ---

def generate_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def latest_reports(limit=None):
    reports = sorted(
        scam_reports_store,
        key=lambda report: report.get("timestamp", ""),
        reverse=True
    )
    if limit is None:
        return reports
    return reports[:limit]


def normalize_report_payload(payload):
    cleaned = {}
    for key, value in payload.items():
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
            if not value:
                continue
        cleaned[key] = value
    return cleaned


def get_report(report_id):
    return next((report for report in scam_reports_store if report["id"] == report_id), None)


def report_status_counts():
    return dict(Counter(
        report.get("moderationStatus") or report.get("status", "pending")
        for report in scam_reports_store
    ))


def report_type_counts():
    return dict(Counter(
        report.get("type", "Unknown")
        for report in scam_reports_store
        if report.get("type")
    ))


def recommendation_bundle(report_type):
    normalized_type = (report_type or "").strip().lower()
    recommendations = REPORT_RECOMMENDATIONS.get(
        normalized_type,
        [
            "Stop contact with the scammer and preserve every available proof.",
            "Secure the impacted account, card, or device before using it again.",
            "Report the incident to the affected provider and your local cybercrime authority.",
        ],
    )
    return {
        "type": report_type or "General Scam",
        "recommendations": recommendations,
        "contactNumbers": COMMON_CONTACTS,
    }

def authenticate_token():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        return None

# --- API ROUTES ---

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"})

@app.route("/api/cybercrime-types", methods=["GET"])
def get_crime_types():
    return jsonify({"data": CRIME_TYPES})

@app.route("/api/cybercrime-types/<string:crime_id>", methods=["GET"])
def get_crime_type(crime_id):
    item = next((ct for ct in CRIME_TYPES if ct["id"] == crime_id), None)
    if not item:
        return jsonify({"error": "Not found"}), 404
    return jsonify(item)

@app.route("/api/live-alerts", methods=["GET"])
def get_alerts():
    return jsonify({"data": LIVE_ALERTS, "total": len(LIVE_ALERTS)})

@app.route("/api/live-alerts/<string:alert_id>", methods=["GET"])
def get_alert(alert_id):
    item = next((a for a in LIVE_ALERTS if a["id"] == alert_id), None)
    if not item:
        return jsonify({"error": "Not found"}), 404
    return jsonify(item)

@app.route("/api/safety-checklist", methods=["GET"])
def get_checklist():
    return jsonify({"data": SAFETY_CHECKLIST})

@app.route("/api/quiz/questions", methods=["GET"])
def get_quiz():
    import random
    questions = list(QUIZ_QUESTIONS)
    random.shuffle(questions)
    return jsonify({"data": questions})

@app.route("/api/scam-report", methods=["POST"])
def submit_report():
    data = request.get_json(force=True, silent=True) or {}
    report_id = generate_id("REPORT")
    cleaned_data = normalize_report_payload(data)
    report = {
        "id": report_id,
        "timestamp": datetime.now().isoformat(),
        "status": "pending",
        "moderationStatus": "pending",
        "authenticity": "unverified",
        "moderatorNote": "",
        "userId": cleaned_data.get("userId", "anonymous"),
        **cleaned_data
    }
    scam_reports_store.append(report)
    return jsonify({"success": True, "reportId": report_id, "message": f"Report recorded: {report_id}"}), 201


@app.route("/api/scam-report/<string:report_id>", methods=["GET"])
def get_report_status(report_id):
    report = get_report(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    return jsonify({
        "reportId": report["id"],
        "status": report.get("moderationStatus") or report.get("status", "pending"),
        "submittedDate": report["timestamp"],
        "description": report.get("description", ""),
        "type": report.get("type", "Unknown"),
    })


@app.route("/api/scam-report-stats", methods=["GET"])
def get_report_stats():
    return jsonify({
        "total": len(scam_reports_store),
        "byType": report_type_counts(),
    })


@app.route("/api/scam-recommendations", methods=["GET"])
def get_scam_recommendations():
    report_type = request.args.get("type", "")
    return jsonify(recommendation_bundle(report_type))


@app.route("/api/recent-reports", methods=["GET"])
def get_recent_reports():
    return jsonify({"data": latest_reports(limit=10)})

# AI CHAT — Gemini 1.5 Flash
@app.route("/api/ai-assistant/chat", methods=["POST"])
def ai_chat():
    data = request.get_json(force=True, silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    lang = data.get("language", "en")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    reply = ""
    if client:
        try:
            system_instruction = (
                "You are CyberRakshak, an expert AI assistant specialising in cybersecurity, "
                "cybercrime prevention, digital safety, and online fraud awareness. "
                "Answer every question thoroughly yet concisely. "
                "Respond in flowing paragraphs — DO NOT use bullet points, numbered lists, or markdown bold/italic formatting. "
                f"Always reply in {'Hindi' if lang == 'hi' else 'English'}."
            )
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                )
            )
            raw = response.text or ""
            # Strip markdown formatting artifacts
            reply = (
                raw.replace("**", "")
                   .replace("* ", "")
                   .replace("- ", "")
                   .replace("\n\n", " ")
                   .replace("\n", " ")
                   .strip()
            )
        except Exception as e:
            print(f"[Gemini Error] {e}")
            reply = (
                "I'm having trouble connecting to my AI core right now. "
                "Please ensure you have a stable internet connection and try again."
            )
    else:
        reply = (
            "The AI service is not configured. "
            "For now, remember: always use strong unique passwords, enable two-factor authentication, "
            "and never share your OTP or UPI PIN with anyone."
        )

    ai_queries_store.insert(0, {
        "id": generate_id("aiq"),
        "prompt": prompt,
        "reply": reply,
        "language": lang,
        "timestamp": datetime.now().isoformat()
    })
    return jsonify({"reply": reply})

# Admin Login
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json(force=True, silent=True) or {}
    if data.get("username") == ADMIN_USERNAME and data.get("password") == ADMIN_PASSWORD:
        token = jwt.encode(
            {"user": ADMIN_USERNAME, "exp": datetime.utcnow() + timedelta(hours=24)},
            JWT_SECRET,
            algorithm="HS256"
        )
        return jsonify({"success": True, "token": token})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route("/api/admin/session", methods=["GET"])
def admin_session():
    user = authenticate_token()
    if user:
        return jsonify({"authenticated": True, "active": True, "user": user})
    return jsonify({"authenticated": False}), 401


@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    if not authenticate_token():
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"success": True})

@app.route("/api/admin/dashboard", methods=["GET"])
def admin_dashboard():
    if not authenticate_token():
        return jsonify({"error": "Unauthorized"}), 401
    type_counts = report_type_counts()
    status_counts = report_status_counts()
    return jsonify({
        "metrics": {
            "totalScamReports": len(scam_reports_store),
            "pendingReports": status_counts.get("pending", 0),
            "reviewedReports": len(scam_reports_store) - status_counts.get("pending", 0),
            "aiQueries": len(ai_queries_store),
            "activeAlerts": len(LIVE_ALERTS)
        },
        "reportStatusCounts": status_counts,
        "commonScamTypes": [
            {"type": scam_type, "count": count}
            for scam_type, count in sorted(type_counts.items(), key=lambda item: item[1], reverse=True)
        ],
        "recentReports": latest_reports(limit=10),
        "recentAiQueries": ai_queries_store[:10]
    })


@app.route("/api/admin/reports", methods=["GET"])
def admin_reports():
    if not authenticate_token():
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": latest_reports()})


@app.route("/api/admin/reports/<string:report_id>", methods=["PATCH"])
def admin_update_report(report_id):
    if not authenticate_token():
        return jsonify({"error": "Unauthorized"}), 401

    report = get_report(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    data = request.get_json(force=True, silent=True) or {}
    allowed_statuses = {"pending", "approved", "rejected", "investigating"}
    allowed_authenticity = {"unverified", "verified", "suspected-fake"}

    moderation_status = data.get("moderationStatus")
    authenticity = data.get("authenticity")
    moderator_note = data.get("moderatorNote")

    if moderation_status is not None:
        if moderation_status not in allowed_statuses:
            return jsonify({"error": "Invalid moderation status"}), 400
        report["moderationStatus"] = moderation_status
        report["status"] = moderation_status

    if authenticity is not None:
        if authenticity not in allowed_authenticity:
            return jsonify({"error": "Invalid authenticity value"}), 400
        report["authenticity"] = authenticity

    if moderator_note is not None:
        report["moderatorNote"] = str(moderator_note).strip()

    return jsonify({"success": True, "data": report})

# Error Handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not Found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method Not Allowed"}), 405

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
