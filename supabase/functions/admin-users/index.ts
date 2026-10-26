import { createClient } from 'npm:@supabase/supabase-js@2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const roles = ['admin', 'cajero', 'mesero', 'cocina'] as const;
type Role = (typeof roles)[number];

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

function esRol(valor: unknown): valor is Role {
  return typeof valor === 'string' && roles.includes(valor as Role);
}

async function autenticar(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('usuarios')
    .select('rol, activo')
    .eq('id', data.user.id)
    .single();

  if (perfilError || !perfil?.activo) return null;
  return { user: data.user, perfil };
}

async function protegerUltimoAdministrador(usuarioId: string) {
  const { count, error } = await supabaseAdmin
    .from('usuarios')
    .select('id', { count: 'exact', head: true })
    .eq('rol', 'admin')
    .eq('activo', true)
    .neq('id', usuarioId);

  if (error) throw new Error(error.message);
  if ((count ?? 0) === 0) {
    throw new Error('No puedes desactivar o cambiar el rol del último administrador activo.');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const sesion = await autenticar(req);
  if (!sesion) return json({ error: 'Se requiere una sesión activa.' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Cuerpo inválido.' }, 400);
  }

  const accion = body.accion;

  if (accion === 'configuracion_cocina') {
    const { data, error } = await supabaseAdmin
      .from('configuracion_restaurante')
      .select('umbral_demora_minutos, intervalo_actualizacion_segundos')
      .eq('id', 1)
      .single();
    if (error) return json({ error: error.message }, 500);
    return json({ configuracion: data });
  }

  if (sesion.perfil.rol !== 'admin') {
    return json({ error: 'Se requiere rol de administrador.' }, 403);
  }
  const administrador = sesion.user;

  try {
    if (accion === 'listar') {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('id, nombre, rol, activo, telefono, creado_en, intentos_fallidos, bloqueado_hasta')
        .order('nombre', { ascending: true });

      if (error) throw new Error(error.message);
      return json({
        usuarios: (data ?? []).map((usuario) => ({
          ...usuario,
          telefono: usuario.telefono === null ? '' : String(usuario.telefono),
        })),
      });
    }

    if (accion === 'configuracion_obtener') {
      const { data, error } = await supabaseAdmin
        .from('configuracion_restaurante')
        .select('nombre, nit, telefono, correo, direccion, umbral_demora_minutos, intervalo_actualizacion_segundos')
        .eq('id', 1)
        .single();
      if (error) throw new Error(error.message);
      return json({ configuracion: data });
    }

    if (accion === 'configuracion_guardar') {
      const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
      const nit = typeof body.nit === 'string' ? body.nit.trim() : '';
      const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
      const correo = typeof body.correo === 'string' ? body.correo.trim() : '';
      const direccion = typeof body.direccion === 'string' ? body.direccion.trim() : '';
      const umbral = Number(body.umbral_demora_minutos);
      const intervalo = Number(body.intervalo_actualizacion_segundos);

      if (nombre.length < 2 || nombre.length > 120) {
        return json({ error: 'El nombre debe tener entre 2 y 120 caracteres.' }, 400);
      }
      if ([nit, telefono, correo, direccion].some((valor) => valor.length > 180)) {
        return json({ error: 'Uno de los datos del restaurante excede el largo permitido.' }, 400);
      }
      if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return json({ error: 'Escribe un correo válido.' }, 400);
      }
      if (!Number.isInteger(umbral) || umbral < 1 || umbral > 180) {
        return json({ error: 'El umbral de demora debe estar entre 1 y 180 minutos.' }, 400);
      }
      if (!Number.isInteger(intervalo) || intervalo < 5 || intervalo > 120) {
        return json({ error: 'La actualización debe estar entre 5 y 120 segundos.' }, 400);
      }

      const { error } = await supabaseAdmin
        .from('configuracion_restaurante')
        .upsert({
          id: 1,
          nombre,
          nit: nit || null,
          telefono: telefono || null,
          correo: correo || null,
          direccion: direccion || null,
          umbral_demora_minutos: umbral,
          intervalo_actualizacion_segundos: intervalo,
          actualizado_en: new Date().toISOString(),
          actualizado_por: administrador.id,
        });
      if (error) throw new Error(error.message);
      return json({ ok: true });
    }

    if (accion === 'crear') {
      const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
      const rol = body.rol;
      const pin = body.pin;
      const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
      if (nombre.length < 2 || nombre.length > 80) {
        return json({ error: 'El nombre debe tener entre 2 y 80 caracteres.' }, 400);
      }
      if (!esRol(rol)) return json({ error: 'Selecciona un rol válido.' }, 400);
      if (telefono && !/^\d{7,15}$/.test(telefono)) {
        return json({ error: 'El teléfono debe tener entre 7 y 15 dígitos.' }, 400);
      }
      if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
        return json({ error: 'El PIN debe tener exactamente 4 dígitos.' }, 400);
      }

      const usuarioId = crypto.randomUUID();
      const emailInterno = `usuario-${usuarioId}@mrparrilla.invalid`;
      const claveInterna = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        id: usuarioId,
        email: emailInterno,
        password: claveInterna,
        email_confirm: true,
      });
      if (authError || !authData.user) throw new Error(authError?.message ?? 'No se pudo crear el acceso.');

      const pinHash = await bcrypt.hash(pin, 10);
      const { error: perfilError } = await supabaseAdmin.from('usuarios').insert({
        id: authData.user.id,
        nombre,
        rol,
        telefono: telefono || null,
        pin_hash: pinHash,
        activo: true,
        intentos_fallidos: 0,
        bloqueado_hasta: null,
      });

      if (perfilError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(perfilError.message);
      }

      return json({ ok: true });
    }

    if (accion === 'actualizar') {
      const id = typeof body.id === 'string' ? body.id : '';
      const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
      const rol = body.rol;
      const activo = body.activo;
      const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
      if (!id || nombre.length < 2 || nombre.length > 80 || !esRol(rol) || typeof activo !== 'boolean') {
        return json({ error: 'Revisa el nombre, rol y estado del usuario.' }, 400);
      }
      if (telefono && !/^\d{7,15}$/.test(telefono)) {
        return json({ error: 'El teléfono debe tener entre 7 y 15 dígitos.' }, 400);
      }

      if (id === administrador.id && (!activo || rol !== 'admin')) {
        return json({ error: 'No puedes quitarte el acceso de administrador mientras tienes la sesión abierta.' }, 400);
      }

      const { data: existente, error: existenteError } = await supabaseAdmin
        .from('usuarios')
        .select('id, rol, activo')
        .eq('id', id)
        .single();
      if (existenteError || !existente) return json({ error: 'No se encontró el usuario.' }, 404);

      if (existente.rol === 'admin' && existente.activo && (!activo || rol !== 'admin')) {
        await protegerUltimoAdministrador(id);
      }

      if (existente.activo !== activo) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
          ban_duration: activo ? 'none' : '876000h',
        });
        if (authError) throw new Error(authError.message);
      }

      const { error } = await supabaseAdmin
        .from('usuarios')
        .update({ nombre, rol, activo, telefono: telefono || null })
        .eq('id', id);
      if (error && existente.activo !== activo) {
        await supabaseAdmin.auth.admin.updateUserById(id, {
          ban_duration: existente.activo ? 'none' : '876000h',
        });
      }
      if (error) {
        throw new Error(error.message);
      }
      return json({ ok: true });
    }

    if (accion === 'restablecer_pin') {
      const id = typeof body.id === 'string' ? body.id : '';
      const pin = body.pin;
      if (!id || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
        return json({ error: 'El PIN debe tener exactamente 4 dígitos.' }, 400);
      }

      const { data: authData, error: authLookupError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (authLookupError || !authData.user) {
        return json({ error: 'No se encontró la cuenta de autenticación del usuario.' }, 404);
      }

      // El siguiente login debe recalcular la contraseña interna derivada del nuevo PIN.
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        app_metadata: { ...(authData.user.app_metadata ?? {}), pin_auth_version: 0 },
      });
      if (authUpdateError) throw new Error(authUpdateError.message);

      const pinHash = await bcrypt.hash(pin, 10);
      const { error } = await supabaseAdmin
        .from('usuarios')
        .update({ pin_hash: pinHash, intentos_fallidos: 0, bloqueado_hasta: null })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return json({ ok: true });
    }

    return json({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo completar la acción.';
    const status = message.includes('último administrador') ? 409 : 500;
    return json({ error: message }, status);
  }
});
