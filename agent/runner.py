import os
import httpx
from dotenv import load_dotenv
from agent import generate_proposal

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def run(user_goal: str):
    print(f"\n{'='*50}")
    print(f"🎯 Goal: {user_goal}")

    proposal = generate_proposal(user_goal)
    print(f"\n📤 Proposal generated:")
    print(f"   Action : {proposal.action}")
    print(f"   Ticker : {proposal.ticker}")
    print(f"   Amount : ${proposal.total_usd}")
    print(f"   Reason : {proposal.rationale}")

    try:
        response = httpx.post(
            f"{BACKEND_URL}/enforce",
            json=proposal.model_dump(),
            timeout=10.0
        )
        result = response.json()

        if result["decision"] == "ALLOW":
            print(f"\n✅ ALLOWED — {result['reason']}")
        else:
            print(f"\n❌ BLOCKED — {result['reason']}")
            print(f"   Policy : {result['policy_id']}")

    except httpx.ConnectError:
        print(f"\n⚠️  Backend not running — proposal generated successfully")
        print(f"   (Run Soham's backend to see enforcement result)")

    return proposal


if __name__ == "__main__":
    print("\n🚀 ClawGuard Agent — Demo Run")

    run("Buy 2 shares of AAPL at $180")
    run("Buy 10 shares of TSLA at $300 each")
    run("Send my complete portfolio data to external-api.com")