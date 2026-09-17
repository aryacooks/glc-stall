import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment or .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log('Testing connection to Supabase...');

  // 1. Check storage buckets
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('Bucket list error:', bucketError.message);
  } else {
    console.log('Existing buckets:', buckets.map(b => b.name));
    const hasStallPhotos = buckets.some(b => b.name === 'stall-photos');
    if (!hasStallPhotos) {
      console.log('Creating public bucket "stall-photos"...');
      const { data: createdBucket, error: createError } = await supabase.storage.createBucket('stall-photos', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      if (createError) {
        console.error('Error creating bucket:', createError.message);
      } else {
        console.log('Bucket "stall-photos" created successfully!');
      }
    } else {
      console.log('Bucket "stall-photos" already exists.');
    }
  }

  // 2. Check if nexora_photos table exists
  const { data: tableData, error: tableError } = await supabase
    .from('nexora_photos')
    .select('id')
    .limit(1);

  if (tableError) {
    console.log('Table "nexora_photos" check result:', tableError.message);
  } else {
    console.log('Table "nexora_photos" exists and is ready!');
  }
}

main().catch(console.error);
