/**
 * a2p Protocol Type Definitions
 *
 * This module exports all TypeScript types for the a2p protocol.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Profile types supported by the protocol
 */
export type ProfileType = 'human' | 'agent' | 'entity';

/**
 * Memory source types
 */
export type MemorySourceType =
  | 'user_manual'
  | 'user_import'
  | 'agent_proposal'
  | 'agent_direct'
  | 'system_derived';

/**
 * Memory status values
 */
export type MemoryStatus = 'pending' | 'approved' | 'rejected' | 'archived' | 'expired';

/**
 * Sensitivity levels for memories
 */
export type SensitivityLevel = 'public' | 'standard' | 'sensitive' | 'restricted';

/**
 * Permission levels for consent
 */
export type PermissionLevel =
  | 'none'
  | 'read_public'
  | 'read_scoped'
  | 'read_full'
  | 'propose'
  | 'write';

/**
 * Proposal status values
 */
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'withdrawn';

/**
 * Proposal resolution actions
 */
export type ProposalAction =
  | 'approved'
  | 'approved_with_edits'
  | 'rejected'
  | 'expired'
  | 'withdrawn';

// ============================================================================
// Identity Types
// ============================================================================

/**
 * Decentralized Identifier (DID)
 */
export type DID = `did:${string}:${string}`;

/**
 * Public key information
 */
export interface PublicKey {
  id: string;
  type: 'Ed25519' | 'secp256k1' | 'P-256';
  publicKeyMultibase: string;
}

/**
 * Identity section of a profile
 */
export interface Identity {
  did: DID;
  displayName?: string;
  pronouns?: string;
  publicKeys?: PublicKey[];
  recoveryMethods?: string[];
  ageContext?: AgeContext;
}

// ============================================================================
// Preference Types
// ============================================================================

/**
 * Communication preferences
 */
export interface CommunicationPreferences {
  style?: 'concise' | 'detailed' | 'balanced';
  formality?: 'formal' | 'casual' | 'adaptive';
  humor?: boolean;
  verbosity?: string;
}

/**
 * Content preferences
 */
export interface ContentPreferences {
  format?: 'markdown' | 'plain' | 'rich';
  codeStyle?: 'commented' | 'minimal' | 'verbose';
  exampleLanguage?: string;
  language?: string;
}

/**
 * Color vision deficiency types
 */
export type ColorVisionType =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'protanomaly'
  | 'deuteranomaly'
  | 'tritanomaly';

/**
 * Vision accessibility preferences
 */
export interface VisionAccessibility {
  screenReader?: boolean;
  magnification?: number;
  highContrast?: 'none' | 'more' | 'less' | 'custom';
  reducedMotion?: boolean;
  colorVision?: {
    type?: ColorVisionType;
    severity?: 'none' | 'mild' | 'moderate' | 'severe';
  };
  prefersDarkMode?: boolean;
  fontSize?: 'default' | 'large' | 'larger' | 'largest';
  cursorSize?: 'default' | 'large' | 'larger';
}

/**
 * Hearing accessibility preferences
 */
export interface HearingAccessibility {
  deaf?: boolean;
  hardOfHearing?: boolean;
  prefersVisualAlerts?: boolean;
  captions?: {
    enabled?: boolean;
    style?: 'default' | 'large' | 'high-contrast';
    background?: 'none' | 'solid' | 'translucent';
  };
  signLanguage?: string;
  monoAudio?: boolean;
}

/**
 * Motor accessibility preferences
 */
export interface MotorAccessibility {
  reducedMotion?: boolean;
  keyboardOnly?: boolean;
  switchAccess?: boolean;
  voiceControl?: boolean;
  largeClickTargets?: boolean;
  extendedTimeouts?: boolean;
  stickyKeys?: boolean;
  dwellClick?: boolean;
  dwellTime?: number;
}

/**
 * Cognitive accessibility preferences
 */
export interface CognitiveAccessibility {
  simplifiedUI?: boolean;
  reducedAnimations?: boolean;
  readingAssistance?: {
    dyslexiaFont?: boolean;
    lineSpacing?: 'default' | 'wide' | 'wider';
    letterSpacing?: 'default' | 'wide' | 'wider';
    focusMode?: boolean;
    readingGuide?: boolean;
  };
  memoryAids?: boolean;
  clearNavigation?: boolean;
  plainLanguage?: boolean;
  contentWarnings?: boolean;
}

/**
 * Sensory accessibility preferences
 */
