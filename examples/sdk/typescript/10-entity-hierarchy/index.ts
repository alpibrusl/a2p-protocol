/**
 * Example 10: Entity Hierarchy with Enforced Policies
 *
 * This example demonstrates how organizations, departments, and teams
 * can use a2p entity profiles with hierarchical policy enforcement.
 */

// Note: This example uses conceptual types to demonstrate the entity model.
// The full SDK implementation would provide these types and functions.

interface EnforcedRule {
  id: string;
  path: string;
  value: unknown;
  enforcement: 'locked' | 'min' | 'max' | 'subset' | 'additive' | 'narrowable' | 'overridable';
  reason: string;
}

interface EntityProfile {
  id: string;
  profileType: 'entity';
  identity: {
    displayName: string;
    entityType: string;
    description?: string;
  };
  hierarchy: {
    parent: string | null;
    children: string[];
    inheritPolicies: boolean;
    depth: number;
  };
  enforcedPolicies?: {
    rules: EnforcedRule[];
  };
  policies: Record<string, unknown>;
  members: {
    direct: string[];
    admins: string[];
  };
}

interface EffectivePolicy {
  value: unknown;
  source: string;
  enforcement: string;
  locked: boolean;
}

// Simulated entity storage
const entities: Map<string, EntityProfile> = new Map();

