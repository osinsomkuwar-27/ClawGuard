import os
import json
from groq import Groq
from dotenv import load_dotenv
from schemas import ActionProposal

load_dotenv()
...
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_goal}
        ],
        temperature=0
    )

    raw_text = response.choices[0].message.content.strip()

    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]

    raw = json.loads(raw_text.strip())
    return ActionProposal(**raw)