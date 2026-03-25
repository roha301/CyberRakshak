import os
import time
import uuid
import jwt
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

JWT_SECRET = os.environ.get("JWT_SECRET", "cyberrakshak-default-secret-change-in-production")
ADMIN_USERNAME = "CyberRakshak_21"
ADMIN_PASSWORD = "CyberRakshak@1234"

scam_reports_store = []
live_alerts_store = [
    {"id": "alert-1", "title": "Active Phishing Campaign", "description": "Watch out for fake bank emails", "severity": "medium", "type": "phishing", "targetAudience": "all", "reportedCases": 15, "timestamp": "2026-03-25T12:00:00Z", "preventionTips": ["Don't click links"], "status": "open"}
]
articles_store = []
faq_store = [{"id": "faq-1", "question": "What is phishing?", "answer": "A common scam.", "updatedAt": "2026-03-25T12:00:00Z"}]
ai_queries_store = []
quiz_questions_store = []
sys_logs = []

def generate_id(prefix):
    return f"{prefix}-{int(time.time())}-{str(uuid.uuid4())[:6]}"

def verify_admin(req):
    auth = req.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
            return payload.get("username") == ADMIN_USERNAME
        except:
            pass
    return False

@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"message": os.environ.get("PING_MESSAGE", "ping")})

# -------- SCAM REPORT --------
@app.route("/api/scam-report", methods=["POST"])
def submit_scam_report():
    data = request.json or {}
    if not data.get("type") or not data.get("description"):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    report_id = generate_id("REPORT")
    report = {
        **data,
        "id": report_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "userId": request.remote_addr or "anonymous",
        "moderationStatus": "pending",
        "authenticity": "unverified"
    }
    scam_reports_store.insert(0, report)
    return jsonify({"success": True, "reportId": report_id, "message": "Report submitted successfully."}), 201

@app.route("/api/scam-report/<report_id>", methods=["GET"])
def get_report_status(report_id):
    report = next((r for r in scam_reports_store if r.get("id") == report_id), None)
    if report:
        return jsonify({
            "reportId": report["id"], 
            "status": report.get("moderationStatus", "pending"), 
            "type": report.get("type", ""), 
            "submittedDate": report.get("timestamp", ""),
            "description": report.get("description", ""),
            "authenticity": report.get("authenticity", "unverified")
        })
    return jsonify({"error": "Report not found"}), 404

@app.route("/api/scam-report-stats", methods=["GET"])
def report_stats():
    return jsonify({
        "total": len(scam_reports_store),
        "byType": {},
        "byMonth": {},
        "averagePerMonth": 0
    })

@app.route("/api/scam-recommendations", methods=["GET"])
def get_recommendations():
    return jsonify({
        "type": request.args.get("type", "Phishing"),
        "recommendations": ["Change your passwords immediately.", "Enable two-factor authentication (2FA).", "Report the incident to your bank."],
        "contactNumbers": {"cybercrime": "1930", "rbi": "1800-11-5525"}
    })

@app.route("/api/recent-reports", methods=["GET"])
def get_recent_reports():
    return jsonify({"totalReports": len(scam_reports_store), "commonTypes": [], "recentTrends": "Phishing is the most common.", "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ")})

# -------- AI ASSISTANT --------
CYBER_KEYWORDS = {
    "phishing": ["phish", "email", "fake link", "click", "suspicious link", "spam", "lottery"],
    "upi_fraud": ["upi", "qrcode", "qr", "gpay", "paytm", "phonepe", "money deducted", "bank fraud", "otp", "pin", "payment"],
    "ransomware": ["ransom", "encrypt", "files locked", "pay money to unlock", "decrypt", "extort"],
    "identity_theft": ["identity", "fake profile", "impersonat", "stolen ssn", "stolen pan", "stolen aadhar", "credit card"],
    "job_scam": ["job offer", "work from home scam", "telegram job", "whatsapp job", "send money for job", "part time scam", "recruiter", "investment"],
    "hacked": ["hack", "compromise", "lost access", "password changed", "unauthorized access", "facebook hacked", "instagram hacked", "account hack"],
    "cyberbullying": ["bully", "harass", "blackmail", "morph", "nude", "threat", "abuse", "extortion", "online abuse"],
    "malware": ["virus", "malware", "trojan", "slow computer", "antivirus", "popup", "spyware"],
    "deepfake": ["deepfake", "fake video", "ai voice", "voice clone", "ai video", "impersonation call"],
    "general_safety": ["safe", "secure", "protect", "prevent", "guard", "best practice", "advice"]
}

