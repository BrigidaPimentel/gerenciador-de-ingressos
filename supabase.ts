import { createClient } from "@supabase/supabase-js";

// Substitua pelos valores encontrados em Project Settings -> API no Supabase
const SUPABASE_URL = "https://zzjchwpeqoxqhuvzreel.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_B8fYseuCLO5hj4jRFY0ZXg_KwEKiJFb";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);