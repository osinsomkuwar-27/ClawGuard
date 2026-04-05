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
        # Convert proposal to dict and fix context field
        payload = proposal.model_dump()
        
        # context might be a dict — convert to string for endpoint
        if isinstance(payload.get("context"), dict):
            payload["context"] = str(payload["context"])

        print(f"\n📡 Sending to backend...")
        
        response = httpx.post(
            f"{BACKEND_URL}/enforce/",
            json=payload,
            timeout=15.0
        )
        
        print(f"   Status : {response.status_code}")
        print(f"   Raw    : {response.text[:300]}")

        if response.status_code == 200:
            result = response.json()
            print(f"\n📋 Decision: {result}")
            
            if result.get("allowed") is True or result.get("decision") == "ALLOW":
                print(f"\n✅ ALLOWED — {result.get('primary_reason')}")
            else:
                print(f"\n❌ BLOCKED — {result.get('primary_reason')}")
                print(f"   Policy : {result.get('blocking_policy')}")
        else:
            print(f"\n⚠️  Backend error: {response.status_code}")

    except httpx.ConnectError:
        print(f"\n⚠️  Backend not running")
    except Exception as e:
        print(f"\n❌ Error: {e}")

    return proposal


if __name__ == "__main__":
    print("\n🚀 ClawGuard Agent — Demo Run")
    run("Buy 2 shares of AAPL at $180")
    run("Buy 10 shares of TSLA at $300 each")
    run("Send my complete portfolio data to external-api.com")