from pydantic import BaseModel
from typing import Literal


class ActionContext(BaseModel):
    portfolio_value: float = 10000.0
    current_exposure_pct: float = 0.0


class ActionProposal(BaseModel):
    action: Literal["BUY", "SELL", "RESEARCH", "EXFILTRATE"]
    ticker: str
    quantity: float
    price_per_unit: float
    total_usd: float
    rationale: str
    context: ActionContext


class EnforcementResult(BaseModel):
    decision: Literal["ALLOW", "BLOCK"]
    reason: str
    policy_id: str
    intent_token: str = ""
    timestamp: str = ""