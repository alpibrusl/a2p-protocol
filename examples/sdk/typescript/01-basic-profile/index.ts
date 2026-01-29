/**
 * Example 01: Basic Profile
 *
 * This example shows how to create and manage a user profile.
 */

import {
  createUserClient,
  createProfile,
  addMemory,
  updatePreferences,
  addPolicy,
  PermissionLevel,
  SensitivityLevel,
} from '@a2p/sdk';

async function main() {
  console.log('🚀 a2p Example: Basic Profile\n');

  // ============================================
  // 1. Create a User Client
  // ============================================
  console.log('1️⃣ Creating user client...');
  const user = createUserClient();

  // ============================================
  // 2. Create a New Profile
  // ============================================
  console.log('2️⃣ Creating profile...');
  const profile = await user.createProfile({
    displayName: 'Alice',
  });
  console.log(`   ✅ Profile created: ${profile.id}`);

  // ============================================
  // 3. Add Memories
  // ============================================
  console.log('3️⃣ Adding memories...');

  // Add professional information
  await user.addMemory({
    content: 'Works as a Software Engineer at TechCorp',
    category: 'a2p:professional',
    sensitivity: 'standard' as SensitivityLevel,
    tags: ['work', 'career'],
  });
  console.log('   ✅ Added professional memory');

  // Add interests
  await user.addMemory({
    content: 'Interested in machine learning and distributed systems',
    category: 'a2p:interests.topics',
    sensitivity: 'public' as SensitivityLevel,
  });
  console.log('   ✅ Added interests memory');

  // Add a preference
  await user.addMemory({
    content: 'Prefers concise responses with code examples',
    category: 'a2p:preferences.communication',
    sensitivity: 'public' as SensitivityLevel,
  });
  console.log('   ✅ Added communication preference');

  // ============================================
  // 4. View the Profile
  // ============================================
  console.log('\n4️⃣ Current profile:');
  const currentProfile = user.getProfile();

  if (currentProfile) {
    console.log(`   ID: ${currentProfile.id}`);
    console.log(`   Display Name: ${currentProfile.identity.displayName}`);
    console.log(`   Memories: ${currentProfile.memories?.['a2p:episodic']?.length || 0}`);

    // Show memories
    const memories = currentProfile.memories?.['a2p:episodic'] || [];
    for (const memory of memories) {
      console.log(`   - [${memory.category}] ${memory.content}`);
    }
  }

  // ============================================
  // 5. Export Profile
  // ============================================
  console.log('\n5️⃣ Exporting profile...');
  const exported = user.exportProfile();
  console.log('   ✅ Profile exported to JSON');
  console.log(`   Size: ${exported.length} bytes`);

  // ============================================
  // 6. Show JSON (truncated)
  // ============================================
  console.log('\n6️⃣ Profile JSON (first 500 chars):');
  console.log(exported.substring(0, 500) + '...');

  console.log('\n✨ Example complete!');
}

main().catch(console.error);
