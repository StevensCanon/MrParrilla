// supabase/functions/login-pin/index.ts
//
// Login con PIN + Supabase Auth nativo.
//
// El usuario sigue entrando con su PIN de 4 dígitos, pero este endpoint
// ya no firma JWT propios. Verifica el PIN, sincroniza una credencial interna
// de Supabase Auth y obtiene una sesión nativa (access_token + refresh_token).
//
// El SERVICE_ROLE se usa únicamente dentro de esta Edge Function.
// Nunca debe llegar al navegador.

import { createClient } from 'npm:@supabase/supabase-js@2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PUBLISHABLE_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
  Deno.env.get('SUPABASE_ANON_KEY');

// Durante la migración aceptamos el JWT_SECRET anterior como fallback.
// Cuando terminemos la migración podremos eliminarlo y dejar únicamente
// AUTH_PIN_PEPPER.
const AUTH_PIN_PEPPER =
  Deno.env.get('AUTH_PIN_PEPPER') ?? Deno.env.get('JWT_SECRET');

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 10;
const PIN_AUTH_VERSION = 1;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAuth = PUBLISHABLE_KEY
  ? createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deriveAuthPassword(userId: string, pin: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${userId}:${pin}`),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  if (!PUBLISHABLE_KEY || !AUTH_PIN_PEPPER) {
    return json(
      {
        error:
          'Falta configuración de autenticación. Configura SUPABASE_PUBLISHABLE_KEY/ANON_KEY y AUTH_PIN_PEPPER en los secretos de la función.',
      },
      500,
    );
  }

  let body: { usuario_id?: string; pin?: string };

  try {
    body = await req.json();
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400);
  }

  const { usuario_id, pin } = body;

  if (!usuario_id || !pin || !/^\d{4}$/.test(pin)) {
    return json({ error: 'PIN inválido' }, 400);
  }

  const { data: usuario, error } = await supabaseAdmin
    .from('usuarios')
    .select(
      'id, nombre, rol, pin_hash, activo, intentos_fallidos, bloqueado_hasta',
    )
    .eq('id', usuario_id)
    .single();

  if (error || !usuario || !usuario.activo) {
    return json({ error: 'Usuario no encontrado' }, 404);
  }

  if (
    usuario.bloqueado_hasta &&
    new Date(usuario.bloqueado_hasta) > new Date()
  ) {
    return json(
      { error: 'Cuenta bloqueada temporalmente, pide ayuda al admin' },
      423,
    );
  }

  const pinValido = await bcrypt.compare(pin, usuario.pin_hash);

  if (!pinValido) {
    const intentos = (usuario.intentos_fallidos || 0) + 1;
    const actualizacion: Record<string, unknown> = {
      intentos_fallidos: intentos,
    };

    if (intentos >= MAX_INTENTOS) {
      actualizacion.bloqueado_hasta = new Date(
        Date.now() + BLOQUEO_MINUTOS * 60_000,
      ).toISOString();
    }

    await supabaseAdmin
      .from('usuarios')
      .update(actualizacion)
      .eq('id', usuario_id);

    return json(
      {
        error: 'PIN incorrecto',
        intentosRestantes: Math.max(0, MAX_INTENTOS - intentos),
      },
      401,
    );
  }

  // PIN correcto: reiniciamos el bloqueo.
  await supabaseAdmin
    .from('usuarios')
    .update({ intentos_fallidos: 0, bloqueado_hasta: null })
    .eq('id', usuario_id);

  // Buscamos el usuario correspondiente en Supabase Auth.
  // usuarios.id == auth.users.id en este proyecto.
  const { data: authUserData, error: authUserError } =
    await supabaseAdmin.auth.admin.getUserById(usuario.id);

  if (authUserError || !authUserData.user?.email) {
    return json(
      { error: 'El usuario no tiene una cuenta de autenticación válida' },
      500,
    );
  }

  const authUser = authUserData.user;
  const authPassword = await deriveAuthPassword(
    usuario.id,
    pin,
    AUTH_PIN_PEPPER,
  );

  // Primera entrada después de la migración:
  // sincronizamos la contraseña interna de Supabase Auth.
  // El empleado nunca ve ni introduce esta contraseña.
  if (authUser.app_metadata?.pin_auth_version !== PIN_AUTH_VERSION) {
    const { error: updateAuthError } =
      await supabaseAdmin.auth.admin.updateUserById(usuario.id, {
        password: authPassword,
        app_metadata: {
          ...(authUser.app_metadata ?? {}),
          pin_auth_version: PIN_AUTH_VERSION,
        },
      });

    if (updateAuthError) {
      console.error('Error sincronizando Supabase Auth:', updateAuthError);
      return json({ error: 'No se pudo preparar la autenticación' }, 500);
    }
  }

  // A partir de aquí iniciamos sesión con el flujo normal de Supabase Auth.
  if (!supabaseAuth) {
    return json({ error: 'Cliente de autenticación no configurado' }, 500);
  }

  const { data: sessionData, error: signInError } =
    await supabaseAuth.auth.signInWithPassword({
      email: authUser.email,
      password: authPassword,
    });

  if (signInError || !sessionData.session) {
    console.error('Error iniciando sesión en Supabase Auth:', signInError);
    return json({ error: 'No se pudo iniciar la sesión' }, 401);
  }

  return json({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    expires_at: sessionData.session.expires_at,
    expires_in: sessionData.session.expires_in,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
    },
  });
});
