import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbbktjmnuipcszucwzkl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiYmt0am1udWlwY3N6dWN3emtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTMzNDAsImV4cCI6MjA4ODAyOTM0MH0.cN-wYLKyrS3CEiHaD2S_OuFK9leXui3lf6k5-U0sjHQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
