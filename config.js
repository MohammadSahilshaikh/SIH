/* =========================================================
   CONFIG — fill in your own project keys below.
   Nothing else in this codebase needs to change.
   ========================================================= */

// --- Supabase -------------------------------------------------
// Project Settings → API in your Supabase dashboard
const SUPABASE_URL = "https://kupcvxpbfclpysnvpycc.supabase.co";       // e.g. https://abcdefgh.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_l6otQISH0oiB-KB7diUZmg_RVYU2GtI";      // the "anon public" key

// --- EmailJS ----------------------------------------------------
// https://dashboard.emailjs.com → Account → General
const EMAILJS_PUBLIC_KEY = "GIbeIviQo1ehc1gxX";
const EMAILJS_SERVICE_ID = "service_8ln5mu9";
const EMAILJS_TEMPLATE_ID = "template_cdirgrg";
const TRAFFIC_CONTROL_EMAIL = "sahilfact549@gmail.com"; // where alerts land

/* ========================================================= */

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
emailjs.init(EMAILJS_PUBLIC_KEY);
