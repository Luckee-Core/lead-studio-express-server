/**
 * Dev User Setup Script
 * Creates a hardcoded dev user for testing
 */

import { getManagedSupabaseClient } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

const DEV_USER_ID = 'dev-user-001';
const DEV_USER_EMAIL = 'dev@mentorai.com';
const DEV_USER_NAME = 'Dev User';

export const setupDevUser = async () => {
  console.log('🔧 Setting up dev user...');

  try {
    const db = getManagedSupabaseClient();
    if (!db) {
      console.error('❌ Database unavailable');
      return;
    }

    // 1. Check if user exists
    const { data: existingUser } = await db
      .from('users')
      .select('*')
      .eq('id', DEV_USER_ID)
      .single();

    if (existingUser) {
      console.log('✅ Dev user already exists');
      return;
    }

    // 2. Create user
    const user = {
      id: DEV_USER_ID,
      name: DEV_USER_NAME,
      email: DEV_USER_EMAIL,
      provider: 'dev',
      tier: 'premium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.from('users').insert(user);
    console.log('✅ Dev user created');

    // 3. Create user credits (10,000 for testing)
    const credits = {
      id: uuidv4(),
      user_id: DEV_USER_ID,
      credits: 10000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.from('user_credits').insert(credits);
    console.log('✅ Dev user credits created (10,000)');

    console.log('\n🎉 Dev user setup complete!');
    console.log(`📧 Email: ${DEV_USER_EMAIL}`);
    console.log(`🆔 ID: ${DEV_USER_ID}`);
    console.log(`💰 Credits: 10,000`);
  } catch (error) {
    console.error('❌ Error setting up dev user:', error);
  }
};

export const DEV_USER = {
  id: DEV_USER_ID,
  email: DEV_USER_EMAIL,
  name: DEV_USER_NAME,
};

