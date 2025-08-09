import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://blgvqkwccjnwakhousvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZ3Zxa3djY2pud2FraG91c3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTk2NjYsImV4cCI6MjA2ODE3NTY2Nn0.Az0W95iVzZ2W8w5mH4XrBZ8qKrmWd1DBb8IM3HB4YEc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 