RESPONSES = {
    "en": {
        "phishing": "🎣 **Phishing Scams**:\n1. Never click on unknown links or download unexpected attachments.\n2. Always verify the sender's email address.\n3. Legitimate banks will never ask for your password or OTP.\n4. If you clicked a link, disconnect from the internet, run a malware scan, and change your passwords.",
        "upi_fraud": "📱 **UPI/Banking Fraud**:\n1. Never share your OTP or UPI PIN with anyone.\n2. You do NOT need to enter your UPI PIN to *receive* money.\n3. Always verify the merchant name before scanning a QR code.\n4. If scammed, immediately block your account and dial **1930** to report cyber fraud.",
        "ransomware": "🔒 **Ransomware**:\n1. Do not pay the ransom; there is no guarantee you will get your data back.\n2. Disconnect the infected device from your network immediately.\n3. Restore your files from an offline backup if available.\n4. Report the incident to your local cybercrime cell.",
        "identity_theft": "👤 **Identity Theft**:\n1. Freeze your credit reports immediately.\n2. Change passwords for all your online accounts.\n3. Notify your bank and credit card companies.\n4. File a police report and keep a copy for disputes.",
        "job_scam": "💼 **Job Scams**:\n1. Legitimate companies will NEVER ask you to pay money to get a job.\n2. Beware of unsolicited 'Work from Home' offers on WhatsApp or Telegram.\n3. Do not share your bank account details for 'salary drops' before signing official paperwork.",
        "hacked": "⚠️ **Account Hacked**:\n1. Try to reset your password using your recovery email or phone number.\n2. Log out of all active sessions in the account settings.\n3. Enable Two-Factor Authentication (2FA) immediately.\n4. Inform your contacts so they don't fall for scams pretending to be you.",
        "cyberbullying": "🛑 **Cyberbullying / Harassment**:\n1. Do not engage or reply to the harasser.\n2. Take screenshots of all abusive messages and profiles as evidence.\n3. Block and report the account on the platform.\n4. Report severe harassment or blackmail to the national cybercrime portal.",
        "malware": "🦠 **Malware / Virus**:\n1. Disconnect your device from the internet to stop data theft.\n2. Boot your computer in Safe Mode.\n3. Run a full scan using a reputable Antivirus software.\n4. Keep your Operating System and apps updated to avoid vulnerabilities.",
        "deepfake": "🎭 **Deepfakes / AI Impersonation**:\n1. If a 'friend' or 'relative' asks for urgent money via video/audio, hang up and call them back on their regular number.\n2. Ask a personal question only they would know.\n3. Look for unnatural blinking, skin tones, or audio glitches.",
        "general_safety": "🛡️ **General Cyber Safety**:\n1. Use strong, unique passwords for every account (12+ chars with symbols).\n2. Enable Two-Factor Authentication (2FA) everywhere.\n3. Never share your OTP, PIN, or passwords.\n4. Think twice before clicking any links.",
        "fallback": "Hello! I am a Cybersecurity Assistant. Please ask me about phishing, UPI fraud, hacked accounts, malware, job scams, deepfakes, or digital safety tips!"
    },
    "hi": {
        "phishing": "🎣 **Phishing Scams (धोखाधड़ी)**:\n1. कभी भी अनजान लिंक पर क्लिक न करें।\n2. हमेशा भेजने वाले का असली ईमेल पता वेरिफाई करें।\n3. बैंक कभी भी आपका पासवर्ड या OTP नहीं मांगते हैं।\n4. यदि आपने किसी लिंक पर क्लिक कर दिया है, तो इंटरनेट बंद करें और एंटीवायरस स्कैन चलाएं।",
        "upi_fraud": "📱 **UPI / बैंकिंग फ्रॉड**:\n1. अपना OTP या UPI PIN कभी किसी के साथ शेयर न करें।\n2. आपको पैसे *प्राप्त* करने के लिए अपना UPI PIN डालने की आवश्यकता नहीं है।\n3. QR कोड स्कैन करने से पहले हमेशा नाम वेरिफाई करें।\n4. फ्रॉड होने पर तुरंत **1930** डायल करें और अपनी बैंक को सूचित करें।",
        "ransomware": "🔒 **रैनसमवेयर (Ransomware)**:\n1. हैकर्स को पैसे न दें; डेटा वापस मिलने की कोई गारंटी नहीं होती।\n2. संक्रमित डिवाइस को तुरंत नेटवर्क से डिस्कनेक्ट करें।\n3. अपने ऑफलाइन बैकअप से अपनी फाइलों को रिस्टोर करें।\n4. स्थानीय साइबर क्राइम सेल में शिकायत दर्ज करें।",
        "identity_theft": "👤 **पहचान की चोरी (Identity Theft)**:\n1. तुरंत अपने बैंक और क्रेडिट कार्ड कंपनियों को सूचित करें।\n2. अपने सभी ऑनलाइन खातों के पासवर्ड बदलें।\n3. अपनी क्रेडिट रिपोर्ट की निगरानी करें।\n4. पुलिस में FIR दर्ज कराएं।",
        "job_scam": "💼 **जॉब स्कैम (Job Scams)**:\n1. असली कंपनियां कभी भी नौकरी देने के लिए पैसे नहीं मांगती हैं।\n2. WhatsApp या Telegram पर 'Work from Home' के अनचाहे ऑफर्स से सावधान रहें।\n3. बिना आधिकारिक कागजी कार्रवाई के अपने बैंक विवरण शेयर न करें।",
        "hacked": "⚠️ **अकाउंट हैक (Account Hacked)**:\n1. रिकवरी ईमेल या फोन नंबर का उपयोग करके अपना पासवर्ड रीसेट करने का प्रयास करें।\n2. सभी डिवाइसों से लॉग आउट करें।\n3. तुरंत टू-फैक्टर ऑथेंटिकेशन (2FA) चालू करें।\n4. अपने दोस्तों को सूचित करें ताकि वे आपके अकाउंट से आने वाले किसी स्कैम में न फंसें।",
        "cyberbullying": "🛑 **साइबरबुलिंग / उत्पीड़न**:\n1. ब्लैकमेलर या उत्पीड़न करने वाले को जवाब न दें।\n2. सबूत के तौर पर सभी मैसेजेस और प्रोफाइल का स्क्रीनशॉट लें।\n3. सोशल मीडिया प्लेटफॉर्म पर उस अकाउंट को ब्लॉक और रिपोर्ट करें।\n4. गंभीर मामलों की रिपोर्ट राष्ट्रीय साइबर अपराध पोर्टल पर करें।",
        "malware": "🦠 **मैलवेयर / वायरस**:\n1. डेटा चोरी रोकने के लिए डिवाइस को तुरंत इंटरनेट से डिस्कनेक्ट करें।\n2. एक मजबूत एंटीवायरस से फुल स्कैन करें।\n3. हमेशा अपने ऐप्स और ऑपरेटिंग सिस्टम को अपडेट रखें।",
        "deepfake": "🎭 **डीपफेक (AI Voice/Video)**:\n1. यदि कोई 'रिश्तेदार' या 'दोस्त' वीडियो/ऑडियो कॉल पर पैसे मांगता है, तो कॉल काटें और उन्हें उनके असली नंबर पर वापस कॉल करें।\n2. कोई ऐसा सवाल पूछें जो सिर्फ उन्हें पता हो।\n3. वीडियो में अप्राकृतिक पलक झपकने या ऑडियो में गड़बड़ी पर ध्यान दें।",
        "general_safety": "🛡️ **सुरक्षा के सामान्य नियम**:\n1. हर अकाउंट के लिए मजबूत और अलग पासवर्ड का उपयोग करें।\n2. सभी जगह Two-Factor Authentication (2FA) चालू रखें।\n3. अपना OTP, PIN या पासवर्ड कभी शेयर न करें।\n4. किसी भी लिंक पर क्लिक करने से पहले सोचें।",
        "fallback": "नमस्ते! मैं एक साइबर सुरक्षा सहायक हूँ। कृपया मुझसे फिशिंग, UPI फ्रॉड, हैक हुए अकाउंट, जॉब स्कैम, या डिजिटल सुरक्षा के बारे में सवाल पूछें!"
    }
}