export interface SensoryAccessibility {
  reduceFlashing?: boolean;
  reduceAutoplay?: boolean;
  quietMode?: boolean;
  hapticFeedback?: boolean;
  reduceParallax?: boolean;
}

/**
 * Mobility accessibility (physical)
 */
export interface MobilityAccessibility {
  wheelchair?: boolean;
  wheelchairType?: 'manual' | 'electric' | 'scooter';
  walker?: boolean;
  crutches?: boolean;
  cane?: boolean;
  requiresAccessibleEntrance?: boolean;
  requiresElevator?: boolean;
  requiresAccessibleBathroom?: boolean;
  transferAssistance?: boolean;
}

/**
 * Service animal information
 */
export interface ServiceAnimal {
  has?: boolean;
  type?: 'guide_dog' | 'hearing_dog' | 'mobility_dog' | 'psychiatric_dog' | 'seizure_alert_dog' | 'other';
  name?: string;
  breed?: string;
}

/**
 * Medical devices information
 */
export interface MedicalDevices {
  pacemaker?: boolean;
  insulinPump?: boolean;
  oxygenSupply?: boolean;
  hearingAid?: boolean;
  cochlearImplant?: boolean;
  cpapMachine?: boolean;
  prosthetic?: boolean;
  other?: string[];
}

/**
 * Allergies information
 */
export interface Allergies {
  food?: string[];
  medication?: string[];
  environmental?: string[];
  severity?: Record<string, 'mild' | 'moderate' | 'severe' | 'anaphylactic'>;
  epiPenCarrier?: boolean;
}

/**
 * Dietary requirements
 */
export interface DietaryRequirements {
  restrictions?: Array<
    | 'vegetarian'
    | 'vegan'
    | 'pescatarian'
    | 'halal'
    | 'kosher'
    | 'hindu_vegetarian'
    | 'jain'
    | 'no_pork'
    | 'no_beef'
    | 'no_alcohol'
  >;
  intolerances?: string[];
  medicalDiets?: Array<
    | 'diabetic'
    | 'low_sodium'
    | 'low_fat'
    | 'renal'
    | 'cardiac'
    | 'low_fodmap'
    | 'ketogenic'
    | 'pureed'
    | 'liquid'
  >;
  preferences?: string[];
}

/**
 * Special assistance needs
 */
export interface SpecialAssistance {
  interpreter?: string;
  companion?: boolean;
  earlyBoarding?: boolean;
  extraTime?: boolean;
  preferredSeating?: 'aisle' | 'window' | 'front' | 'near_exit' | 'near_bathroom' | 'extra_legroom' | 'accessible';
  quietEnvironment?: boolean;
  writtenInstructions?: boolean;
}

/**
 * Emergency information
 */
export interface EmergencyInfo {
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  medicalConditions?: string[];
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  doNotResuscitate?: boolean;
}

/**
 * Physical accessibility needs
 */
export interface PhysicalAccessibility {
  mobility?: MobilityAccessibility;
  serviceAnimal?: ServiceAnimal;
  medicalDevices?: MedicalDevices;
  allergies?: Allergies;
  dietary?: DietaryRequirements;
  specialAssistance?: SpecialAssistance;
  emergencyInfo?: EmergencyInfo;
}

/**
 * Assistive technology information
 */
export interface AssistiveTechnology {
  screenReader?: string;
  brailleDisplay?: boolean;
  voiceControlSoftware?: string;
}

/**
 * Complete accessibility preferences
 */
export interface AccessibilityPreferences {
  vision?: VisionAccessibility;
  hearing?: HearingAccessibility;
  motor?: MotorAccessibility;
  cognitive?: CognitiveAccessibility;
  sensory?: SensoryAccessibility;
  physical?: PhysicalAccessibility;
  assistiveTechnology?: AssistiveTechnology;
}

/**
 * Common preferences shared across sub-profiles
 */
export interface CommonPreferences {
  language?: string;
  timezone?: string;
  communication?: CommunicationPreferences;
  content?: ContentPreferences;
  accessibility?: AccessibilityPreferences;
}

/**
 * Common section of a profile
 */
export interface Common {
  preferences?: CommonPreferences;
}

// ============================================================================
// Guardianship Types
// ============================================================================

/**
 * Age context for a profile
 */
export interface AgeContext {
  ageGroup?: 'adult' | 'minor' | 'child' | 'teen';
  ageRange?: string;
  jurisdiction?: string;
  digitalAgeOfConsent?: number;
  consentStatus?: 'self_consent' | 'parental_consent' | 'no_consent';
}

/**
 * Guardian information
 */
