import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_MODEL = 'gemini-3.1-pro-preview';
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const FALLBACK_ALLOWED_ORIGINS = [
  'http://127.0.0.1:3000',
  'http://localhost:3000',
];

function getAllowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS');
  if (!raw) return FALLBACK_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    if (allowed.startsWith('*.')) {
      const suffix = allowed.slice(1); // ".example.com"
      try {
        return new URL(origin).hostname.endsWith(suffix);
      } catch {
        return false;
      }
    }
    return origin === allowed;
  });
}

function buildCorsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Vary': 'Origin',
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = getAllowedOrigins();
  const allowed = origin && isOriginAllowed(origin, allowedOrigins);

  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const geminiRes = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await geminiRes.json();

  return new Response(JSON.stringify(data), {
    status: geminiRes.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
