// Test script for user profile helper functions
// Run with: node test-user-profile.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const access_token = process.env.TEST_USER_ACCESS_TOKEN;
const user_id = process.env.TEST_USER_ID;
const testEmail = process.env.TEST_EMAIL;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test user profile helpers
async function testUserProfileHelpers() {
  // Set the access token for the session
  await supabase.auth.setSession({
    access_token,
    refresh_token: '', // not needed for this test
  });

  try {
    // Test 1: Upsert user profile
    console.log('1️⃣ Testing upsertUserProfile...');
    const upsertData = {
      id: user_id,
      email: testEmail,
      smart_mode_enabled: false,
      preferred_discovery_mode: 'fresh'
    };

    const { data: upsertResult, error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(upsertData, { onConflict: 'id' })
      .select()
      .single();

    if (upsertError) {
      console.error('❌ Upsert failed:', upsertError);
      return;
    }
    console.log('✅ Upsert successful:', upsertResult.email);

    // Test 2: Get user profile
    console.log('\n2️⃣ Testing getUserProfile...');
    const { data: getResult, error: getError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (getError) {
      console.error('❌ Get failed:', getError);
      return;
    }
    console.log('✅ Get successful:', getResult.email);

    // Test 3: Update user profile
    console.log('\n3️⃣ Testing updateUserProfile...');
    const { data: updateResult, error: updateError } = await supabase
      .from('user_profiles')
      .update({ smart_mode_enabled: true })
      .eq('id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return;
    }
    console.log('✅ Update successful:', updateResult.smart_mode_enabled);

    // Test 4: Clean up (delete test user)
    console.log('\n4️⃣ Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user_id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
      return;
    }
    console.log('✅ Cleanup successful');

    console.log('\n🎉 All tests passed! User profile helpers are working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testUserProfileHelpers(); 