export interface Guardian {
  did: DID;
  relationship: 'parent' | 'legal_guardian' | 'custodian';
  permissions: Array<'manage_profile' | 'approve_proposals' | 'set_policies' | 'view_activity'>;
  consentGiven: string;
  expiresAt?: string;
}

/**
 * Content safety settings for children
 */
export interface ContentSafety {
  ageGroup?: 'toddler' | 'child' | 'preteen' | 'teen' | 'adult';
  maturityRating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'AO';
  filterExplicitContent?: boolean;
  filterViolence?: boolean;
  filterScaryContent?: boolean;
  safeSearch?: 'off' | 'moderate' | 'strict';
  chatRestrictions?: {
    allowStrangers?: boolean;
    moderatedChats?: boolean;
    predefinedPhrasesOnly?: boolean;
  };
  purchaseControls?: {
    requireApproval?: boolean;
    spendingLimit?: number;
  };
  screenTime?: {
    enabled?: boolean;
    dailyLimit?: string;
    bedtime?: string;
    breakReminders?: boolean;
  };
}

/**
 * Guardianship settings for minor profiles
 */
export interface Guardianship {
  guardians?: Guardian[];
  managedBy?: DID;
  contentSafety?: ContentSafety;
}

// ============================================================================
// Memory Category Types
// ============================================================================

/**
 * Identity category
 */
export interface CategoryIdentity {
  name?: {
    preferred?: string;
    full?: string;
    nickname?: string;
  };
  birthYear?: number;
  location?: {
    city?: string;
    country?: string;
    timezone?: string;
  };
}

/**
 * Preferences category
 */
export interface CategoryPreferences {
  communication?: CommunicationPreferences;
  content?: ContentPreferences;
  ui?: {
    theme?: 'light' | 'dark' | 'auto';
    fontSize?: string;
  };
}

/**
 * Professional category
 */
export interface CategoryProfessional {
  occupation?: string;
  title?: string;
  employer?: string;
  industry?: string;
  skills?: string[];
  experience?: {
    years?: number;
    level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  };
  workStyle?: 'remote' | 'hybrid' | 'office' | 'flexible';
}

/**
 * Interests category
 */
export interface CategoryInterests {
  topics?: string[];
  hobbies?: string[];
  music?: {
    genres?: string[];
    artists?: string[];
  };
  reading?: {
    genres?: string[];
    recentBooks?: string[];
  };
  sports?: string[];
  travel?: {
    visited?: string[];
    wishlist?: string[];
  };
}

/**
 * Context category
 */
export interface CategoryContext {
  currentProjects?: string[];
  recentTopics?: string[];
  ongoingGoals?: string[];
  currentFocus?: string;
}

/**
 * Health category (sensitive)
 */
export interface CategoryHealth {
  allergies?: string[];
  dietary?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'other';
  conditions?: string[];
  medications?: string[];
}

/**
 * Relationships category (sensitive)
 */
export interface CategoryRelationships {
  family?: Record<string, string>;
  pets?: Array<{
    name: string;
    type: string;
  }>;
}

// ============================================================================
// Memory Types
// ============================================================================

/**
 * Source information for a memory
 */
export interface MemorySource {
  type: MemorySourceType;
  agentDid?: DID;
  agentName?: string;
  sessionId?: string;
  timestamp: string;
  context?: string;
  importSource?: string;
}

/**
 * Memory metadata
 */
export interface MemoryMetadata {
  approvedAt?: string;
  rejectedAt?: string;
  archivedAt?: string;
  lastUsed?: string;
  useCount?: number;
  lastConfirmed?: string;
  initialConfidence?: number;
  mergedFrom?: string[];
  supersedes?: string;
  supersededBy?: string;
  editHistory?: Array<{
    editedAt: string;
    previousContent: string;
    editedBy: string;
  }>;
}

/**
 * A discrete piece of information about a user
 */
export interface Memory {
  id: string;
  content: string;
  category?: string;
  source: MemorySource;
  confidence?: number;
  status: MemoryStatus;
  sensitivity?: SensitivityLevel;
  scope?: string[];
  metadata?: MemoryMetadata;
  tags?: string[];
}

/**
 * Memories section of a profile
 */
export interface Memories {
  'a2p:identity'?: CategoryIdentity;
  'a2p:preferences'?: CategoryPreferences;
  'a2p:professional'?: CategoryProfessional;
  'a2p:interests'?: CategoryInterests;
  'a2p:context'?: CategoryContext;
  'a2p:health'?: CategoryHealth;
  'a2p:relationships'?: CategoryRelationships;