@app.route("/api/ai-assistant/chat", methods=["POST"])
def ai_chat():
    data = request.json or {}
    raw_prompt = data.get("prompt", "")
    prompt = str(raw_prompt).lower() if raw_prompt else ""
    
    raw_lang = data.get("language", "en")
    lang = str(raw_lang) if raw_lang else "en"
    
    # Keyword detection algorithm
    matched_category = ""
    max_matches = 0
    
    for category, keywords in CYBER_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in prompt)
        if matches > max_matches:
            max_matches = matches
            matched_category = category
            
    if max_matches == 0:
        if "hello" in prompt or "hi" in prompt or "help" in prompt:
            reply = RESPONSES.get(lang, RESPONSES["en"])["fallback"]
        else:
            reply = RESPONSES.get(lang, RESPONSES["en"])["fallback"]
    else:
        reply = RESPONSES.get(lang, RESPONSES["en"])[matched_category]
    
    ai_queries_store.insert(0, {
        "id": generate_id("aiq"),
        "userId": request.remote_addr or "anon",
        "prompt": prompt,
        "reply": reply,
        "language": lang,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "reviewStatus": "open",
        "isPotentiallyHarmful": False,
        "markedIncorrect": False 
    })
    return jsonify({"reply": reply})

# -------- ADMIN AUTH --------
@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.json or {}
    if data.get("username") == ADMIN_USERNAME and data.get("password") == ADMIN_PASSWORD:
        token = jwt.encode({"username": ADMIN_USERNAME, "exp": int(time.time()) + 12*3600}, JWT_SECRET, algorithm="HS256")
        return jsonify({"token": token, "username": ADMIN_USERNAME, "expiresInMs": 12*3600*1000})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/admin/session", methods=["GET"])
