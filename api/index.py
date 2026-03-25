import os
import time
import uuid
import jwt
import re
try:
    import google.generativeai as genai
except ImportError:
    genai = None

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

JWT_SECRET = os.environ.get("JWT_SECRET", "cyberrakshak-default-secret-change-in-production")
ADMIN_USERNAME = "CyberRakshak_21"
ADMIN_PASSWORD = "CyberRakshak@1234"

GEMINI_API_KEY = os.environ.get("GOOGLE_GENAI_API_KEY")
if GEMINI_API_KEY and genai:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception:
        pass

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
    "upi_fraud": ["upi", "qrcode", "qr", "gpay", "paytm", "phonepe", "deduct", "bank fraud", "otp", "pin", "payment"],
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
        "phishing": "Phishing scams trick you into revealing sensitive information. Never click on unknown links or download unexpected attachments, and always verify the sender's email address since legitimate banks will never ask for your password or OTP. If you accidentally clicked a link, disconnect from the internet immediately, run a malware scan, and change your passwords to stay safe.",
        "upi_fraud": "For UPI and banking fraud, remember to never share your OTP or UPI PIN with anyone, as you absolutely do not need to enter your PIN just to receive money. Always verify the merchant name carefully before scanning any QR code. If you suspect you have been scammed, immediately block your bank account and dial 1930 to report the cyber fraud.",
        "ransomware": "If you are hit by ransomware, do not pay the ransom because there is no guarantee you will get your data back. Immediately disconnect the infected device from your network to prevent the virus from spreading. You should restore your files from an offline backup if you have one, and report the incident to your local cybercrime cell.",
        "identity_theft": "To handle identity theft, you must freeze your credit reports immediately to stop new accounts from being opened. Change the passwords for all your online accounts and notify your bank and credit card companies about the theft. Finally, file a police report and keep a copy to help with any future fraud disputes.",
        "job_scam": "Job scams are very common on messaging apps. Legitimate companies will never ask you to pay money to get a job or receive training. Beware of unsolicited 'Work from Home' offers on WhatsApp or Telegram, and do not share your bank account details for supposed salary drops before signing official paperwork.",
        "hacked": "If your account is hacked, try to reset your password using your recovery email or phone number as soon as possible. Log out of all active sessions in your account settings and enable Two-Factor Authentication immediately. It is also important to inform your contacts so they do not fall for scams pretending to be you.",
        "cyberbullying": "For cyberbullying or online harassment, the best approach is to never engage or reply to the harasser. Take clear screenshots of all abusive messages and profiles to keep as evidence. Block and report the abusive account on the respective platform, and report severe harassment or blackmail to the national cybercrime portal.",
        "malware": "If your device has malware or a virus, disconnect it from the internet right away to stop any data theft from occurring. Boot your computer in Safe Mode and run a full system scan using a reputable Antivirus software. Regularly update your Operating System and apps to avoid future vulnerabilities.",
        "deepfake": "Deepfakes and AI voice clones are increasingly used to impersonate loved ones. If a friend or relative asks for urgent money via video or audio call, hang up and call them back on their regular trusted number. You can verify their identity by asking a personal question only they would know, or looking for unnatural blinking and audio glitches.",
        "general_safety": "For general cyber safety, always use strong, unique passwords for every account that are at least 12 characters long with symbols. Enable Two-Factor Authentication everywhere available and never share your OTP, PIN, or passwords with anyone. Always think twice before clicking any links online.",
        "fallback": "Hello! I am a Cybersecurity Assistant. I can help you understand and prevent cybercrimes like phishing, UPI fraud, hacked accounts, malware, job scams, and deepfakes. Please ask me your security questions, and I will guide you safely."
    },
    "hi": {
        "phishing": "फ़िशिंग घोटाले आपको संवेदनशील जानकारी बताने के लिए बरगलाते हैं। कभी भी अनजान लिंक पर क्लिक न करें या अनपेक्षित अटैचमेंट डाउनलोड न करें, और हमेशा भेजने वाले का ईमेल पता सत्यापित करें क्योंकि असली बैंक कभी आपका पासवर्ड या ओटीपी नहीं मांगेंगे। यदि आपने गलती से किसी लिंक पर क्लिक कर दिया है, तो तुरंत इंटरनेट बंद कर दें, एंटीवायरस स्कैन चलाएं, और सुरक्षित रहने के लिए अपने पासवर्ड बदल लें।",
        "upi_fraud": "UPI और बैंकिंग धोखाधड़ी के लिए, याद रखें कि आप अपना OTP या UPI पिन किसी के साथ साझा न करें, क्योंकि आपको केवल पैसे प्राप्त करने के लिए अपना पिन दर्ज करने की आवश्यकता नहीं है। किसी भी QR कोड को स्कैन करने से पहले हमेशा व्यापारी का नाम ध्यान से जांचें। यदि आपको लगता है कि आपके साथ धोखाधड़ी हुई है, तो तुरंत अपने बैंक खाते को ब्लॉक करें और साइबर अपराध की रिपोर्ट करने के लिए 1930 डायल करें।",
        "ransomware": "यदि आप रैंसमवेयर की चपेट में आ गए हैं, तो फिरौती न दें क्योंकि इसकी कोई गारंटी नहीं है कि आपको अपना डेटा वापस मिल जाएगा। वायरस को फैलने से रोकने के लिए तुरंत संक्रमित उपकरण को अपने नेटवर्क से डिस्कनेक्ट कर लें। यदि आपके पास कोई ऑफ़लाइन बैकअप है तो आपको अपनी फ़ाइलों को उससे पुनर्स्थापित करना चाहिए, और स्थानीय साइबर अपराध सेल में घटना की रिपोर्ट करनी चाहिए।",
        "identity_theft": "पहचान की चोरी से निपटने के लिए, आपको नए खातों को खोलने से रोकने के लिए अपनी क्रेडिट रिपोर्ट को तुरंत फ्रीज कर देना चाहिए। अपने सभी ऑनलाइन खातों के पासवर्ड बदल लें और चोरी के बारे में अपने बैंक और क्रेडिट कार्ड कंपनियों को सूचित करें। अंत में, एक पुलिस रिपोर्ट दर्ज करें और भविष्य के किसी भी धोखाधड़ी विवाद में मदद के लिए एक प्रति अपने पास रखें।",
        "job_scam": "मैसेजिंग ऐप पर नौकरी के घोटाले बहुत आम हैं। वैध कंपनियां आपको नौकरी पाने या प्रशिक्षण प्राप्त करने के लिए कभी भी पैसे देने के लिए नहीं कहेंगी। व्हाट्सएप या टेलीग्राम पर अनचाहे 'वर्क फ्रॉम होम' प्रस्तावों से सावधान रहें, और आधिकारिक कागजी कार्रवाई पर हस्ताक्षर करने से पहले कभी भी अपने बैंक खाते का विवरण साझा न करें।",
        "hacked": "यदि आपका खाता हैक हो गया है, तो जल्द से जल्द अपने रिकवरी ईमेल या फोन नंबर का उपयोग करके अपना पासवर्ड रीसेट करने का प्रयास करें। अपने खाते की सेटिंग में सभी सक्रिय सत्रों से लॉग आउट करें और तुरंत टू-फैक्टर ऑथेंटिकेशन सक्षम करें। अपने संपर्कों को सूचित करना भी महत्वपूर्ण है ताकि वे आपके होने का दिखावा करने वाले घोटालों में न फंसें।",
        "cyberbullying": "साइबरबुलिंग या ऑनलाइन उत्पीड़न के लिए, सबसे अच्छा तरीका है कि आप कभी भी उत्पीड़न करने वाले से बात न करें या उसे जवाब न दें। सबूत के तौर पर रखने के लिए सभी अपमानजनक संदेशों और प्रोफाइल के स्पष्ट स्क्रीनशॉट लें। संबंधित प्लेटफॉर्म पर अपमानजनक खाते को ब्लॉक करें और रिपोर्ट करें, और राष्ट्रीय साइबर अपराध पोर्टल पर गंभीर उत्पीड़न या ब्लैकमेल की रिपोर्ट करें।",
        "malware": "यदि आपके उपकरण में मैलवेयर या वायरस है, तो किसी भी डेटा चोरी को होने से रोकने के लिए इसे तुरंत इंटरनेट से डिस्कनेक्ट कर दें। अपने कंप्यूटर को सेफ मोड में बूट करें और एक विश्वसनीय एंटीवायरस सॉफ़्टवेयर का उपयोग करके पूर्ण सिस्टम स्कैन चलाएं। भविष्य की कमजोरियों से बचने के लिए अपने ऑपरेटिंग सिस्टम और ऐप्स को नियमित रूप से अपडेट करें।",
        "deepfake": "डीपफेक और एआई वॉयस क्लोन का इस्तेमाल धोखाधड़ी के लिए तेजी से किया जा रहा है। यदि कोई दोस्त या रिश्तेदार वीडियो या ऑडियो कॉल के माध्यम से तत्काल पैसे मांगता है, तो फोन काट दें और उन्हें उनके नियमित विश्वसनीय नंबर पर वापस कॉल करें। आप उनकी पहचान को एक ऐसा व्यक्तिगत प्रश्न पूछकर सत्यापित कर सकते हैं जिसे केवल वे ही जानेंगे।",
        "general_safety": "सामान्य साइबर सुरक्षा के लिए, हमेशा हर खाते के लिए मजबूत, अद्वितीय पासवर्ड का उपयोग करें जो कम से कम 12 अक्षर लंबे हों और उसमें प्रतीक शामिल हों। हर जगह उपलब्ध टू-फैक्टर ऑथेंटिकेशन को सक्षम करें और कभी भी अपना ओटीपी, पिन या पासवर्ड किसी के साथ साझा न करें। ऑनलाइन किसी भी लिंक पर क्लिक करने से पहले हमेशा दो बार सोचें।",
        "fallback": "नमस्ते! मैं एक साइबर सुरक्षा सहायक हूं। मैं आपको फ़िशिंग, यूपीआई धोखाधड़ी, हैक किए गए खाते, मैलवेयर, नौकरी के घोटाले और डीपफेक जैसे साइबर अपराधों को समझने और रोकने में मदद कर सकता हूं। कृपया मुझसे अपने सुरक्षा प्रश्न पूछें, और मैं आपको सुरक्षित रूप से मार्गदर्शन करूंगा।"
    }
}

