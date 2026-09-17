/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://hjwgcfqwjsalpimggtbk.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqd2djZnF3anNhbHBpbWdndGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDQzMjAsImV4cCI6MjEwNTIyMDMyMH0.ae9QshKUbXwkqvvhWd9Q4OxrXMM4RcA7IwYKb2TmUuY',
  },
};

export default nextConfig;