  // Memory types
  'a2p:episodic'?: Memory[];
  'a2p:semantic'?: Memory[];
  'a2p:procedural'?: Memory[];

  [key: `ext:${string}`]: unknown;
}

// ============================================================================
// Sub-Profile Types
// ============================================================================

/**
 * Context-specific sub-profile
 */
export interface SubProfile {
  id: DID;
  name: string;
  description?: string;
  inheritsFrom?: string[];
  overrides?: Record<string, unknown>;
  specialized?: Partial<Memories>;
  shareWith?: string[];
}

// ============================================================================
// Consent Types
// ============================================================================

/**
 * Conditions for a consent policy to apply
 */
export interface PolicyConditions {
  requireVerifiedOperator?: boolean;
  minTrustScore?: number;
  requireAudit?: boolean;
  allowedJurisdictions?: string[];
  blockedJurisdictions?: string[];
  requireHttps?: boolean;
  maxDataRetention?: string;
  timeOfDay?: {
    start: string;
    end: string;
    timezone?: string;
  };
  rateLimit?: {
    requests: number;
    window: string;
  };
}

/**
 * Access control policy
 */
export interface ConsentPolicy {
  id: string;
  name?: string;
  description?: string;
  priority?: number;
  enabled?: boolean;
  agentPattern: string;
  agentDids?: DID[];
  agentTags?: string[];
  operatorDids?: DID[];
  allow?: string[];
  deny?: string[];
  permissions: PermissionLevel[];
  conditions?: PolicyConditions;
  subProfile?: string;
  expiry?: string | null;
  created?: string;
  updated?: string;
}

/**
 * Proof of consent for audit
 */
export interface ConsentProof {
  type: 'signature' | 'hash' | 'blockchain' | 'none';
  algorithm?: string;
  hash?: string;
  signature?: string;
  signedBy?: DID;
  location?: string;
  blockchainRef?: {
    chain: string;
    txHash: string;
    blockNumber: number;
  };
}

/**
 * Consent receipt
 */
export interface ConsentReceipt {
  receiptId: string;
  userDid: DID;
  agentDid: DID;
  operatorDid?: DID;
  policyId?: string;
  grantedScopes: string[];
  deniedScopes?: string[];
  permissions: PermissionLevel[];
  subProfile?: string;
  grantedAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revokedReason?: string;
  consentMethod?: 'policy_match' | 'explicit_grant' | 'one_time' | 'session';
  purpose?: string;
  legalBasis?: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  proof?: ConsentProof;
}

// ============================================================================
// Proposal Types
// ============================================================================

/**
 * Evidence supporting a memory proposal
 */
export interface ProposalEvidence {
  type: 'user_statement' | 'inferred' | 'confirmed' | 'external';
  quote?: string;
  timestamp?: string;
}

/**
 * Proposed memory content
 */
export interface ProposedMemory {
  content: string;
  category?: string;
  memoryType?: 'episodic' | 'semantic' | 'procedural';
  confidence?: number;
  suggestedSensitivity?: SensitivityLevel;
  suggestedScope?: string[];
  suggestedTags?: string[];
}

/**
 * Proposal resolution
 */
export interface ProposalResolution {
  resolvedAt: string;
  action: ProposalAction;
  editedContent?: string;
  editedCategory?: string;
  reason?: string;
  createdMemoryId?: string;
}

/**
 * Memory proposal from an agent
 */
export interface Proposal {
  id: string;
  proposedBy: {
    agentDid: DID;
    agentName?: string;
    sessionId?: string;
    conversationContext?: string;
  };
  proposedAt: string;
  memory: ProposedMemory;
  context?: string;
  evidence?: ProposalEvidence[];
  status: ProposalStatus;
  resolution?: ProposalResolution;
  expiresAt?: string;
  priority?: 'low' | 'normal' | 'high';
  similarTo?: string[];
}

// ============================================================================
// Settings Types
// ============================================================================

/**
 * Memory settings
 */
export interface MemorySettings {
  decayEnabled?: boolean;
  decayRate?: number;
  decayInterval?: string;
  reviewThreshold?: number;
  archiveThreshold?: number;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  proposalNotifications?: boolean;
  accessNotifications?: boolean;
  consolidationReminders?: boolean;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  defaultSensitivity?: SensitivityLevel;
  allowAnonymousAccess?: boolean;
}

/**
 * Profile settings
 */
export interface ProfileSettings {
  memorySettings?: MemorySettings;
  notificationSettings?: NotificationSettings;
  privacySettings?: PrivacySettings;
}

// ============================================================================
// Profile Types
// ============================================================================