@app.route("/api/ai-assistant/chat", methods=["POST"])
def ai_chat():
    data = request.json or {}
    raw_prompt = data.get("prompt", "")
    prompt = str(raw_prompt).lower() if raw_prompt else ""
    
    raw_lang = data.get("language", "en")
    lang = str(raw_lang) if raw_lang else "en"
    reply = ""

    # Call Gemini Generative AI if key is present
    if GEMINI_API_KEY and genai and prompt:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            sys_instruct = f"You are CyberRakshak, a cybersecurity expert assistant. Answer ONLY cybercrime or cybersecurity related questions globally. Answer concisely in a flowing paragraph format ONLY; DO NOT use bullet points, numbered lists, or markdown lists. NEVER use line breaks. Answer as a continuous paragraph. If the user asks something completely unrelated to cyber security or scams, politely decline. Reply purely in {'Hindi' if lang == 'hi' else 'English'}."
            response = model.generate_content(f"{sys_instruct}\n\nUser Question: {prompt}")
            reply = response.text
            # Final sanity check to remove asterisks or bullet styles
            reply = reply.replace("- ", "").replace("* ", "").replace("*", "").strip()
        except Exception as e:
            print("Gemini API Error:", e)
            reply = ""
    
    # Keyword detection algorithm fallback
    if not reply:
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
