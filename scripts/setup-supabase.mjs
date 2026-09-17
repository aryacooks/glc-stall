import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Auto-load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim();
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
  console.log('Loaded environment variables from .env.local');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('');
console.log('==============================================');
console.log('🚀 NEXORA SUPABASE BACKEND DIAGNOSTIC & SETUP');
console.log('==============================================');
console.log('Target Project URL :', SUPABASE_URL || '❌ MISSING');
console.log('Anon Key Present   :', ANON_KEY ? '✅ YES (' + ANON_KEY.length + ' chars)' : '❌ MISSING');
console.log('Service Key Present:', SERVICE_ROLE_KEY ? '✅ YES (' + SERVICE_ROLE_KEY.length + ' chars)' : '❌ MISSING');

if (!SUPABASE_URL || (!SERVICE_ROLE_KEY && !ANON_KEY)) {
  console.error('');
  console.error('❌ ERROR: Supabase credentials missing!');
  console.error('Please create a .env.local file with:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
  process.exit(1);
}

const clientKey = SERVICE_ROLE_KEY || ANON_KEY;
const supabase = createClient(SUPABASE_URL, clientKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('');
  console.log('1. Testing Supabase Storage Bucket ("stall-photos")...');
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.warn('⚠️  Could not list buckets directly:', bucketError.message);
    } else {
      const exists = buckets.some(b => b.name === 'stall-photos');
      if (exists) {
        console.log('✅ Storage bucket "stall-photos" exists and is ready!');
      } else {
        console.log('Creating public bucket "stall-photos"...');
        const { data: created, error: createError } = await supabase.storage.createBucket('stall-photos', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        });
        if (createError) {
          console.error('❌ Failed to create bucket:', createError.message);
          console.log('💡 Tip: Run supabase/schema.sql in your Supabase SQL Editor to create it.');
        } else {
          console.log('✅ Bucket "stall-photos" created successfully!');
        }
      }
    }
  } catch (err) {
    console.error('Storage check exception:', err.message);
  }

  console.log('');
  console.log('2. Testing Database Table ("nexora_photos")...');
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('nexora_photos')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ Table "nexora_photos" error:', tableError.message);
      console.error('👉 ACTION REQUIRED: Run "supabase/schema.sql" in your Supabase SQL Editor.');
    } else {
      console.log('✅ Table "nexora_photos" exists and is reachable!');
    }
  } catch (err) {
    console.error('Table check exception:', err.message);
  }

  console.log('');
  console.log('==============================================');
  console.log('🎉 Verification Finished!');
  console.log('==============================================');
  console.log('');
}

main().catch(console.error);