/**
 * Complete user profile
 */
export interface Profile {
  id: DID;
  version: string;
  profileType: ProfileType;
  created?: string;
  updated?: string;
  identity: Identity;
  common?: Common;
  memories?: Memories;
  subProfiles?: SubProfile[];
  pendingProposals?: Proposal[];
  accessPolicies?: ConsentPolicy[];
  settings?: ProfileSettings;
  guardianship?: Guardianship;
}

// ============================================================================
// Agent Profile Types
// ============================================================================

/**
 * Agent operator information
 */
export interface AgentOperator {
  name: string;
  did?: DID;
  jurisdiction?: string;
  address?: {
    country?: string;
    city?: string;
  };
  contact?: string;
  dpo?: string;
  privacyPolicy?: string;
  termsOfService?: string;
  verified?: boolean;
  verifiedBy?: string;
}

/**
 * Agent a2p support declaration
 */
export interface AgentA2PSupport {
  protocolVersion: string;
  capabilities?: {
    canReadProfiles?: boolean;
    canProposeMemories?: boolean;
    canWriteMemories?: boolean;
    supportsSubProfiles?: boolean;
    supportsConsentReceipts?: boolean;
  };
  requestedScopes?: string[];
  requiredScopes?: string[];
  supportedCategories?: string[];
  dataRetention?: {
    sessionData?: string;
    persistentData?: string;
    logs?: string;
  };
  endpoints?: {
    profile?: string;
    proposals?: string;
    webhooks?: string;
  };
}

/**
 * Agent trust metrics
 */
export interface AgentTrustMetrics {
  verifiedOperator?: boolean;
  securityAudit?: {
    auditor?: string;
    date?: string;
    report?: string;
    level?: 'basic' | 'standard' | 'comprehensive';
  };
  privacyAudit?: {
    auditor?: string;
    date?: string;
    gdprCompliant?: boolean;
    ccpaCompliant?: boolean;
  };
  communityScore?: number;
  communityReviews?: number;
  certifications?: string[];
  incidentHistory?: Array<{
    date: string;
    type: string;
    resolved: boolean;
    description?: string;
  }>;
}

/**
 * Agent capabilities
 */
export interface AgentCapabilities {
  domains?: string[];
  languages?: string[];
  modalities?: Array<'text' | 'voice' | 'image' | 'video' | 'code'>;
  integrations?: string[];
}

/**
 * Agent identity
 */
export interface AgentIdentity {
  name: string;
  description?: string;
  shortDescription?: string;
  version?: string;
  icon?: string;
  banner?: string;
  homepage?: string;
  documentation?: string;
  a2aCard?: string;
  tags?: string[];
}

/**
 * Complete agent profile
 */
export interface AgentProfile {
  id: DID;
  profileType: 'agent';
  version?: string;
  created?: string;
  updated?: string;
  identity: AgentIdentity;
  operator: AgentOperator;
  a2pSupport: AgentA2PSupport;
  trustMetrics?: AgentTrustMetrics;
  capabilities?: AgentCapabilities;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

/**
 * Profile access request
 */
export interface ProfileAccessRequest {
  userDid: DID;
  scopes: string[];
  subProfile?: string;
  purpose?: string;
}

/**
 * Profile access response
 */
export interface ProfileAccessResponse {
  profile: Partial<Profile>;
  consent: ConsentReceipt;
  filteredScopes: string[];
}

/**
 * Memory proposal request
 */
export interface MemoryProposalRequest {
  memoryType?: 'episodic' | 'semantic' | 'procedural';
  userDid: DID;
  content: string;
  category?: string;
  confidence?: number;
  context?: string;
  evidence?: ProposalEvidence[];
  suggestedSensitivity?: SensitivityLevel;
}

/**
 * Memory proposal response
 */
export interface MemoryProposalResponse {
  proposalId: string;
  status: ProposalStatus;
}

// ============================================================================
// Client Configuration Types
// ============================================================================

/**
 * Storage backend configuration
 */
export interface StorageConfig {
  type: 'local' | 'solid' | 'ipfs' | 'cloud' | 'memory';
  options?: Record<string, unknown>;
}

/**
 * Client configuration
 */
export interface A2PClientConfig {
  agentDid: DID;
  privateKey?: string;
  storage?: StorageConfig;
  endpoints?: {
    resolver?: string;
    gateway?: string;
  };
  timeout?: number;
  retries?: number;
}

/**
 * User client configuration
 */
export interface A2PUserConfig {
  did?: DID;
  storage?: StorageConfig;
  autoSave?: boolean;
}
