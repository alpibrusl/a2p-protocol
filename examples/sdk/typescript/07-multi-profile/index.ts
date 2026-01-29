/**
 * Example 07: Multi-Profile (Work/Personal)
 *
 * This example demonstrates sub-profiles for different contexts.
 */

import {
  createUserClient,
  createAgentClient,
  addSubProfile,
  addPolicy,
  MemoryStorage,
  type DID,
  type PermissionLevel,
  type SubProfile,
} from '@a2p/sdk';

const storage = new MemoryStorage();

async function main() {
  console.log('🚀 a2p Example: Multi-Profile (Work/Personal)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================
  // 1. Create Base Profile
  // ============================================
  console.log('1️⃣ Creating base profile with common data...\n');

  const user = createUserClient(storage);
  let profile = await user.createProfile({ displayName: 'Alex' });

  // Add common memories (shared across all contexts)
  await user.addMemory({
    content: 'Prefers concise communication',
    category: 'a2p:preferences.communication',
    scope: ['general'],
  });

  await user.addMemory({
    content: 'Primary language: English',
    category: 'a2p:preferences.language',
    scope: ['general'],
  });

  profile = user.getProfile()!;
  console.log(`   ✅ Base profile: ${profile.id}`);
  console.log('   📋 Common preferences added\n');

  // ============================================
  // 2. Create Work Sub-Profile
  // ============================================
  console.log('2️⃣ Creating WORK sub-profile...\n');

  const workSubProfile: SubProfile = {
    id: `${profile.id}:work` as DID,
    name: 'Work',
    description: 'Professional context',
    inheritsFrom: ['common'],
    overrides: {
      'identity.displayName': 'Alex Chen',  // More formal
    },
    specialized: {
      'a2p:professional': {
        title: 'Senior Software Engineer',
        employer: 'TechCorp Inc.',
        skills: ['Python', 'TypeScript', 'Kubernetes'],
      },
      'a2p:context': {
        currentProjects: ['API Migration', 'ML Pipeline'],
      },
    },
    shareWith: ['did:a2p:agent:local:slack-*', 'did:a2p:agent:local:work-*'],
  };

  profile = addSubProfile(profile, workSubProfile);
  console.log('   ✅ Work sub-profile created');
  console.log('      Name: Alex Chen (formal)');
  console.log('      Title: Senior Software Engineer');
  console.log('      Skills: Python, TypeScript, Kubernetes');
  console.log('      Shares with: Slack bots, Work tools\n');

  // ============================================
  // 3. Create Personal Sub-Profile
  // ============================================
  console.log('3️⃣ Creating PERSONAL sub-profile...\n');

  const personalSubProfile: SubProfile = {
    id: `${profile.id}:personal` as DID,
    name: 'Personal',
    description: 'Personal/entertainment context',
    inheritsFrom: ['common'],
    overrides: {
      'identity.displayName': 'Alex',  // Casual
    },
    specialized: {
      'a2p:interests': {
        hobbies: ['Gaming', 'Photography', 'Hiking'],
        music: {
          genres: ['Jazz', 'Electronic'],
          artists: ['Miles Davis', 'Bonobo'],
        },
        reading: {
          genres: ['Sci-Fi', 'Technical'],
        },
      },
      'a2p:context': {
        currentProjects: ['Learning piano', 'Photo project'],
      },
    },
    shareWith: ['did:a2p:agent:local:spotify-*', 'did:a2p:agent:local:entertainment-*'],
  };

  profile = addSubProfile(profile, personalSubProfile);
  console.log('   ✅ Personal sub-profile created');
  console.log('      Name: Alex (casual)');
  console.log('      Hobbies: Gaming, Photography, Hiking');
  console.log('      Music: Jazz, Electronic');
  console.log('      Shares with: Spotify, Entertainment apps\n');

  // ============================================
  // 4. Add Access Policies
  // ============================================
  console.log('4️⃣ Configuring access policies...\n');

  // Work agents get work sub-profile
  profile = addPolicy(profile, {
    name: 'Work Context',
    agentPattern: 'did:a2p:agent:local:work-*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:professional.*', 'a2p:preferences.*', 'a2p:context.*'],
    deny: ['a2p:interests.*', 'a2p:health.*'],
    subProfile: `${profile.id}:work`,
    priority: 10,
  });
  console.log('   📋 Work agents → Work sub-profile');

  // Slack bots get work sub-profile
  profile = addPolicy(profile, {
    name: 'Slack Bots',
    agentPattern: 'did:a2p:agent:local:slack-*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:professional.*', 'a2p:preferences.*'],
    subProfile: `${profile.id}:work`,
    priority: 10,
  });
  console.log('   📋 Slack bots → Work sub-profile');

  // Entertainment agents get personal sub-profile
  profile = addPolicy(profile, {
    name: 'Entertainment Apps',
    agentPattern: 'did:a2p:agent:local:entertainment-*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:interests.*', 'a2p:preferences.*'],
    deny: ['a2p:professional.*', 'a2p:health.*'],
    subProfile: `${profile.id}:personal`,
    priority: 10,
  });
  console.log('   📋 Entertainment apps → Personal sub-profile');

  // Spotify gets personal sub-profile
  profile = addPolicy(profile, {
    name: 'Spotify',
    agentPattern: 'did:a2p:agent:local:spotify-*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:interests.music.*', 'a2p:preferences.*'],
    subProfile: `${profile.id}:personal`,
    priority: 10,
  });
  console.log('   📋 Spotify → Personal sub-profile (music only)\n');

  await storage.set(profile.id, profile);

  // ============================================
  // 5. Test Agent Access
  // ============================================
  console.log('5️⃣ Testing agent access to different contexts...\n');

  // Work agent
  console.log('   🤖 Work Assistant (did:a2p:agent:local:work-assistant)');
  const workAgent = createAgentClient(
    { agentDid: 'did:a2p:agent:local:work-assistant' as DID },
    storage
  );
  try {
    const workProfile = await workAgent.getProfile({
      userDid: profile.id,
      scopes: ['a2p:professional', 'a2p:interests'],
      subProfile: `${profile.id}:work`,
    });
    console.log('      ✅ Access granted to work context');
    console.log(`      Sees: ${JSON.stringify(workProfile.memories?.['a2p:professional'] || {})}`);
  } catch (e) {
    console.log('      ❌ Access denied');
  }
  console.log();

  // Entertainment agent
  console.log('   🎮 Entertainment App (did:a2p:agent:local:entertainment-app)');
  const entertainmentAgent = createAgentClient(
    { agentDid: 'did:a2p:agent:local:entertainment-app' as DID },
    storage
  );
  try {
    const personalProfile = await entertainmentAgent.getProfile({
      userDid: profile.id,
      scopes: ['a2p:interests', 'a2p:professional'],
      subProfile: `${profile.id}:personal`,
    });
    console.log('      ✅ Access granted to personal context');
    console.log(`      Sees: ${JSON.stringify(personalProfile.memories?.['a2p:interests'] || {})}`);
  } catch (e) {
    console.log('      ❌ Access denied');
  }
  console.log();

  // ============================================
  // 6. Summary
  // ============================================
  console.log('6️⃣ Profile Structure Summary:\n');
  console.log('   ┌────────────────────────────────────────────────────────┐');
  console.log('   │                    ROOT PROFILE                        │');
  console.log(`   │  ID: ${profile.id.substring(0, 40)}...  │`);
  console.log('   │  Common: Language preferences, Communication style    │');
  console.log('   ├────────────────────────────────────────────────────────┤');
  console.log('   │                                                        │');
  console.log('   │   ┌─────────────────┐     ┌─────────────────┐         │');
  console.log('   │   │  WORK PROFILE   │     │ PERSONAL PROFILE│         │');
  console.log('   │   │  ─────────────  │     │  ─────────────  │         │');
  console.log('   │   │  Alex Chen      │     │  Alex           │         │');
  console.log('   │   │  Sr. Engineer   │     │  Gaming, Music  │         │');
  console.log('   │   │  TechCorp       │     │  Photography    │         │');
  console.log('   │   └─────────────────┘     └─────────────────┘         │');
  console.log('   │                                                        │');
  console.log('   └────────────────────────────────────────────────────────┘\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    ✨ Example Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
