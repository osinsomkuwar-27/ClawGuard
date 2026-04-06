"""
ArmorClaw Policy Engine — v3.1 (FIXED)
================================
Author: Shreeja (Policy Engine)

Changes from v3.0:
- FIXED: scope_check now correctly blocks invalid scopes like 'trade_live'
- FIXED: UTF-8 encoding issue with em dash in rationale_required reason
- Added debug logging for scope_check
"""

import yaml
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional
from enum import Enum
from datetime import datetime, timezone
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("armorclaw.policy_engine")


# --- Data Models -------------------------------------------------------------

class Decision(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"

class Severity(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class ActionProposal:
    action:             str
    ticker:             str   = ""
    quantity:           int   = 0
    price_per_unit:     float = 0.0
    total_usd:          float = 0.0
    rationale:          str   = ""
    context:            str   = ""

    portfolio_value:        float = 10000.0
    current_holding_usd:    float = 0.0

    environment:      str = "paper"
    requested_scope:  str = "trade_paper"
    agent_id:         str = "agent-01"
    session_id:       str = ""

    portfolio_exposure_pct: float = field(init=False, default=0.0)

    def __post_init__(self):
        self.action = self.action.upper()
        self.ticker = self.ticker.upper()

        if self.total_usd == 0.0 and self.quantity > 0 and self.price_per_unit > 0:
            self.total_usd = round(self.quantity * self.price_per_unit, 2)

        if self.portfolio_value > 0:
            new_holding = self.current_holding_usd + self.total_usd
            self.portfolio_exposure_pct = round((new_holding / self.portfolio_value) * 100, 2)

    @classmethod
    def from_dict(cls, data: dict) -> "ActionProposal":
        return cls(
            action=data.get("action", "").upper(),
            ticker=data.get("ticker", data.get("stock", "")).upper(),
            quantity=int(data.get("quantity", data.get("amount", 0))),
            price_per_unit=float(data.get("price_per_unit", 0.0)),
            total_usd=float(data.get("total_usd", data.get("estimated_value", 0.0))),
            rationale=data.get("rationale", data.get("reasoning", "")),
            context=data.get("context", ""),
            portfolio_value=float(data.get("portfolio_value", 10000.0)),
            current_holding_usd=float(data.get("current_holding_usd", 0.0)),
            environment=data.get("environment", "paper"),
            requested_scope=data.get("requested_scope", "trade_paper"),  # FIX: reads correctly now
            agent_id=data.get("agent_id", "agent-01"),
            session_id=data.get("session_id", ""),
        )


@dataclass
class PolicyViolation:
    policy_id:   str
    description: str
    reason:      str
    severity:    Severity


@dataclass
class EnforcementResult:
    decision:         Decision
    proposal:         ActionProposal
    violations:       list[PolicyViolation] = field(default_factory=list)
    policies_checked: list[str]             = field(default_factory=list)
    timestamp:        str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def allowed(self) -> bool:
        return self.decision == Decision.ALLOW

    @property
    def primary_reason(self) -> str:
        if self.allowed:
            return f"All {len(self.policies_checked)} policies passed."
        return self.violations[0].reason if self.violations else "Unknown violation."

    @property
    def blocking_policy(self) -> Optional[str]:
        return self.violations[0].policy_id if self.violations else None

    def to_dict(self) -> dict:
        return {
            "decision": self.decision.value,
            "allowed": self.allowed,
            "primary_reason": self.primary_reason,
            "blocking_policy": self.blocking_policy,
            "violations": [
                {
                    "policy_id": v.policy_id,
                    "reason": v.reason,
                    "severity": v.severity.value,
                }
                for v in self.violations
            ],
            "policies_checked": self.policies_checked,
            "proposal": asdict(self.proposal),
            "timestamp": self.timestamp,
        }

    def to_log_line(self) -> str:
        symbol = "ALLOW" if self.allowed else "BLOCK"
        policy = f"policy:{self.blocking_policy}" if self.blocking_policy else f"passed:{len(self.policies_checked)}"
        return (
            f"[{self.timestamp}] {symbol} | "
            f"{self.proposal.action} {self.proposal.ticker} "
            f"qty={self.proposal.quantity} ${self.proposal.total_usd} | "
            f"{policy} | {self.primary_reason}"
        )


# --- Rule Evaluators ---------------------------------------------------------

def _get_field_value(proposal: ActionProposal, field_name: str):
    return getattr(proposal, field_name, None)


def _check_trading_hours(rule: dict, proposal: ActionProposal) -> tuple[bool, str]:
    try:
        import pytz
        et = pytz.timezone(rule.get("timezone", "US/Eastern"))
        now_et = datetime.now(et)
    except ImportError:
        from datetime import timedelta
        now_et = datetime.now(timezone.utc) - timedelta(hours=5)

    current_time = now_et.strftime("%H:%M")
    start = rule.get("start", "09:30")
    end   = rule.get("end",   "16:00")

    in_hours = start <= current_time <= end
    detail = f"current ET time={current_time}, allowed={start}-{end}"
    return in_hours, detail


def _evaluate_rule(rule: dict, proposal: ActionProposal) -> tuple[bool, str]:
    rule_type  = rule["type"]
    field_name = rule.get("field", "")

    skip_actions = rule.get("skip_if_action", [])
    if proposal.action in [a.upper() for a in skip_actions]:
        return True, f"skipped for action={proposal.action}"

    value = _get_field_value(proposal, field_name)

    if rule_type == "whitelist":
        allowed = [str(x).upper() for x in rule["allowed"]]
        passed  = str(value).upper() in allowed
        return passed, f"{field_name}='{value}' vs whitelist={allowed}"

    elif rule_type == "blacklist":
        blocked = [str(x).upper() for x in rule["blocked"]]
        field_val = str(value).upper()
        passed = not any(b in field_val for b in blocked)
        return passed, f"{field_name}='{value}' vs blacklist={blocked}"

    elif rule_type == "threshold":
        threshold = rule["value"]
        operator  = rule["operator"]
        if value is None or value == 0.0:
            return True, f"{field_name} is 0 - threshold skipped"
        ops = {
            "lte": lambda a, b: a <= b,
            "gte": lambda a, b: a >= b,
            "lt":  lambda a, b: a <  b,
            "gt":  lambda a, b: a >  b,
            "eq":  lambda a, b: a == b,
        }
        op_fn  = ops.get(operator, lambda a, b: True)
        passed = op_fn(float(value), float(threshold))
        return passed, f"{field_name}={value} {operator} {threshold}"

    elif rule_type == "trading_hours":
        return _check_trading_hours(rule, proposal)

    elif rule_type == "scope_check":
        # FIX: strip whitespace and normalize case properly
        allowed_scopes = set(s.strip().lower() for s in rule["must_be_subset_of"])
        requested      = str(value).strip().lower()
        passed         = requested in allowed_scopes
        logger.info(f"scope_check: requested='{requested}', allowed={allowed_scopes}, passed={passed}")
        return passed, f"requested_scope='{requested}' vs allowed={allowed_scopes}"

    elif rule_type == "rationale_required":
        min_words = rule.get("min_words", 3)
        rationale = str(proposal.rationale).strip()
        word_count = len(rationale.split()) if rationale else 0
        passed = word_count >= min_words
        return passed, f"rationale word_count={word_count}, required>={min_words}"

    else:
        logger.warning(f"Unknown rule type: {rule_type}")
        return True, f"Unknown rule type '{rule_type}' - skipped"


def _format_reason(template: str, proposal: ActionProposal) -> str:
    try:
        return template.format(**asdict(proposal))
    except KeyError:
        return template


# --- Policy Engine -----------------------------------------------------------

class PolicyEngine:
    def __init__(self, manifest_path: str = None):
        if manifest_path is None:
            manifest_path = Path(__file__).parent / "policies" / "manifest.yaml"
        self.manifest_path = Path(manifest_path)
        self.policies = []
        self._load_manifest()

    def _load_manifest(self):
        if not self.manifest_path.exists():
            raise FileNotFoundError(f"Policy manifest not found: {self.manifest_path}")
        with open(self.manifest_path, encoding="utf-8") as f:  # FIX: explicit UTF-8 encoding
            manifest = yaml.safe_load(f)
        self.policies = manifest.get("policies", [])
        logger.info(
            f"ArmorClaw loaded {len(self.policies)} policies "
            f"from manifest v{manifest.get('version', '?')} "
            f"[{manifest.get('manifest_id', '?')}]"
        )

    def reload(self):
        logger.info("Hot-reloading policy manifest...")
        self._load_manifest()

    def evaluate(self, proposal: ActionProposal) -> EnforcementResult:
        logger.info(
            f"Evaluating: {proposal.action} {proposal.ticker} "
            f"qty={proposal.quantity} ${proposal.total_usd} "
            f"scope={proposal.requested_scope} "  # FIX: log scope for debugging
            f"exposure={proposal.portfolio_exposure_pct}%"
        )

        violations:       list[PolicyViolation] = []
        policies_checked: list[str]             = []

        for policy in self.policies:
            policy_id    = policy["id"]
            rule         = policy["rule"]
            on_violation = policy["on_violation"]

            policies_checked.append(policy_id)
            passed, debug = _evaluate_rule(rule, proposal)

            if passed:
                logger.debug(f"  PASS {policy_id}: {debug}")
            else:
                reason   = _format_reason(on_violation["reason"], proposal)
                severity = Severity(on_violation.get("severity", "HIGH"))
                logger.warning(f"  FAIL {policy_id}: {debug} -> VIOLATION ({severity.value})")
                violations.append(PolicyViolation(
                    policy_id=policy_id,
                    description=policy.get("description", ""),
                    reason=reason,
                    severity=severity,
                ))
                break  # fail-fast

        decision = Decision.ALLOW if not violations else Decision.BLOCK
        result   = EnforcementResult(
            decision=decision,
            proposal=proposal,
            violations=violations,
            policies_checked=policies_checked,
        )

        logger.info(result.to_log_line())
        return result

    def evaluate_from_dict(self, data: dict) -> EnforcementResult:
        proposal = ActionProposal.from_dict(data)
        return self.evaluate(proposal)