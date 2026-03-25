import os
import time
import uuid
import jwt
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "cyber-rakshak-super-secret-key-21")
ADMIN_USERNAME = "CyberRakshak_21"
ADMIN_PASSWORD = "CyberRakshak@1234"
GEMINI_API_KEY = os.environ.get("GOOGLE_GENAI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# --- MOCK DATABASES ---

# 1. Cybercrime Types (Restored from Node)
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
            "QR code scams donde el monto incorrecto se transfiere",
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

# 2. Live Alerts (Restored from Node)
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

# 3. Quiz Questions (Restored from Node)
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

# 4. Safety Checklist (Restored from Node)
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
quiz_attempts_store = []

# --- HELPERS ---

def generate_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

def authenticate_token():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except:
        return None

# --- API ROUTES ---

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"message": "pong"})

@app.route("/api/cybercrime-types", methods=["GET"])
def get_crime_types():
    return jsonify({"data": CRIME_TYPES})

@app.route("/api/cybercrime-types/<id>", methods=["GET"])
def get_crime_type(id):
    item = next((ct for ct in CRIME_TYPES if ct["id"] == id), None)
    if not item: return jsonify({"error": "Not found"}), 404
    return jsonify(item)

@app.route("/api/live-alerts", methods=["GET"])
def get_alerts():
    return jsonify({"data": LIVE_ALERTS, "total": len(LIVE_ALERTS)})

@app.route("/api/live-alerts/<id>", methods=["GET"])
def get_alert(id):
    item = next((a for a in LIVE_ALERTS if a["id"] == id), None)
    if not item: return jsonify({"error": "Not found"}), 404
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
    data = request.json or {}
    report_id = generate_id("REPORT")
    report = {
        "id": report_id,
        "timestamp": datetime.now().isoformat(),
        "status": "pending",
        **data
    }
    scam_reports_store.append(report)
    return jsonify({"success": True, "reportId": report_id, "message": f"Reported recorded: {report_id}"}), 201

# AI CHAT - Using Gemini with paragraph format
@app.route("/api/ai-assistant/chat", methods=["POST"])
def ai_chat():
    data = request.json or {}
    prompt = data.get("prompt", "").strip()
    lang = data.get("language", "en")
    
    if not prompt:
        return jsonify({"error": "Prompt required"}), 400

    reply = ""
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            sys_instruct = (
                "You are CyberRakshak, a global cybersecurity expert assistant. Answer any questions related to "
                "cybercrime or digital safety. IMPORTANT: Answer in a SINGLE, FLOWING PARAGRAPH. DO NOT use bullets, "
                "lists, or bold formatting for lists. Be professional and direct. "
                f"Reply in {'Hindi' if lang == 'hi' else 'English'}."
            )
            response = model.generate_content(f"{sys_instruct}\n\nUser Question: {prompt}")
            reply = response.text.replace("\n", " ").replace("*", "").replace("- ", "").strip()
        except Exception as e:
            print(f"Gemini Error: {e}")
            reply = "I encountered an error connecting to my AI core. Please try again or check your safety settings."
    else:
        # Fallback local logic
        reply = "Gemini AI is not configured. Please stay safe by using strong passwords and 2FA."

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
    data = request.json or {}
    if data.get("username") == ADMIN_USERNAME and data.get("password") == ADMIN_PASSWORD:
        token = jwt.encode({
            "user": ADMIN_USERNAME,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }, JWT_SECRET, algorithm="HS256")
        return jsonify({"success": True, "token": token})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route("/api/admin/session", methods=["GET"])
def admin_session():
    user = authenticate_token()
    if user: return jsonify({"authenticated": True, "user": user})
    return jsonify({"authenticated": False}), 401

@app.route("/api/admin/dashboard", methods=["GET"])
def admin_dashboard():
    if not authenticate_token(): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({
        "stats": {
            "totalReports": len(scam_reports_store),
            "totalAiQueries": len(ai_queries_store),
            "activeAlerts": len(LIVE_ALERTS)
        }
    })

# Error Handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not Found"}), 404

def handler(req, res):
    return app(req, res)

if __name__ == "__main__":
    app.run(port=8080)
