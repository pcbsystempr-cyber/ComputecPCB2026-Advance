import { createClient } from '@supabase/supabase-js'

// pega aquí tus datos
const SUPABASE_URL = 'https://bfrpiyswqyozvdznihih.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmcnBpeXN3cXlvenZkem5paGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTc5MjgsImV4cCI6MjA5MDYzMzkyOH0.95UJjiiGk3xMg_6fn5ee7feLvHp3cWYbSUFI183wUT0'

// crear conexión
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)