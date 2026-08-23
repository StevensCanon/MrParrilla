// supabase/functions/login-pin/index.ts
//
// Qué hace: recibe { usuario_id, pin }, verifica el PIN contra el hash
// guardado, y si es correcto firma un token de sesión válido para ese
// usuario. El frontend usa ese token en todas las llamadas a Supabase,
// y las políticas de seguridad (RLS) lo reconocen igual que si hubiera
// entrado con correo y contraseña.
//
// Antes de desplegar, configura este secreto (el prefijo SUPABASE_ está
// reservado y el CLI lo rechaza). El valor es el JWT Secret del dashboard
// (Project Settings → API → JWT Settings):
//   npx supabase secrets set "JWT_SECRET=pega_el_valor"
//
// Desplegar con:
//   npx supabase functions deploy login-pin

import { createClient } from 'npm:@supabase/supabase-js@2';
import bcrypt from 'npm:bcryptjs@2.4.3';
import jwt from 'npm:jsonwebtoken@9.0.2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const JWT_SECRET = Deno.env.get('JWT_SECRET')!;
const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const { usuario_id, pin } = await req.json();

  if (!usuario_id || !pin) {
    return json({ error: 'Faltan datos' }, 400);
  }

  const { data: usuario, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, rol, pin_hash, activo, intentos_fallidos, bloqueado_hasta')
    .eq('id', usuario_id)
    .single();

    if (error || !usuario || !usuario.activo) {
        return json(
          {
            error: 'Usuario no encontrado',
            debug: {
              supabaseError: error
                ? {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                  }
                : null,
              usuarioEncontrado: !!usuario,
              activo: usuario?.activo ?? null,
              usuario_id_recibido: usuario_id,
            },
          },
          404
        );
      }

  if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
    return json({ error: 'Cuenta bloqueada temporalmente, pide ayuda al admin' }, 423);
  }

  const pinValido = await bcrypt.compare(pin, usuario.pin_hash);

  if (!pinValido) {
    const intentos = (usuario.intentos_fallidos || 0) + 1;
    const actualizacion: Record<string, unknown> = { intentos_fallidos: intentos };
    if (intentos >= MAX_INTENTOS) {
      actualizacion.bloqueado_hasta = new Date(
        Date.now() + BLOQUEO_MINUTOS * 60_000
      ).toISOString();
    }
    await supabaseAdmin.from('usuarios').update(actualizacion).eq('id', usuario_id);

    return json(
      { error: 'PIN incorrecto', intentosRestantes: Math.max(0, MAX_INTENTOS - intentos) },
      401
    );
  }

  // PIN correcto: reinicia intentos fallidos y firma la sesión
  await supabaseAdmin
    .from('usuarios')
    .update({ intentos_fallidos: 0, bloqueado_hasta: null })
    .eq('id', usuario_id);

  const ahora = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      sub: usuario.id,
      role: 'authenticated',
      aud: 'authenticated',
      iat: ahora,
      exp: ahora + 60 * 60 * 12, // 12 horas — dura el turno
    },
    JWT_SECRET
  );

  return json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
  });
});