async function main() {
  console.log('🚀 a2p Example: Entity Hierarchy with Enforced Policies\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================
  // 1. Create Organization (Top Level)
  // ============================================
  console.log('🏢 Step 1: Creating ACME Corporation (organization)...\n');

  const acmeCorp: EntityProfile = {
    id: 'did:a2p:entity:local:local:acme-corp',
    profileType: 'entity',
    identity: {
      displayName: 'ACME Corporation',
      entityType: 'organization',
      description: 'Global technology company',
    },
    hierarchy: {
      parent: null,
      children: ['did:a2p:entity:local:local:acme-engineering', 'did:a2p:entity:local:local:acme-sales'],
      inheritPolicies: false,
      depth: 0,
    },
    enforcedPolicies: {
      rules: [
        {
          id: 'gdpr-compliance',
          path: 'policies.compliance.gdpr',
          value: true,
          enforcement: 'locked',
          reason: 'Legal requirement for EU operations',
        },
        {
          id: 'data-residency',
          path: 'policies.data.residency',
          value: ['EU'],
          enforcement: 'locked',
          reason: 'Corporate data sovereignty policy',
        },
        {
          id: 'max-retention',
          path: 'policies.data.retention.maxMonths',
          value: 36,
          enforcement: 'max',
          reason: 'GDPR data minimization',
        },
        {
          id: 'min-encryption',
          path: 'policies.security.encryption.minBits',
          value: 256,
          enforcement: 'min',
          reason: 'Security baseline',
        },
        {
          id: 'allowed-ai-models',
          path: 'policies.ai.allowedModels',
          value: ['gpt-4', 'claude-3', 'gemini-pro'],
          enforcement: 'subset',
          reason: 'Only security-vetted models',
        },
        {
          id: 'ai-blocklist',
          path: 'policies.ai.blockedModels',
          value: ['legacy-gpt-*'],
          enforcement: 'additive',
          reason: 'Security team blocklist',
        },
      ],
    },
    policies: {
      compliance: { gdpr: true, ccpa: true },
      data: { residency: ['EU'], retention: { maxMonths: 36 } },
      security: { encryption: { minBits: 256 }, mfaRequired: true },
      ai: { allowedModels: ['gpt-4', 'claude-3', 'gemini-pro'], blockedModels: ['legacy-gpt-*'] },
    },
    members: {
      direct: [],
      admins: ['did:a2p:user:local:local:ceo'],
    },
  };

  entities.set(acmeCorp.id, acmeCorp);
  console.log(`   ✅ Created: ${acmeCorp.identity.displayName}`);
  console.log('   📋 Enforced policies:');
  for (const rule of acmeCorp.enforcedPolicies!.rules) {
    console.log(`      • ${rule.path} = ${JSON.stringify(rule.value)} [${rule.enforcement}]`);
  }
  console.log();

  // ============================================
  // 2. Create Engineering Department
  // ============================================
  console.log('🔧 Step 2: Creating Engineering Department...\n');

  const engineering: EntityProfile = {
    id: 'did:a2p:entity:local:local:acme-engineering',
    profileType: 'entity',
    identity: {
      displayName: 'Engineering',
      entityType: 'department',
      description: 'Product and platform engineering',
    },
    hierarchy: {
      parent: 'did:a2p:entity:local:local:acme-corp',
      children: ['did:a2p:entity:local:local:acme-ml-team', 'did:a2p:entity:local:local:acme-platform-team'],
      inheritPolicies: true,
      depth: 1,
    },
    enforcedPolicies: {
      rules: [
        {
          id: 'code-review',
          path: 'policies.development.codeReview',
          value: true,
          enforcement: 'locked',
          reason: 'Engineering quality standard',
        },
        {
          id: 'ci-required',
          path: 'policies.development.ciRequired',
          value: true,
          enforcement: 'locked',
          reason: 'Continuous integration mandatory',
        },
      ],
    },
    policies: {
      development: { codeReview: true, ciRequired: true },
      tools: { ide: 'vscode', vcs: 'git' },
    },
    members: {
      direct: [],
      admins: ['did:a2p:user:local:local:vp-engineering'],
    },
  };

  entities.set(engineering.id, engineering);
  console.log(`   ✅ Created: ${engineering.identity.displayName}`);
  console.log(`   📎 Parent: ${engineering.hierarchy.parent}`);
  console.log('   📋 Additional enforced policies:');
  for (const rule of engineering.enforcedPolicies!.rules) {
    console.log(`      • ${rule.path} = ${JSON.stringify(rule.value)} [${rule.enforcement}]`);
  }
  console.log();

  // ============================================
  // 3. Create ML Team
  // ============================================
  console.log('🤖 Step 3: Creating ML Team...\n');

  const mlTeam: EntityProfile = {
    id: 'did:a2p:entity:local:local:acme-ml-team',
    profileType: 'entity',
    identity: {
      displayName: 'ML Team',
      entityType: 'team',
      description: 'Machine learning and AI research',
    },
    hierarchy: {
      parent: 'did:a2p:entity:local:local:acme-engineering',
      children: [],
      inheritPolicies: true,
      depth: 2,
    },
    enforcedPolicies: {
      rules: [
        {
          id: 'experiment-tracking',
          path: 'policies.ml.experimentTracking',
          value: true,
          enforcement: 'locked',
          reason: 'ML reproducibility requirement',
        },
      ],
    },
    policies: {
      // Narrowing the AI models (valid: subset of parent's list)
      ai: { allowedModels: ['claude-3'] },
      ml: { experimentTracking: true, gpuAccess: true },
      tools: { ide: 'vscode', notebooks: 'jupyter' },
    },
    members: {
      direct: ['did:a2p:user:local:local:alice', 'did:a2p:user:local:local:bob'],
      admins: ['did:a2p:user:local:local:alice'],
    },
  };

  entities.set(mlTeam.id, mlTeam);
  console.log(`   ✅ Created: ${mlTeam.identity.displayName}`);
  console.log(`   📎 Parent: ${mlTeam.hierarchy.parent}`);
  console.log(`   👥 Members: ${mlTeam.members.direct.join(', ')}`);
  console.log('   📋 Team policies:');
  console.log(`      • AI models narrowed to: ${JSON.stringify(mlTeam.policies.ai)}`);
  console.log();

  // ============================================
  // 4. Compute Effective Policies for ML Team
  // ============================================
  console.log('📊 Step 4: Computing effective policies for ML Team...\n');

  const effectivePolicies = computeEffectivePolicies(mlTeam.id);

  console.log('   🔒 Effective policies (inherited + local):');
  for (const [path, policy] of Object.entries(effectivePolicies)) {
    const ep = policy as EffectivePolicy;
    const lockIcon = ep.locked ? '🔐' : '📝';
    console.log(`      ${lockIcon} ${path}`);
    console.log(`         Value: ${JSON.stringify(ep.value)}`);
    console.log(`         Source: ${ep.source} [${ep.enforcement}]`);
  }
  console.log();

  // ============================================
  // 5. Validate Policy Changes
  // ============================================
  console.log('🔍 Step 5: Validating policy change attempts...\n');

  // Attempt 1: Try to disable GDPR (should fail - locked)
  console.log('   Attempt: ML Team tries to disable GDPR compliance');
  const gdprResult = validatePolicyChange(mlTeam.id, 'policies.compliance.gdpr', false);
  console.log(`   Result: ${gdprResult.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  if (!gdprResult.allowed) {
    console.log(`   Reason: ${gdprResult.reason}`);
  }
  console.log();

  // Attempt 2: Try to reduce encryption to 128 bits (should fail - min is 256)
  console.log('   Attempt: ML Team tries to set encryption to 128 bits');
  const encryptionResult = validatePolicyChange(mlTeam.id, 'policies.security.encryption.minBits', 128);
  console.log(`   Result: ${encryptionResult.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  if (!encryptionResult.allowed) {
    console.log(`   Reason: ${encryptionResult.reason}`);
  }
  console.log();

  // Attempt 3: Try to increase encryption to 512 bits (should work - above min)
  console.log('   Attempt: ML Team tries to set encryption to 512 bits');
  const encryption512Result = validatePolicyChange(mlTeam.id, 'policies.security.encryption.minBits', 512);
  console.log(`   Result: ${encryption512Result.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  console.log();

  // Attempt 4: Try to use an unapproved AI model (should fail - not in subset)
  console.log('   Attempt: ML Team tries to add "llama-2" to allowed models');
  const modelResult = validatePolicyChange(mlTeam.id, 'policies.ai.allowedModels', ['claude-3', 'llama-2']);
  console.log(`   Result: ${modelResult.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  if (!modelResult.allowed) {
    console.log(`   Reason: ${modelResult.reason}`);
  }
  console.log();

  // Attempt 5: Try to reduce allowed models (should work - valid subset)
  console.log('   Attempt: ML Team narrows allowed models to just "claude-3"');
  const narrowResult = validatePolicyChange(mlTeam.id, 'policies.ai.allowedModels', ['claude-3']);
  console.log(`   Result: ${narrowResult.allowed ? '✅ Allowed' : '❌ Blocked'}`);
  console.log();

  // ============================================
  // 6. User's Effective Policies
  // ============================================
  console.log('👤 Step 6: Computing Alice\'s effective policies...\n');

  console.log('   Alice is a member of ML Team, which inherits from:');
  console.log('   └── Engineering (department)');
  console.log('       └── ACME Corp (organization)\n');

  console.log('   Alice\'s effective policies:');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ 🔐 GDPR Compliance: true (from ACME Corp, locked)       │');
  console.log('   │ 🔐 Data Residency: EU (from ACME Corp, locked)          │');
  console.log('   │ 🔐 Max Retention: 36 months (from ACME Corp, max)       │');
  console.log('   │ 🔐 Min Encryption: 256 bits (from ACME Corp, min)       │');
  console.log('   │ 🔐 Code Review: required (from Engineering, locked)     │');
  console.log('   │ 🔐 CI Required: true (from Engineering, locked)         │');
  console.log('   │ 📝 Allowed AI Models: ["claude-3"] (from ML Team)       │');
  console.log('   │ 🔐 Experiment Tracking: true (from ML Team, locked)     │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  // ============================================
  // 7. Entity Visualization
  // ============================================
  console.log('🌳 Step 7: Entity Hierarchy Visualization\n');

  console.log('   ┌─────────────────────────────────────────────────────────────┐');
  console.log('   │                     ACME CORPORATION                        │');
  console.log('   │        entityType: organization | depth: 0                  │');
  console.log('   │   ENFORCES: gdpr, dataResidency, retention, encryption      │');
  console.log('   └─────────────────────────────┬───────────────────────────────┘');
  console.log('                                 │');
  console.log('           ┌─────────────────────┴─────────────────────┐');
  console.log('           │                                           │');
  console.log('   ┌───────▼───────┐                         ┌─────────▼─────────┐');
  console.log('   │  ENGINEERING  │                         │      SALES        │');
  console.log('   │   department  │                         │    department     │');
  console.log('   │ +codeReview   │                         │                   │');
  console.log('   │ +ciRequired   │                         │                   │');
  console.log('   └───────┬───────┘                         └───────────────────┘');
  console.log('           │');
  console.log('   ┌───────┴───────┐');
  console.log('   │               │');
  console.log('┌──▼──┐        ┌───▼────┐');
  console.log('│ ML  │        │Platform│');
  console.log('│Team │        │ Team   │');
  console.log('│     │        │        │');
  console.log('│Alice│        │  Bob   │');
  console.log('│ Bob │        │        │');
  console.log('└─────┘        └────────┘');
  console.log();

  // ============================================
  // Summary
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    ✨ Example Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('   Key takeaways:\n');
  console.log('   1. Entities form hierarchies (org → dept → team → user)');
  console.log('   2. Enforced policies flow down and cannot be overridden');
  console.log('   3. Different enforcement types: locked, min, max, subset, additive');
  console.log('   4. Users inherit effective policies from their entity chain');
  console.log('   5. Policy validation prevents unauthorized changes');
  console.log('   6. Flexible entity types: organization, department, team, project, etc.\n');
}

// ============================================
// Helper Functions
// ============================================

function computeEffectivePolicies(entityId: string): Record<string, EffectivePolicy> {
  const result: Record<string, EffectivePolicy> = {};
  const ancestry = getAncestry(entityId);

  // Process from root to leaf
  for (const ancestorId of ancestry.reverse()) {
    const entity = entities.get(ancestorId);
    if (!entity?.enforcedPolicies) continue;

    for (const rule of entity.enforcedPolicies.rules) {
      result[rule.path] = {
        value: rule.value,
        source: entity.identity.displayName,
        enforcement: rule.enforcement,
        locked: rule.enforcement === 'locked',
      };
    }
  }

  return result;
}

function getAncestry(entityId: string): string[] {
  const result: string[] = [entityId];
  let current = entities.get(entityId);

  while (current?.hierarchy.parent) {
    result.push(current.hierarchy.parent);
    current = entities.get(current.hierarchy.parent);
  }

  return result;
}

function validatePolicyChange(
  entityId: string,
  path: string,
  newValue: unknown
): { allowed: boolean; reason?: string } {
  const ancestry = getAncestry(entityId);

  for (const ancestorId of ancestry) {
    if (ancestorId === entityId) continue; // Skip self

    const entity = entities.get(ancestorId);
    if (!entity?.enforcedPolicies) continue;

    for (const rule of entity.enforcedPolicies.rules) {
      if (rule.path !== path) continue;

      switch (rule.enforcement) {
        case 'locked':
          if (newValue !== rule.value) {
            return {
              allowed: false,
              reason: `"${path}" is locked by ${entity.identity.displayName}: ${rule.reason}`,
            };
          }
          break;

        case 'min':
          if (typeof newValue === 'number' && newValue < (rule.value as number)) {
            return {
              allowed: false,
              reason: `"${path}" minimum is ${rule.value} (set by ${entity.identity.displayName})`,
            };
          }
          break;

        case 'max':
          if (typeof newValue === 'number' && newValue > (rule.value as number)) {
            return {
              allowed: false,
              reason: `"${path}" maximum is ${rule.value} (set by ${entity.identity.displayName})`,
            };
          }
          break;

        case 'subset':
          if (Array.isArray(newValue) && Array.isArray(rule.value)) {
            const parentSet = new Set(rule.value as string[]);
            const invalidItems = (newValue as string[]).filter((v) => !parentSet.has(v));
            if (invalidItems.length > 0) {
              return {
                allowed: false,
                reason: `"${path}" must be subset of ${JSON.stringify(rule.value)}. Invalid: ${invalidItems.join(', ')}`,
              };
            }
          }
          break;
      }
    }
  }

  return { allowed: true };
}

main().catch(console.error);
