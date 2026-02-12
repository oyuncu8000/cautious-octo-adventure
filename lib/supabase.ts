import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://vjdchtikcanvvocuwvgw.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZGNodGlrY2FudnZvY3V3dmd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTc2OTQsImV4cCI6MjA4NjQ5MzY5NH0.KcXmJtuqG1mTC01eE1xJsCGqddghdQlvhh9kruEtymE"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
