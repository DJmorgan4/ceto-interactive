import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const stratum = createClient(supabaseUrl, supabaseKey)

// Write a site to STRATUM from Ceto
export async function stratumWriteSite(site: {
  name: string
  latitude: number
  longitude: number
  address?: string
  state?: string
  county?: string
  ceto_score?: number
  ceto_tier?: string
  esa_phase?: string
  regulatory_flags?: any[]
  tags?: string[]
  metadata?: any
}) {
  const { data, error } = await stratum
    .from('stratum_sites')
    .insert({ ...site, source: 'ceto', site_type: 'ESA' })
    .select()
    .single()

  if (error) throw error
  return data
}

// Write a sensor reading to STRATUM
export async function stratumWriteSensorReading(reading: {
  site_id: string
  sensor_type: string
  value: number
  unit?: string
  metadata?: any
}) {
  const { data, error } = await stratum
    .from('stratum_sensor_readings')
    .insert(reading)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all Ceto sites (for LOCUS globe)
export async function stratumGetCetoSites() {
  const { data, error } = await stratum
    .from('stratum_sites')
    .select(`
      *,
      stratum_sensor_readings(*)
    `)
    .eq('source', 'ceto')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
