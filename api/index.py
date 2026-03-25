import os
import time
import uuid
import jwt
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
@app.route("/api/ai-assistant/chat", methods=["POST"])
def ai_chat():
    data = request.json or {}
    prompt = data.get("prompt", "").lower()
    lang = data.get("language", "en")
    
    if "phish" in prompt or "email" in prompt or "otp" in prompt:
        reply = "Phishing links se bachne ke liye URLs ko dhyan se check karein aur kabhi apna OTP share na karein." if lang == "hi" else "To avoid phishing, carefully check URLs and never share your OTP."
    elif "password" in prompt:
        reply = "Strong passwords 12 characters se lambe hone chahiye aur unme numbers/symbols zaroori hain." if lang == "hi" else "Strong passwords should be at least 12 characters long with numbers and symbols."
    else:
        reply = "Mai ek cyber suraksha sahayak hoon. Main sirf cybersecurity se jude sawalo ke jawab de sakta hoon." if lang == "hi" else "I am a cybersecurity assistant. I can only answer questions related to cybersecurity and digital safety."
    
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