def admin_session():
    valid = verify_admin(request)
    return jsonify({"active": valid, "username": ADMIN_USERNAME if valid else None})

@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    return jsonify({"success": True})

# -------- ADMIN ROUTES --------
@app.route("/api/admin/dashboard", methods=["GET"])
def admin_dashboard():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"metrics": {
        "totalScamReports": len(scam_reports_store),
        "activeUsers": 1,
        "mostCommonScamTypes": [],
        "quizParticipationRate": 0,
        "aiQueries": len(ai_queries_store),
        "apiErrors": 0
    }})

@app.route("/api/admin/users", methods=["GET"])
def admin_users():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": [{"id": "anon", "reportCount": len(scam_reports_store), "quizAttempts": 0, "aiQueries": len(ai_queries_store), "lastActivity": time.strftime("%Y-%m-%dT%H:%M:%SZ")}]})

@app.route("/api/admin/reports", methods=["GET"])
def admin_reports():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": scam_reports_store})

@app.route("/api/admin/alerts", methods=["GET"])
def admin_alerts():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": live_alerts_store})

@app.route("/api/admin/alerts", methods=["POST"])
def admin_create_alerts():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    alert = {**request.json, "id": generate_id("alert"), "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")}
    live_alerts_store.insert(0, alert)
    return jsonify({"success": True, "data": alert}), 201

@app.route("/api/admin/articles", methods=["GET"])
def get_articles_admin():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": articles_store})

@app.route("/api/admin/faqs", methods=["GET"])
def admin_faqs():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": faq_store})

@app.route("/api/admin/analytics", methods=["GET"])
def admin_analytics():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"totalScamReports": len(scam_reports_store), "activeUsers": 1, "commonScamTypes": [], "quizParticipationRate": 0, "aiQueries": len(ai_queries_store)})

@app.route("/api/admin/ai-queries", methods=["GET"])
def get_admin_ai():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": ai_queries_store})

@app.route("/api/admin/system/config", methods=["GET"])
def admin_config():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": {"maintenanceMode": False, "aiSafetyFilter": True, "maxQuizQuestionsPerRequest": 20, "scamReportAutoTagging": True}})

@app.route("/api/admin/system/logs", methods=["GET"])
def admin_logs():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"summary": {"totalRequests": 0, "totalErrors": 0}, "data": sys_logs})

@app.route("/api/admin/system/security-alerts", methods=["GET"])
def admin_sec_alert():
    if not verify_admin(request): return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"data": [{"id": "sec-1", "title": "Database connection stable", "severity": "low", "status": "resolved", "createdAt": "2026-03-25T12:00:00Z"}]})

# -------- STATIC DATA ENDPOINTS --------
@app.route("/api/cybercrime-types", methods=["GET"])
def crime_types():
    return jsonify({"data": [
        {"id": "phishing", "name": "Phishing Scams", "emoji": "🎣", "description": "Fraudulent attempts to trick you.", "tips": [{"id": "1", "title": "Hover over links", "description": "Check URLs", "emoji": "🖱"}], "prevention": ["Never click suspicious links"], "signs": ["Urgent language"], "examples": ["Fake banking emails"]}
    ]})

@app.route("/api/live-alerts", methods=["GET"])
def live_alerts():
    return jsonify({"data": live_alerts_store, "total": len(live_alerts_store)})

@app.route("/api/safety-checklist", methods=["GET"])
def checklist():
    return jsonify({"data": [
        {"id": "c1", "category": "General Security", "title": "Use Strong Passwords", "description": "Ensure accounts have unique complex passwords.", "steps": ["At least 12 chars", "Use a password manager"], "priority": "high", "estimatedTime": "10m"}
    ]})

@app.route("/api/quiz/questions", methods=["GET"])
def quiz_q():
    return jsonify({"data": [
        {"id": "q1", "question": "What is phishing?", "options": ["A scam", "A hobby", "A fish", "Nothing"], "correctAnswer": 0, "explanation": "Phishing is a scam.", "difficulty": "easy", "category": "general"}
    ]})

@app.route("/api/quiz/submit", methods=["POST"])
def quiz_submit():
    data = request.json or {}
    return jsonify({"score": 100, "totalQuestions": 1, "percentage": 100, "results": []})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return jsonify({"error": "Not Found"}), 404

if __name__ == "__main__":
    app.run(port=8080, debug=True)
