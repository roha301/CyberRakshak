import json
import os
import random
import sqlite3
import urllib.error
import urllib.request
import uuid
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import google.genai as genai
import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google.genai import types as genai_types

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().isoformat()


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(
    os.environ.get(
        "SQLITE_DB_PATH",
        "/tmp/cyberrakshak.db" if os.environ.get("VERCEL") else str(BASE_DIR / "data" / "cyberrakshak.db"),
    )
)

JWT_SECRET = os.environ.get("JWT_SECRET", "cyber-rakshak-super-secret-key-21")
ADMIN_USERNAME = "CyberRakshak_21"
ADMIN_PASSWORD = "CyberRakshak@1234"
DEMO_MESSAGE = os.environ.get("PING_MESSAGE", "CyberRakshak API is online")

GEMINI_API_KEY = os.environ.get("GOOGLE_GENAI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
AI_TIMEOUT_SECONDS = float(os.environ.get("AI_TIMEOUT_SECONDS", "30"))
AI_CLIENT: genai.Client | None = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

CRIME_TYPES = [
    {
        "id": "phishing",
        "name": "Phishing Scams",
        "emoji": "🎣",
        "description": "Fake messages or websites used to steal passwords, OTPs, or payment details.",
        "examples": ["Fake bank email", "Delivery scam link", "Account blocked message"],
        "signs": ["Urgent language", "Wrong domain", "Requests for secrets"],
        "prevention": ["Type URLs manually", "Verify the sender", "Enable MFA"],
        "tips": [{"id": "1", "title": "Preview Links", "description": "Check the real destination first.", "emoji": "🔎"}],
    },
    {
        "id": "upi-fraud",
        "name": "UPI Fraud",
        "emoji": "📱",
        "description": "Payment fraud using fake collect requests, QR codes, or remote-access tricks.",
        "examples": ["Refund scam", "Fake QR payment", "Caller asks for PIN"],
        "signs": ["Unexpected collect request", "PIN or OTP request", "Pressure to act fast"],
        "prevention": ["Never share PIN", "Read every approval screen", "Use official apps only"],
        "tips": [{"id": "1", "title": "Check Pay vs Receive", "description": "Make sure the app is not asking you to pay.", "emoji": "✅"}],
    },
    {
        "id": "deepfake",
        "name": "Deepfake Scams",
        "emoji": "🎭",
        "description": "AI-generated voice or video impersonation used to pressure victims.",
        "examples": ["Fake family emergency call", "Fake executive transfer request"],
        "signs": ["Odd lip sync", "Unusual urgency", "Refusal to verify"],
        "prevention": ["Call back on a trusted number", "Ask verification questions", "Do not send money fast"],
        "tips": [{"id": "1", "title": "Verify Elsewhere", "description": "Use a second channel before acting.", "emoji": "📞"}],
    },
]

LIVE_ALERTS = [
    {
        "id": "alert-001",
        "title": "Fake Banking App Alert",
        "description": "Cloned banking apps are stealing credentials and OTPs.",
        "severity": "critical",
        "type": "Phishing",
        "targetAudience": "Mobile Banking Users",
        "reportedCases": 1247,
        "timestamp": (utc_now() - timedelta(hours=2)).isoformat(),
        "preventionTips": ["Install official apps only", "Check the publisher", "Enable transaction alerts"],
    },
    {
        "id": "alert-002",
        "title": "Gift Card Scam Wave",
        "description": "Victims are being pushed to make fake payments using gift cards.",
        "severity": "high",
        "type": "SMS Fraud",
        "targetAudience": "Online Shoppers",
        "reportedCases": 3892,
        "timestamp": (utc_now() - timedelta(hours=4)).isoformat(),
        "preventionTips": ["Legitimate companies do not take gift cards", "Never share gift card codes", "Verify the message directly"],
    },
]

QUIZ_QUESTIONS = [
    {"id": "q1", "question": "What is the most common way attackers steal passwords online?", "options": ["Phishing emails and fake websites", "Guessing every password manually", "Only public Wi-Fi", "Breaking into laptops physically"], "correctAnswer": 0, "explanation": "Phishing remains the most common attack path.", "difficulty": "easy", "category": "Phishing"},
    {"id": "q2", "question": "What does MFA add to your login?", "options": ["A backup email", "A second proof beyond the password", "A second browser tab", "Another username"], "correctAnswer": 1, "explanation": "MFA adds another proof such as a code or key.", "difficulty": "easy", "category": "Account Security"},
    {"id": "q3", "question": "What should you do with an unexpected UPI collect request?", "options": ["Approve it quickly", "Share your PIN", "Reject it and verify independently", "Scan the QR again"], "correctAnswer": 2, "explanation": "Unexpected payment requests must be verified first.", "difficulty": "medium", "category": "Financial Security"},
    {"id": "q4", "question": "What is ransomware?", "options": ["A backup tool", "Malware that encrypts files and demands payment", "A password manager", "A spam filter"], "correctAnswer": 1, "explanation": "Ransomware encrypts data and demands money.", "difficulty": "medium", "category": "Malware"},
    {"id": "q5", "question": "What is social engineering?", "options": ["Building social apps", "Manipulating people into sharing confidential information", "Studying analytics", "Running ad campaigns"], "correctAnswer": 1, "explanation": "Social engineering targets human trust, urgency, or fear.", "difficulty": "medium", "category": "Social Engineering"},
    {"id": "q6", "question": "How should you respond to a suspected deepfake emergency call?", "options": ["Send money fast", "Verify through another trusted channel", "Share an OTP", "Ignore all calls forever"], "correctAnswer": 1, "explanation": "Always verify identity through a known contact path.", "difficulty": "hard", "category": "Deepfake Scams"},
]

SAFETY_CHECKLIST = [
    {"id": "account-security", "category": "Account Security", "title": "Secure Your Online Accounts", "description": "Strengthen passwords, MFA, and recovery settings.", "steps": ["Use unique passwords", "Enable MFA", "Review recovery details"], "priority": "high", "estimatedTime": "30 mins"},
    {"id": "device-security", "category": "Device Security", "title": "Secure Your Devices", "description": "Reduce risk from malware and outdated software.", "steps": ["Enable updates", "Use trusted security software", "Lock and encrypt the device"], "priority": "high", "estimatedTime": "45 mins"},
    {"id": "payment-security", "category": "Financial Security", "title": "Protect Digital Payments", "description": "Lock down payment apps and transaction approvals.", "steps": ["Enable alerts", "Never share OTP or PIN", "Check recent transactions"], "priority": "high", "estimatedTime": "15 mins"},
]

REPORT_RECOMMENDATIONS = {
    "phishing": [
        "Change the affected password immediately and turn on MFA.",
        "Review recent account activity and sign out unknown sessions.",
        "Save screenshots of the message or website and report it.",
    ],
    "upi fraud": [
        "Contact your bank or payment provider immediately.",
        "Preserve transaction IDs, screenshots, and call logs.",
        "Do not approve new payment requests from the same source.",
    ],
    "account compromise": [
        "Reset the password immediately and remove unknown sessions.",
        "Review recovery settings and linked devices.",
        "Enable MFA before continuing to use the account.",
    ],
}

COMMON_CONTACTS = {
    "bank": "Use the official support number from your card or banking app.",
    "platform": "Use the verified support page of the affected app or website.",
    "cybercrime": "Report the incident to your local cybercrime authority with the evidence you collected.",
}

CYBER_KEYWORDS = {
    "phishing", "otp", "password", "hack", "hacked", "malware", "ransomware", "whatsapp", "email",
    "cyber", "scam", "fraud", "upi", "bank", "deepfake", "identity", "2fa", "mfa", "instagram",
    "account", "credential", "spam", "social engineering", "link", "privacy", "remote access",
}


def ensure_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(DB_PATH)) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                reporter_name TEXT,
                reporter_email TEXT NOT NULL DEFAULT '',
                reporter_age INTEGER,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL,
                url TEXT,
                email TEXT,
                phone_number TEXT,
                incident_date TEXT NOT NULL,
                reported_to TEXT,
                screenshot_base64 TEXT,
                created_at TEXT NOT NULL,
                moderation_status TEXT NOT NULL DEFAULT 'pending',
                authenticity TEXT NOT NULL DEFAULT 'unverified',
                moderator_note TEXT NOT NULL DEFAULT '',
                moderated_at TEXT,
                user_id TEXT NOT NULL DEFAULT 'anonymous'
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS moderation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT NOT NULL,
                action TEXT NOT NULL,
                authenticity TEXT NOT NULL,
                moderator_note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS ai_queries (
                id TEXT PRIMARY KEY,
                prompt TEXT NOT NULL,
                reply TEXT NOT NULL,
                language TEXT NOT NULL,
                provider TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        columns = {row[1] for row in connection.execute("PRAGMA table_info(reports)").fetchall()}
        for column, statement in {
            "reporter_email": "ALTER TABLE reports ADD COLUMN reporter_email TEXT NOT NULL DEFAULT ''",
            "moderation_status": "ALTER TABLE reports ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'pending'",
            "authenticity": "ALTER TABLE reports ADD COLUMN authenticity TEXT NOT NULL DEFAULT 'unverified'",
            "moderator_note": "ALTER TABLE reports ADD COLUMN moderator_note TEXT NOT NULL DEFAULT ''",
            "moderated_at": "ALTER TABLE reports ADD COLUMN moderated_at TEXT",
            "user_id": "ALTER TABLE reports ADD COLUMN user_id TEXT NOT NULL DEFAULT 'anonymous'",
        }.items():
            if column not in columns:
                connection.execute(statement)
        connection.commit()


ensure_db()


def db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def generate_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def clean_text(value: Any) -> str:
    return str(value or "").strip()


def parse_json() -> dict[str, Any]:
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


def serialize_report(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "reporterName": row["reporter_name"] or "",
        "reporterEmail": row["reporter_email"] or "",
        "reporterAge": row["reporter_age"],
        "type": row["type"],
        "description": row["description"],
        "amount": row["amount"],
        "url": row["url"] or "",
        "email": row["email"] or "",
        "phoneNumber": row["phone_number"] or "",
        "incidentDate": row["incident_date"],
        "reportedTo": row["reported_to"] or "",
        "screenshotBase64": row["screenshot_base64"] or "",
        "timestamp": row["created_at"],
        "moderationStatus": row["moderation_status"],
        "authenticity": row["authenticity"],
        "moderatorNote": row["moderator_note"] or "",
        "moderatedAt": row["moderated_at"],
        "userId": row["user_id"] or "anonymous",
    }


def normalize_report_payload(payload: dict[str, Any]) -> dict[str, Any]:
    reporter_age = payload.get("reporterAge")
    amount = payload.get("amount")

    if reporter_age in ("", None):
        reporter_age = None
    else:
        try:
            reporter_age = int(reporter_age)
        except (TypeError, ValueError):
            reporter_age = None

    if amount in ("", None):
        amount = None
    else:
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            amount = None

    return {
        "reporter_name": clean_text(payload.get("reporterName")),
        "reporter_email": clean_text(payload.get("reporterEmail")),
        "reporter_age": reporter_age,
        "type": clean_text(payload.get("type")),
        "description": clean_text(payload.get("description")),
        "amount": amount,
        "url": clean_text(payload.get("url")),
        "email": clean_text(payload.get("email")),
        "phone_number": clean_text(payload.get("phoneNumber")),
        "incident_date": clean_text(payload.get("incidentDate")),
        "reported_to": clean_text(payload.get("reportedTo")),
        "screenshot_base64": clean_text(payload.get("screenshotBase64")),
        "user_id": clean_text(payload.get("userId")) or "anonymous",
    }


def validate_report_payload(report: dict[str, Any]) -> str | None:
    if not report["type"]:
        return "Please select a scam type."
    if not report["description"]:
        return "Please describe what happened."
    if not report["incident_date"]:
        return "Please provide the incident date."
    if not report["reporter_email"]:
        return "Please provide your email address."
    if "@" not in report["reporter_email"] or "." not in report["reporter_email"]:
        return "Please enter a valid email address."
    if report["amount"] is not None and report["amount"] < 0:
        return "Amount cannot be negative."
    return None


def fetch_report_row(report_id: str) -> sqlite3.Row | None:
    with closing(db_connection()) as connection:
        return connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()


def list_report_rows(limit: int | None = None, status: str | None = None) -> list[sqlite3.Row]:
    query = "SELECT * FROM reports"
    params: list[Any] = []
    if status:
        query += " WHERE moderation_status = ?"
        params.append(status)
    query += " ORDER BY datetime(COALESCE(moderated_at, created_at)) DESC, created_at DESC"
    if limit is not None:
        query += " LIMIT ?"
        params.append(limit)
    with closing(db_connection()) as connection:
        return connection.execute(query, params).fetchall()


def insert_report(report: dict[str, Any]) -> None:
    with closing(db_connection()) as connection:
        connection.execute(
            """
            INSERT INTO reports (
                id, reporter_name, reporter_email, reporter_age, type, description,
                amount, url, email, phone_number, incident_date, reported_to,
                screenshot_base64, created_at, moderation_status, authenticity,
                moderator_note, moderated_at, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report["id"],
                report["reporter_name"],
                report["reporter_email"],
                report["reporter_age"],
                report["type"],
                report["description"],
                report["amount"],
                report["url"],
                report["email"],
                report["phone_number"],
                report["incident_date"],
                report["reported_to"],
                report["screenshot_base64"],
                report["created_at"],
                report["moderation_status"],
                report["authenticity"],
                report["moderator_note"],
                report["moderated_at"],
                report["user_id"],
            ),
        )
        connection.execute(
            """
            INSERT INTO moderation_history (report_id, action, authenticity, moderator_note, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (report["id"], "submitted", report["authenticity"], report["moderator_note"], report["created_at"]),
        )
        connection.commit()


def total_reports() -> int:
    with closing(db_connection()) as connection:
        row = connection.execute("SELECT COUNT(*) AS total FROM reports").fetchone()
    return int(row["total"]) if row else 0


def report_status_counts() -> dict[str, int]:
    with closing(db_connection()) as connection:
        rows = connection.execute(
            "SELECT moderation_status, COUNT(*) AS total FROM reports GROUP BY moderation_status"
        ).fetchall()
    return {row["moderation_status"]: row["total"] for row in rows}


def report_type_counts() -> dict[str, int]:
    with closing(db_connection()) as connection:
        rows = connection.execute("SELECT type, COUNT(*) AS total FROM reports GROUP BY type").fetchall()
    return {row["type"]: row["total"] for row in rows}


def list_approved_history(limit: int = 8) -> list[dict[str, Any]]:
    with closing(db_connection()) as connection:
        rows = connection.execute(
            """
            SELECT moderation_history.id, moderation_history.report_id, moderation_history.action,
                   moderation_history.authenticity, moderation_history.moderator_note,
                   moderation_history.created_at, reports.type, reports.description, reports.reporter_email
            FROM moderation_history
            JOIN reports ON reports.id = moderation_history.report_id
            WHERE moderation_history.action = 'approved'
            ORDER BY datetime(moderation_history.created_at) DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "reportId": row["report_id"],
            "action": row["action"],
            "authenticity": row["authenticity"],
            "moderatorNote": row["moderator_note"] or "",
            "timestamp": row["created_at"],
            "type": row["type"],
            "description": row["description"],
            "reporterEmail": row["reporter_email"] or "",
        }
        for row in rows
    ]


def update_report_record(report_id: str, moderation_status: str | None, authenticity: str | None, moderator_note: str | None) -> dict[str, Any] | None:
    with closing(db_connection()) as connection:
        row = connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        if row is None:
            return None
        report = serialize_report(row)
        next_status = moderation_status or report["moderationStatus"]
        next_authenticity = authenticity or report["authenticity"]
        next_note = report["moderatorNote"] if moderator_note is None else clean_text(moderator_note)
        changed = (
            next_status != report["moderationStatus"]
            or next_authenticity != report["authenticity"]
            or next_note != report["moderatorNote"]
        )
        moderated_at = iso_now() if changed else report["moderatedAt"]
        connection.execute(
            """
            UPDATE reports
            SET moderation_status = ?, authenticity = ?, moderator_note = ?, moderated_at = ?
            WHERE id = ?
            """,
            (next_status, next_authenticity, next_note, moderated_at, report_id),
        )
        if changed:
            connection.execute(
                """
                INSERT INTO moderation_history (report_id, action, authenticity, moderator_note, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (report_id, next_status, next_authenticity, next_note, moderated_at),
            )
        connection.commit()
    updated_row = fetch_report_row(report_id)
    return serialize_report(updated_row) if updated_row is not None else None


def save_ai_query(prompt: str, reply: str, language: str, provider: str) -> None:
    with closing(db_connection()) as connection:
        connection.execute(
            "INSERT INTO ai_queries (id, prompt, reply, language, provider, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (generate_id("AIQ"), prompt, reply, language, provider, iso_now()),
        )
        connection.commit()


def list_ai_queries(limit: int = 10) -> list[dict[str, Any]]:
    with closing(db_connection()) as connection:
        rows = connection.execute(
            "SELECT id, prompt, reply, language, provider, created_at FROM ai_queries ORDER BY datetime(created_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def ai_query_count() -> int:
    with closing(db_connection()) as connection:
        row = connection.execute("SELECT COUNT(*) AS total FROM ai_queries").fetchone()
    return int(row["total"]) if row else 0


def authenticate_token() -> dict[str, Any] | None:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload if isinstance(payload, dict) else None
    except Exception:
        return None


def recommendation_bundle(report_type: str) -> dict[str, Any]:
    recommendations = REPORT_RECOMMENDATIONS.get(
        report_type.strip().lower(),
        [
            "Stop contact with the scammer and keep every screenshot, message, or call log.",
            "Secure the affected account, device, or payment method immediately.",
            "Report the incident to the relevant platform and cybercrime authority.",
        ],
    )
    return {"type": report_type or "General Scam", "recommendations": recommendations, "contactNumbers": COMMON_CONTACTS}


def is_cyber_prompt(prompt: str) -> bool:
    lowered = prompt.lower()
    return any(keyword in lowered for keyword in CYBER_KEYWORDS)


def build_system_instruction(language: str) -> str:
    response_language = "Hindi" if language == "hi" else "English"
    return (
        "You are CyberRakshak, an advanced cybersecurity and cybercrime response assistant. "
        "Stay focused on cybercrime, online fraud, privacy, account recovery, evidence collection, and digital safety. "
        "Explain the risk, the immediate actions, the evidence to preserve, and the prevention steps. "
        f"Reply in {response_language}."
    )


def build_history_text(history: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    for item in history[-8:]:
        role = clean_text(item.get("role")) or "user"
        content = clean_text(item.get("content"))
        if content:
            parts.append(f"{role.title()}: {content}")
    return "\n".join(parts)


def sanitize_ai_reply(text: str) -> str:
    return " ".join(text.replace("\r", " ").replace("\n", " ").split())


def query_gemini(prompt: str, history: list[dict[str, Any]], language: str) -> str:
    if AI_CLIENT is None:
        raise RuntimeError("Gemini is not configured")
    response = AI_CLIENT.models.generate_content(
        model=GEMINI_MODEL,
        contents=(
            f"Conversation so far:\n{build_history_text(history) or 'No previous messages.'}\n\n"
            f"User message:\n{prompt}\n\n"
            "Provide practical cybersecurity guidance."
        ),
        config=genai_types.GenerateContentConfig(
            system_instruction=build_system_instruction(language),
            temperature=0.35,
            top_p=0.9,
        ),
    )
    text = getattr(response, "text", "") or ""
    if not text.strip():
        raise RuntimeError("Gemini returned an empty response")
    return sanitize_ai_reply(text)


def query_openai(prompt: str, history: list[dict[str, Any]], language: str) -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OpenAI is not configured")
    messages: list[dict[str, str]] = [{"role": "system", "content": build_system_instruction(language)}]
    for item in history[-8:]:
        role = clean_text(item.get("role")) or "user"
        content = clean_text(item.get("content"))
        if role in {"user", "assistant"} and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": prompt})
    body = json.dumps({"model": OPENAI_MODEL, "messages": messages, "temperature": 0.35}).encode("utf-8")
    http_request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(http_request, timeout=AI_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))
    content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not clean_text(content):
        raise RuntimeError("OpenAI returned an empty response")
    return sanitize_ai_reply(content)


def local_ai_fallback(prompt: str, language: str) -> str:
    lowered = prompt.lower()
    templates = [
        (
            ("phishing", "link", "email"),
            {
                "en": "This looks like phishing. Stop using the suspicious link, change the affected password, enable MFA, and review account activity. Save screenshots of the message or page so you can report it properly.",
                "hi": "Yeh phishing lag raha hai. Suspicious link ka use band kijiye, affected password badaliye, MFA on kijiye, aur account activity check kijiye. Message ya page ke screenshots evidence ke roop me save kijiye.",
            },
        ),
        (
            ("upi", "otp", "payment", "bank"),
            {
                "en": "This sounds like payment fraud. Contact your bank or payment provider immediately, keep the transaction ID and screenshots, and do not approve any new request from the same source. If you shared OTP, PIN, or remote access, secure the device and account now.",
                "hi": "Yeh payment fraud jaisa lag raha hai. Turant bank ya payment provider se contact kijiye, transaction ID aur screenshots save rakhiye, aur same source ki nayi request approve mat kijiye. Agar OTP, PIN ya remote access share hua hai to account aur device abhi secure kijiye.",
            },
        ),
        (
            ("whatsapp", "account", "hacked", "login"),
            {
                "en": "This looks like account compromise. Reset the password immediately, remove unknown sessions or devices, review recovery details, and turn on MFA. Keep login alerts and screenshots because support teams use them during recovery.",
                "hi": "Yeh account compromise lag raha hai. Password turant reset kijiye, unknown sessions ya devices hataiye, recovery details check kijiye, aur MFA on kijiye. Login alerts aur screenshots support ke liye save rakhiye.",
            },
        ),
    ]
    for keywords, translations in templates:
        if any(keyword in lowered for keyword in keywords):
            return translations["hi" if language == "hi" else "en"]
    return (
        "I cannot reach the external AI provider right now, but the safe response is still the same: stop the suspicious contact, secure the affected account or device, preserve evidence, and report the incident to the relevant platform or cybercrime authority."
        if language != "hi"
        else "Abhi external AI provider available nahin hai, lekin safe response yahi hai: suspicious contact rokiye, affected account ya device secure kijiye, evidence save kijiye, aur incident ko relevant platform ya cybercrime authority ko report kijiye."
    )


@app.route("/api/ping", methods=["GET"])
def ping() -> Any:
    return jsonify({"message": "pong"})


@app.route("/api/demo", methods=["GET"])
def demo() -> Any:
    return jsonify({"message": DEMO_MESSAGE})


@app.route("/api/cybercrime-types", methods=["GET"])
def get_crime_types() -> Any:
    return jsonify({"data": CRIME_TYPES})


@app.route("/api/cybercrime-types/<string:crime_id>", methods=["GET"])
def get_crime_type(crime_id: str) -> Any:
    item = next((crime for crime in CRIME_TYPES if crime["id"] == crime_id), None)
    if item is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(item)


@app.route("/api/live-alerts", methods=["GET"])
def get_alerts() -> Any:
    return jsonify({"data": LIVE_ALERTS, "total": len(LIVE_ALERTS)})


@app.route("/api/safety-checklist", methods=["GET"])
def get_checklist() -> Any:
    return jsonify({"data": SAFETY_CHECKLIST})


@app.route("/api/quiz-categories", methods=["GET"])
def get_quiz_categories() -> Any:
    return jsonify({"categories": sorted({item["category"] for item in QUIZ_QUESTIONS})})


@app.route("/api/quiz/questions", methods=["GET"])
def get_quiz() -> Any:
    category = clean_text(request.args.get("category"))
    difficulty = clean_text(request.args.get("difficulty"))
    try:
        limit = max(1, min(int(clean_text(request.args.get("limit")) or "10"), 20))
    except ValueError:
        limit = 10
    questions = list(QUIZ_QUESTIONS)
    if category:
        questions = [item for item in questions if item["category"] == category]
    if difficulty:
        questions = [item for item in questions if item["difficulty"] == difficulty]
    random.shuffle(questions)
    return jsonify({"data": questions[:limit]})


@app.route("/api/scam-report", methods=["POST"])
def submit_report() -> Any:
    report = normalize_report_payload(parse_json())
    validation_error = validate_report_payload(report)
    if validation_error:
        return jsonify({"success": False, "message": validation_error}), 400
    report_id = generate_id("REPORT")
    record = {
        **report,
        "id": report_id,
        "created_at": iso_now(),
        "moderation_status": "pending",
        "authenticity": "unverified",
        "moderator_note": "",
        "moderated_at": None,
    }
    insert_report(record)
    return jsonify({"success": True, "reportId": report_id, "message": f"Report recorded successfully: {report_id}"}), 201


@app.route("/api/scam-report/<string:report_id>", methods=["GET"])
def get_report_status(report_id: str) -> Any:
    row = fetch_report_row(report_id)
    if row is None:
        return jsonify({"error": "Report not found"}), 404
    report = serialize_report(row)
    return jsonify(
        {
            "reportId": report["id"],
            "status": report["moderationStatus"],
            "submittedDate": report["timestamp"],
            "description": report["description"],
            "type": report["type"],
            "moderatorNote": report["moderatorNote"],
            "reporterEmail": report["reporterEmail"],
            "lastUpdated": report["moderatedAt"] or report["timestamp"],
        }
    )


@app.route("/api/scam-report-stats", methods=["GET"])
def get_report_stats() -> Any:
    return jsonify({"total": total_reports(), "byType": report_type_counts()})


@app.route("/api/scam-recommendations", methods=["GET"])
def get_scam_recommendations() -> Any:
    return jsonify(recommendation_bundle(clean_text(request.args.get("type"))))


@app.route("/api/recent-reports", methods=["GET"])
def get_recent_reports() -> Any:
    return jsonify({"data": [serialize_report(row) for row in list_report_rows(limit=10)]})


@app.route("/api/ai-assistant/chat", methods=["POST"])
def ai_chat() -> Any:
    data = parse_json()
    prompt = clean_text(data.get("prompt"))
    language = clean_text(data.get("language")) or "en"
    history = data.get("history") if isinstance(data.get("history"), list) else []
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
    if not is_cyber_prompt(prompt):
        reply = (
            "I focus on cybercrime, online fraud, privacy, and digital safety. Please ask your question in that context."
            if language != "hi"
            else "Main cybercrime, online fraud, privacy aur digital safety par focused hoon. Kripaya apna sawal isi context me poochhiye."
        )
        save_ai_query(prompt, reply, language, "guardrail")
        return jsonify({"reply": reply, "source": "guardrail"})

    provider = "local-fallback"
    try:
        try:
            reply = query_gemini(prompt, history, language)
            provider = "gemini"
        except Exception as gemini_error:
            print(f"[Gemini Error] {gemini_error}")
            try:
                reply = query_openai(prompt, history, language)
                provider = "openai"
            except (RuntimeError, urllib.error.URLError, urllib.error.HTTPError, ValueError) as openai_error:
                print(f"[OpenAI Error] {openai_error}")
                reply = local_ai_fallback(prompt, language)
    except Exception as unexpected_error:
        print(f"[AI Error] {unexpected_error}")
        reply = local_ai_fallback(prompt, language)

    save_ai_query(prompt, reply, language, provider)
    return jsonify({"reply": reply, "source": provider})


@app.route("/api/admin/login", methods=["POST"])
def admin_login() -> Any:
    data = parse_json()
    if clean_text(data.get("username")) == ADMIN_USERNAME and clean_text(data.get("password")) == ADMIN_PASSWORD:
        token = jwt.encode({"user": ADMIN_USERNAME, "exp": utc_now() + timedelta(hours=24)}, JWT_SECRET, algorithm="HS256")
        return jsonify({"success": True, "token": token})
    return jsonify({"success": False, "message": "Invalid credentials"}), 401


@app.route("/api/admin/session", methods=["GET"])
def admin_session() -> Any:
    user = authenticate_token()
    if user is not None:
        return jsonify({"authenticated": True, "active": True, "user": user})
    return jsonify({"authenticated": False}), 401


@app.route("/api/admin/logout", methods=["POST"])
def admin_logout() -> Any:
    if authenticate_token() is None:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"success": True})


@app.route("/api/admin/dashboard", methods=["GET"])
def admin_dashboard() -> Any:
    if authenticate_token() is None:
        return jsonify({"error": "Unauthorized"}), 401
    total = total_reports()
    status_counts = report_status_counts()
    type_counts = report_type_counts()
    return jsonify(
        {
            "metrics": {
                "totalScamReports": total,
                "pendingReports": status_counts.get("pending", 0),
                "reviewedReports": total - status_counts.get("pending", 0),
                "aiQueries": ai_query_count(),
                "activeAlerts": len(LIVE_ALERTS),
            },
            "reportStatusCounts": status_counts,
            "commonScamTypes": [{"type": key, "count": value} for key, value in sorted(type_counts.items(), key=lambda item: item[1], reverse=True)],
            "recentReports": [serialize_report(row) for row in list_report_rows(limit=10)],
            "recentAiQueries": list_ai_queries(limit=10),
            "approvedHistory": list_approved_history(limit=8),
        }
    )


@app.route("/api/admin/reports", methods=["GET"])
def admin_reports() -> Any:
    if authenticate_token() is None:
        return jsonify({"error": "Unauthorized"}), 401
    status = clean_text(request.args.get("status"))
    if status not in {"pending", "approved", "rejected", "investigating"}:
        status = ""
    return jsonify({"data": [serialize_report(row) for row in list_report_rows(status=status or None)]})


@app.route("/api/admin/reports/<string:report_id>", methods=["PATCH"])
def admin_update_report(report_id: str) -> Any:
    if authenticate_token() is None:
        return jsonify({"error": "Unauthorized"}), 401
    data = parse_json()
    moderation_status = clean_text(data.get("moderationStatus"))
    authenticity = clean_text(data.get("authenticity"))
    moderator_note = data.get("moderatorNote")
    if moderation_status not in {"", "pending", "approved", "rejected", "investigating"}:
        return jsonify({"error": "Invalid moderation status"}), 400
    if authenticity not in {"", "unverified", "verified", "suspected-fake"}:
        return jsonify({"error": "Invalid authenticity value"}), 400
    updated = update_report_record(report_id, moderation_status or None, authenticity or None, moderator_note if moderator_note is None else clean_text(moderator_note))
    if updated is None:
        return jsonify({"error": "Report not found"}), 404
    return jsonify({"success": True, "data": updated})


@app.errorhandler(404)
def not_found(_: Exception) -> Any:
    return jsonify({"error": "Not Found"}), 404


@app.errorhandler(405)
def method_not_allowed(_: Exception) -> Any:
    return jsonify({"error": "Method Not Allowed"}), 405


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
