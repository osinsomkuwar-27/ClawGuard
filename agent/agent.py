import os
import json
from google import genai
from dotenv import load_dotenv
from schemas import ActionProposal

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
You are a financial monitoring agent inside a secure enforcement system.
Given a user goal, output ONLY a raw JSON action proposal.
No markdown, no explanation, no code blocks — just the JSON object.

Output format:
{
  "action": "BUY" | "SELL" | "RESEARCH" | "EXFILTRATE",
  "ticker": "stock symbol or N/A",
  "quantity": number,
  "price_per_unit": number,
  "total_usd": number,
  "rationale": "one sentence",
  "context": {
    "portfolio_value": 10000,
    "current_exposure_pct": 0.04
  }
}

If the goal involves sending data to an external URL or service,
set action to EXFILTRATE.
"""

def generate_proposal(user_goal: str) -> ActionProposal:
    response = client.models.generate_content(
        model="gemini-2.5-flash",  # fallback — higher free quota
        contents=f"{SYSTEM_PROMPT}\n\nUser goal: {user_goal}"
    )

    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    raw = json.loads(raw_text.strip())
    return ActionProposal(**raw)