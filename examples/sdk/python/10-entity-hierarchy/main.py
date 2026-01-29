"""
Example 10: Entity Hierarchy with Enforced Policies

This example demonstrates how organizations, departments, and teams
can use a2p entity profiles with hierarchical policy enforcement.
"""

import asyncio
import json
from typing import Any, Optional
from dataclasses import dataclass


@dataclass
class EnforcedRule:
    id: str
    path: str
    value: Any
    enforcement: str  # 'locked' | 'min' | 'max' | 'subset' | 'additive' | 'narrowable' | 'overridable'
    reason: str


@dataclass
class EntityProfile:
    id: str
    profile_type: str
    display_name: str
    entity_type: str
    description: Optional[str]
    parent: Optional[str]
    children: list[str]
    inherit_policies: bool
    depth: int
    enforced_rules: list[EnforcedRule]
    policies: dict[str, Any]
    direct_members: list[str]
    admins: list[str]


@dataclass
class EffectivePolicy:
    value: Any
    source: str
    enforcement: str
    locked: bool


# Simulated entity storage
entities: dict[str, EntityProfile] = {}


def compute_effective_policies(entity_id: str) -> dict[str, EffectivePolicy]:
    result = {}
    ancestry = get_ancestry(entity_id)

    # Process from root to leaf
    for ancestor_id in reversed(ancestry):
        entity = entities.get(ancestor_id)
        if not entity or not entity.enforced_rules:
            continue

        for rule in entity.enforced_rules:
            result[rule.path] = EffectivePolicy(
                value=rule.value,
                source=entity.display_name,
                enforcement=rule.enforcement,
                locked=rule.enforcement == "locked",
            )

    return result


def get_ancestry(entity_id: str) -> list[str]:
    result = [entity_id]
    current = entities.get(entity_id)

    while current and current.parent:
        result.append(current.parent)
        current = entities.get(current.parent)

    return result


def validate_policy_change(
    entity_id: str,
    path: str,
    new_value: Any
) -> dict[str, Any]:
    ancestry = get_ancestry(entity_id)

    for ancestor_id in ancestry:
        if ancestor_id == entity_id:
            continue  # Skip self

        entity = entities.get(ancestor_id)
        if not entity or not entity.enforced_rules:
            continue

        for rule in entity.enforced_rules:
            if rule.path != path:
                continue

            if rule.enforcement == "locked":
                if new_value != rule.value:
                    return {
                        "allowed": False,
                        "reason": f'"{path}" is locked by {entity.display_name}: {rule.reason}',
                    }

            elif rule.enforcement == "min":
                if isinstance(new_value, (int, float)) and new_value < rule.value:
                    return {
                        "allowed": False,
                        "reason": f'"{path}" minimum is {rule.value} (set by {entity.display_name})',
                    }

            elif rule.enforcement == "max":
                if isinstance(new_value, (int, float)) and new_value > rule.value:
                    return {
                        "allowed": False,
                        "reason": f'"{path}" maximum is {rule.value} (set by {entity.display_name})',
                    }

            elif rule.enforcement == "subset":
                if isinstance(new_value, list) and isinstance(rule.value, list):
                    parent_set = set(rule.value)
                    invalid_items = [v for v in new_value if v not in parent_set]
                    if invalid_items:
                        return {
                            "allowed": False,
                            "reason": f'"{path}" must be subset of {json.dumps(rule.value)}. Invalid: {", ".join(invalid_items)}',
                        }

    return {"allowed": True}


