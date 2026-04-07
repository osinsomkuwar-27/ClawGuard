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
import copy

logger = logging.getLogger("armorclaw.api")

router  = APIRouter(prefix="/enforce", tags=["enforcement"])
_engine = PolicyEngine()
_all_policies = copy.deepcopy(_engine.policies)
_disabled_policy_ids: set[str] = set()


def _apply_policy_overrides():
    _engine.policies = [
        copy.deepcopy(policy)
        for policy in _all_policies
        if policy["id"] not in _disabled_policy_ids
    ]


def _humanize_policy_id(policy_id: str) -> str:
    return policy_id.replace("_", " ").title()


def _classify_policy(policy: dict) -> str:
    rule = policy.get("rule", {})
    rule_type = rule.get("type", "")
    field_name = rule.get("field", "")

    if rule_type == "trading_hours":
        return "Time-based"
    if field_name == "portfolio_exposure_pct":
        return "Position size"
    if field_name == "total_usd":
        return "Value limits"
    if field_name in {"ticker", "action", "environment"}:
        return "Symbol rules"
    return "All"


def _describe_rule(policy: dict) -> str:
    rule = policy.get("rule", {})
    rule_type = rule.get("type", "")

    if rule_type == "threshold":
        operator = rule.get("operator", "lte")
        value = rule.get("value", "")
        field_name = rule.get("field", "value")
        return f"{field_name} {operator} {value}"
    if rule_type == "whitelist":
        return f"allow only {', '.join(rule.get('allowed', []))}"
    if rule_type == "blacklist":
        return f"block {', '.join(rule.get('blocked', []))}"
    if rule_type == "trading_hours":
        return f"{rule.get('start', '09:30')} to {rule.get('end', '16:00')} {rule.get('timezone', 'ET')}"
    if rule_type == "scope_check":
        return f"scope in {', '.join(rule.get('must_be_subset_of', []))}"
    if rule_type == "rationale_required":
        return f"minimum {rule.get('min_words', 0)} rationale words"
    return rule_type or "custom rule"


def _serialize_policy(policy: dict) -> dict:
    enabled = policy["id"] not in _disabled_policy_ids
    return {
        "id": policy["id"],
        "name": _humanize_policy_id(policy["id"]),
        "title": _humanize_policy_id(policy["id"]),
        "description": policy.get("description", ""),
        "severity": policy.get("on_violation", {}).get("severity", "HIGH"),
        "active": enabled,
        "enabled": enabled,
        "type": _classify_policy(policy),
        "rule": _describe_rule(policy),
        "appliesTo": ", ".join(policy.get("applies_to", [])),
        "conflict": False,
    }


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
        global _all_policies
        _engine.reload()
        _all_policies = copy.deepcopy(_engine.policies)
        _apply_policy_overrides()
        return {"status": "reloaded", "policies_loaded": len(_engine.policies)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/policies", summary="List all active policies")
async def list_policies():
    """Osin can call this to show active policies on the dashboard."""
    return {
        "count": len(_all_policies),
        "enabled_count": len(_engine.policies),
        "policies": [_serialize_policy(policy) for policy in _all_policies],
    }


@router.post("/policies/{policy_id}/toggle", summary="Enable or disable a policy")
async def toggle_policy(policy_id: str):
    policy = next((item for item in _all_policies if item["id"] == policy_id), None)
    if policy is None:
        raise HTTPException(status_code=404, detail=f"Unknown policy: {policy_id}")

    if policy_id in _disabled_policy_ids:
        _disabled_policy_ids.remove(policy_id)
    else:
        _disabled_policy_ids.add(policy_id)

    _apply_policy_overrides()
    return {
        "status": "updated",
        "enabled": policy_id not in _disabled_policy_ids,
        "policy": _serialize_policy(policy),
    }
