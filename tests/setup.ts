import dotenv from 'dotenv';
import path from 'path';

// Load .env.local for Supabase credentials
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