async def main():
    print("🚀 a2p Example: Entity Hierarchy with Enforced Policies\n")
    print("═══════════════════════════════════════════════════════════\n")

    # ============================================
    # 1. Create Organization (Top Level)
    # ============================================
    print("🏢 Step 1: Creating ACME Corporation (organization)...\n")

    acme_corp = EntityProfile(
        id="did:a2p:entity:local:local:local:acme-corp",
        profile_type="entity",
        display_name="ACME Corporation",
        entity_type="organization",
        description="Global technology company",
        parent=None,
        children=["did:a2p:entity:local:local:acme-engineering", "did:a2p:entity:local:local:acme-sales"],
        inherit_policies=False,
        depth=0,
        enforced_rules=[
            EnforcedRule("gdpr-compliance", "policies.compliance.gdpr", True, "locked", "Legal requirement for EU operations"),
            EnforcedRule("data-residency", "policies.data.residency", ["EU"], "locked", "Corporate data sovereignty policy"),
            EnforcedRule("max-retention", "policies.data.retention.maxMonths", 36, "max", "GDPR data minimization"),
            EnforcedRule("min-encryption", "policies.security.encryption.minBits", 256, "min", "Security baseline"),
            EnforcedRule("allowed-ai-models", "policies.ai.allowedModels", ["gpt-4", "claude-3", "gemini-pro"], "subset", "Only security-vetted models"),
            EnforcedRule("ai-blocklist", "policies.ai.blockedModels", ["legacy-gpt-*"], "additive", "Security team blocklist"),
        ],
        policies={
            "compliance": {"gdpr": True, "ccpa": True},
            "data": {"residency": ["EU"], "retention": {"maxMonths": 36}},
            "security": {"encryption": {"minBits": 256}, "mfaRequired": True},
            "ai": {"allowedModels": ["gpt-4", "claude-3", "gemini-pro"], "blockedModels": ["legacy-gpt-*"]},
        },
        direct_members=[],
        admins=["did:a2p:user:local:local:ceo"],
    )

    entities[acme_corp.id] = acme_corp
    print(f"   ✅ Created: {acme_corp.display_name}")
    print("   📋 Enforced policies:")
    for rule in acme_corp.enforced_rules:
        print(f"      • {rule.path} = {json.dumps(rule.value)} [{rule.enforcement}]")
    print()

    # ============================================
    # 2. Create Engineering Department
    # ============================================
    print("🔧 Step 2: Creating Engineering Department...\n")

    engineering = EntityProfile(
        id="did:a2p:entity:local:local:acme-engineering",
        profile_type="entity",
        display_name="Engineering",
        entity_type="department",
        description="Product and platform engineering",
        parent="did:a2p:entity:local:local:acme-corp",
        children=["did:a2p:entity:local:local:acme-ml-team", "did:a2p:entity:local:local:acme-platform-team"],
        inherit_policies=True,
        depth=1,
        enforced_rules=[
            EnforcedRule("code-review", "policies.development.codeReview", True, "locked", "Engineering quality standard"),
            EnforcedRule("ci-required", "policies.development.ciRequired", True, "locked", "Continuous integration mandatory"),
        ],
        policies={
            "development": {"codeReview": True, "ciRequired": True},
            "tools": {"ide": "vscode", "vcs": "git"},
        },
        direct_members=[],
        admins=["did:a2p:user:local:local:vp-engineering"],
    )

    entities[engineering.id] = engineering
    print(f"   ✅ Created: {engineering.display_name}")
    print(f"   📎 Parent: {engineering.parent}")
    print("   📋 Additional enforced policies:")
    for rule in engineering.enforced_rules:
        print(f"      • {rule.path} = {json.dumps(rule.value)} [{rule.enforcement}]")
    print()

    # ============================================
    # 3. Create ML Team
    # ============================================
    print("🤖 Step 3: Creating ML Team...\n")

    ml_team = EntityProfile(
        id="did:a2p:entity:local:local:acme-ml-team",
        profile_type="entity",
        display_name="ML Team",
        entity_type="team",
        description="Machine learning and AI research",
        parent="did:a2p:entity:local:local:acme-engineering",
        children=[],
        inherit_policies=True,
        depth=2,
        enforced_rules=[
            EnforcedRule("experiment-tracking", "policies.ml.experimentTracking", True, "locked", "ML reproducibility requirement"),
        ],
        policies={
            # Narrowing the AI models (valid: subset of parent's list)
            "ai": {"allowedModels": ["claude-3"]},
            "ml": {"experimentTracking": True, "gpuAccess": True},
            "tools": {"ide": "vscode", "notebooks": "jupyter"},
        },
        direct_members=["did:a2p:user:local:local:alice", "did:a2p:user:local:local:bob"],
        admins=["did:a2p:user:local:local:alice"],
    )

    entities[ml_team.id] = ml_team
    print(f"   ✅ Created: {ml_team.display_name}")
    print(f"   📎 Parent: {ml_team.parent}")
    print(f"   👥 Members: {', '.join(ml_team.direct_members)}")
    print("   📋 Team policies:")
    print(f"      • AI models narrowed to: {json.dumps(ml_team.policies.get('ai'))}")
    print()

    # ============================================
    # 4. Compute Effective Policies for ML Team
    # ============================================
    print("📊 Step 4: Computing effective policies for ML Team...\n")

    effective_policies = compute_effective_policies(ml_team.id)

    print("   🔒 Effective policies (inherited + local):")
    for path, policy in effective_policies.items():
        lock_icon = "🔐" if policy.locked else "📝"
        print(f"      {lock_icon} {path}")
        print(f"         Value: {json.dumps(policy.value)}")
        print(f"         Source: {policy.source} [{policy.enforcement}]")
    print()

    # ============================================
    # 5. Validate Policy Changes
    # ============================================
    print("🔍 Step 5: Validating policy change attempts...\n")

    # Attempt 1: Try to disable GDPR (should fail - locked)
    print("   Attempt: ML Team tries to disable GDPR compliance")
    gdpr_result = validate_policy_change(ml_team.id, "policies.compliance.gdpr", False)
    print(f"   Result: {'✅ Allowed' if gdpr_result['allowed'] else '❌ Blocked'}")
    if not gdpr_result["allowed"]:
        print(f"   Reason: {gdpr_result['reason']}")
    print()

    # Attempt 2: Try to reduce encryption to 128 bits (should fail - min is 256)
    print("   Attempt: ML Team tries to set encryption to 128 bits")
    encryption_result = validate_policy_change(ml_team.id, "policies.security.encryption.minBits", 128)
    print(f"   Result: {'✅ Allowed' if encryption_result['allowed'] else '❌ Blocked'}")
    if not encryption_result["allowed"]:
        print(f"   Reason: {encryption_result['reason']}")
    print()

    # Attempt 3: Try to increase encryption to 512 bits (should work - above min)
    print("   Attempt: ML Team tries to set encryption to 512 bits")
    encryption512_result = validate_policy_change(ml_team.id, "policies.security.encryption.minBits", 512)
    print(f"   Result: {'✅ Allowed' if encryption512_result['allowed'] else '❌ Blocked'}")
    print()

    # Attempt 4: Try to use an unapproved AI model (should fail - not in subset)
    print('   Attempt: ML Team tries to add "llama-2" to allowed models')
    model_result = validate_policy_change(ml_team.id, "policies.ai.allowedModels", ["claude-3", "llama-2"])
    print(f"   Result: {'✅ Allowed' if model_result['allowed'] else '❌ Blocked'}")
    if not model_result["allowed"]:
        print(f"   Reason: {model_result['reason']}")
    print()

    # Attempt 5: Try to reduce allowed models (should work - valid subset)
    print('   Attempt: ML Team narrows allowed models to just "claude-3"')
    narrow_result = validate_policy_change(ml_team.id, "policies.ai.allowedModels", ["claude-3"])
    print(f"   Result: {'✅ Allowed' if narrow_result['allowed'] else '❌ Blocked'}")
    print()

    # ============================================
    # 6. User's Effective Policies
    # ============================================
    print("👤 Step 6: Computing Alice's effective policies...\n")

    print("   Alice is a member of ML Team, which inherits from:")
    print("   └── Engineering (department)")
    print("       └── ACME Corp (organization)\n")

    print("   Alice's effective policies:")
    print("   ┌─────────────────────────────────────────────────────────┐")
    print("   │ 🔐 GDPR Compliance: true (from ACME Corp, locked)       │")
    print("   │ 🔐 Data Residency: EU (from ACME Corp, locked)          │")
    print("   │ 🔐 Max Retention: 36 months (from ACME Corp, max)       │")
    print("   │ 🔐 Min Encryption: 256 bits (from ACME Corp, min)       │")
    print("   │ 🔐 Code Review: required (from Engineering, locked)     │")
    print("   │ 🔐 CI Required: true (from Engineering, locked)         │")
    print('   │ 📝 Allowed AI Models: ["claude-3"] (from ML Team)       │')
    print("   │ 🔐 Experiment Tracking: true (from ML Team, locked)     │")
    print("   └─────────────────────────────────────────────────────────┘\n")

    # ============================================
    # 7. Entity Visualization
    # ============================================
    print("🌳 Step 7: Entity Hierarchy Visualization\n")

    print("   ┌─────────────────────────────────────────────────────────────┐")
    print("   │                     ACME CORPORATION                        │")
    print("   │        entityType: organization | depth: 0                  │")
    print("   │   ENFORCES: gdpr, dataResidency, retention, encryption      │")
    print("   └─────────────────────────────────┬───────────────────────────┘")
    print("                                     │")
    print("           ┌─────────────────────────┴─────────────────────┐")
    print("           │                                               │")
    print("   ┌───────▼───────┐                             ┌─────────▼─────────┐")
    print("   │  ENGINEERING  │                             │      SALES        │")
    print("   │   department  │                             │    department     │")
    print("   │ +codeReview   │                             │                   │")
    print("   │ +ciRequired   │                             │                   │")
    print("   └───────┬───────┘                             └───────────────────┘")
    print("           │")
    print("   ┌───────┴───────┐")
    print("   │               │")
    print("┌──▼──┐        ┌───▼────┐")
    print("│ ML  │        │Platform│")
    print("│Team │        │ Team   │")
    print("│     │        │        │")
    print("│Alice│        │  Bob   │")
    print("│ Bob │        │        │")
    print("└─────┘        └────────┘")
    print()

    # ============================================
    # Summary
    # ============================================
    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Example Complete!")
    print("═══════════════════════════════════════════════════════════\n")
    print("   Key takeaways:\n")
    print("   1. Entities form hierarchies (org → dept → team → user)")
    print("   2. Enforced policies flow down and cannot be overridden")
    print("   3. Different enforcement types: locked, min, max, subset, additive")
    print("   4. Users inherit effective policies from their entity chain")
    print("   5. Policy validation prevents unauthorized changes")
    print("   6. Flexible entity types: organization, department, team, project, etc.\n")


if __name__ == "__main__":
    asyncio.run(main())
