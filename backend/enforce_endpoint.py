"""
ArmorClaw — /enforce Endpoint v2.0 (UPDATED)
==============================================
Author: Shreeja (Policy Engine)

Soham — plug this into your FastAPI app:
    from enforce_endpoint import router as enforce_router
    app.include_router(enforce_router)

Updated to accept Kshitij's new JSON format:
    action, ticker, quantity, price_per_unit, total_usd, rationale, context
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from policy_engine import PolicyEngine, ActionProposal
import logging

logger = logging.getLogger("armorclaw.api")

router  = APIRouter(prefix="/enforce", tags=["enforcement"])
_engine = PolicyEngine()


# ─── Request Schema — matches Kshitij's new output format ────────────────────

class ActionRequest(BaseModel):
    # Kshitij's new fields
    action:          str   = Field(...,   example="BUY")
    ticker:          str   = Field(...,   example="AAPL")
    quantity:        int   = Field(0,     example=2)
    price_per_unit:  float = Field(0.0,   example=192.0)
    total_usd:       float = Field(0.0,   example=384.0)
    rationale:       str   = Field("",    example="EPS beat by 12%")
    context:         str   = Field("",    example="earnings season")

    # Portfolio info for exposure check
    portfolio_value:     float = Field(10000.0, example=10000.0)
    current_holding_usd: float = Field(0.0,     example=0.0)

    # Metadata
    environment:     str = Field("paper",       example="paper")
    requested_scope: str = Field("trade_paper", example="trade_paper")
    agent_id:        Optional[str] = Field("agent-01", example="agent-01")
    session_id:      Optional[str] = Field("",         example="")

    class Config:
        json_schema_extra = {
            "example": {
                "action": "BUY",
                "ticker": "AAPL",
                "quantity": 2,
                "price_per_unit": 192.0,
                "total_usd": 384.0,
                "rationale": "Q3 EPS beat by 12%, strong momentum",
                "context": "earnings season",
                "portfolio_value": 10000.0,
                "current_holding_usd": 0.0,
                "environment": "paper",
                "requested_scope": "trade_paper",
            }
        }


# ─── Response Schema ──────────────────────────────────────────────────────────

class ViolationDetail(BaseModel):
    policy_id: str
    reason:    str
    severity:  str


class EnforceResponse(BaseModel):
    """
    Soham — check result["allowed"]:
      True  → call Alpaca paper API
      False → abort, log the block reason
    """
    decision:         str
    allowed:          bool
    primary_reason:   str
    blocking_policy:  Optional[str]
    violations:       list[ViolationDetail]
    policies_checked: list[str]
    timestamp:        str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", response_model=EnforceResponse, summary="Validate an agent action proposal")
async def enforce(request: ActionRequest):
    """
    Main enforcement endpoint.
    Send agent's action proposal → get ALLOW or BLOCK back.
    No human in the loop. Deterministic every time.
    """
    try:
        result = _engine.evaluate_from_dict(request.dict())
        data   = result.to_dict()
        return EnforceResponse(
            decision=data["decision"],
            allowed=data["allowed"],
            primary_reason=data["primary_reason"],
            blocking_policy=data["blocking_policy"],
            violations=[ViolationDetail(**v) for v in data["violations"]],
            policies_checked=data["policies_checked"],
            timestamp=data["timestamp"],
        )
    except Exception as e:
        logger.error(f"Policy engine error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload", summary="Hot-reload policy manifest without restart")
async def reload_policies():
    """Edit manifest.yaml → call this → new rules active immediately."""
    try:
        _engine.reload()
        return {"status": "reloaded", "policies_loaded": len(_engine.policies)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/policies", summary="List all active policies")
async def list_policies():
    """Osin can call this to show active policies on the dashboard."""
    return {
        "count": len(_engine.policies),
        "policies": [
            {
                "id": p["id"],
                "description": p.get("description", ""),
                "severity": p["on_violation"].get("severity", "HIGH"),
            }
            for p in _engine.policies
        ]
    }