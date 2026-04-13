/**
 * a2p SDK - Agent 2 Profile Protocol
 *
 * TypeScript SDK for the a2p protocol, enabling user-owned profiles
 * for AI agent interactions.
 *
 * @packageDocumentation
 */

import pkg from '../package.json';

// ============================================================================
// Client Exports
// ============================================================================

export {
  A2PClient,
  A2PUserClient,
  createAgentClient,
  createUserClient,
  MemoryStorage,
  type ProfileStorage,
} from './client';

// ============================================================================
// Core Functionality
// ============================================================================

// Profile management
export {
  createProfile,
  updateIdentity,
  updatePreferences,
  addMemory,
  updateMemory,
  removeMemory,
  archiveMemory,
  addSubProfile,
  updateSubProfile,
  removeSubProfile,
  addPolicy,
  updatePolicy,
  removePolicy,
  getFilteredProfile,
  validateProfile,
  exportProfile,
  importProfile,
  type CreateProfileOptions,
} from './core/profile';

// Proposal management
export {
  createProposal,
  addProposal,
  approveProposal,
  rejectProposal,
  withdrawProposal,
  getPendingProposals,
  getProposalsByAgent,
  expireProposals,
  cleanupResolvedProposals,
  findSimilarMemories,
  type CreateProposalOptions,
} from './core/proposal';

// Consent management
export {
  evaluateAccess,
  createConsentReceipt,
  isConsentValid,
  revokeConsent,
  createDefaultPolicy,
  createCategoryPolicy,
  getMatchingPolicies,
  hasPermission,
  mergePermissions,
} from './core/consent';

// ============================================================================
// Utilities
// ============================================================================

// ID generation and validation
export {
  generateMemoryId,
  generateProposalId,
  generatePolicyId,
  generateReceiptId,
  generateSessionId,
  generateRequestId,
  generateUserDid,
  generateAgentDid,
  generateOrgDid,
  isValidDid,
  isValidA2pDid,
  isValidAgentDid,
  isValidUserDid,
  validateAgentDid,
  parseDid,
  type ValidationError,
} from './utils/id';

// Scope utilities
export {
  scopeMatches,
  anyScopeMatches,
  filterScopes,
  parseScope,
  buildScope,
  getParentScopes,
  getScopeSensitivity,
  STANDARD_SCOPES,
  SCOPE_SENSITIVITY,
} from './utils/scope';

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Core types
  ProfileType,
  MemorySourceType,
  MemoryStatus,
  SensitivityLevel,
  PermissionLevel,
  ProposalStatus,
  ProposalAction,
  DID,

  // Identity
  PublicKey,
  Identity,

  // Preferences
  CommunicationPreferences,
  ContentPreferences,
  CommonPreferences,
  Common,

  // Accessibility
  ColorVisionType,
  VisionAccessibility,
  HearingAccessibility,
  MotorAccessibility,
  CognitiveAccessibility,
  SensoryAccessibility,
  MobilityAccessibility,
  ServiceAnimal,
  MedicalDevices,
  Allergies,
  DietaryRequirements,
  SpecialAssistance,
  EmergencyInfo,
  PhysicalAccessibility,
  AssistiveTechnology,
  AccessibilityPreferences,

  // Guardianship
  AgeContext,
  Guardian,
  ContentSafety,
  Guardianship,

  // Memory categories
  CategoryIdentity,
  CategoryPreferences,
  CategoryProfessional,
  CategoryInterests,
  CategoryContext,
  CategoryHealth,
  CategoryRelationships,

  // Memories
  MemorySource,
  MemoryMetadata,
  Memory,
  Memories,

  // Sub-profiles
  SubProfile,

  // Consent
  PolicyConditions,
  ConsentPolicy,
  ConsentProof,
  ConsentReceipt,

  // Proposals
  ProposalEvidence,
  ProposedMemory,
  ProposalResolution,
  Proposal,

  // Settings
  MemorySettings,
  NotificationSettings,
  PrivacySettings,
  ProfileSettings,

  // Profile
  Profile,

  // Agent profile
  AgentOperator,
  AgentA2PSupport,
  AgentTrustMetrics,
  AgentCapabilities,
  AgentIdentity,
  AgentProfile,

  // API types
  ApiResponse,
  ProfileAccessRequest,
  ProfileAccessResponse,
  MemoryProposalRequest,
  MemoryProposalResponse,

  // Configuration
  StorageConfig,
  A2PClientConfig,
  A2PUserConfig,
} from './types';

// ============================================================================
// Version
// ============================================================================

export const VERSION = pkg.version;
export const PROTOCOL_VERSION = pkg.version;
