export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { error: 'Falta la configuración de Supabase' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/login-pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ error: 'Respuesta inválida del servidor' }));

  if (res.status === 404 && data?.code === 'NOT_FOUND') {
    return Response.json(
      {
        error:
          'La función login-pin no está desplegada. En la carpeta del proyecto ejecuta: supabase functions deploy login-pin',
      },
      { status: 404 }
    );
  }

  return Response.json(data, { status: res.status });
}
