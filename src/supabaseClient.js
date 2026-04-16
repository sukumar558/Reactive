import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezymhfdzynucqmfjsywk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eW1oZmR6eW51Y3FtZmpzeXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzIzNzksImV4cCI6MjA5MTA0ODM3OX0.wCrRhLDD57IUjYXMuPQKGn18H67YoZU7wNwLVNE86b8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
