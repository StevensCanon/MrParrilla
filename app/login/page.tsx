'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Usuario = { id: string; nombre: string; rol: string };

const RUTA_POR_ROL: Record<string, string> = {
  admin: '/dashboard',
  cajero: '/dashboard', // aún no existe pantalla propia de cajero
  mesero: '/dashboard', // aún no existe pantalla propia de mesero
  cocina: '/dashboard', // aún no existe pantalla propia de cocina
};

function iniciales(nombre: string) {
  return nombre.slice(0, 2).toUpperCase();
}

export default function LoginPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    async function cargarUsuarios() {
      const { data, error } = await supabase.rpc('usuarios_para_login');
      if (!error) setUsuarios(data || []);
    }
    cargarUsuarios();
  }, []);

  async function tecla(k: string) {
    setError('');
    if (k === 'borrar') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4 || !seleccionado) return;
    const nuevoPin = pin + k;
    setPin(nuevoPin);

    if (nuevoPin.length === 4) {
      setCargando(true);
      try {
        const res = await fetch('/api/login-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: seleccionado.id, pin: nuevoPin }),
        });
        const data = await res.json();

console.log('LOGIN STATUS:', res.status);
console.log('LOGIN RESPONSE:', data);

if (!res.ok) {
  setError(data.error || 'PIN incorrecto');
  setPin('');
  return;
}

        sessionStorage.setItem('sesion', JSON.stringify(data));
        router.push(RUTA_POR_ROL[data.usuario.rol] || '/dashboard');
      } catch {
        setError('No se pudo conectar. Revisa que la función login-pin esté desplegada.');
        setPin('');
      } finally {
        setCargando(false);
      }
    }
  }

  if (!seleccionado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FBF9F4] p-6">
        <div className="w-full max-w-sm">
          <p className="text-center text-sm text-[#5B5648] mb-4">¿Quién eres?</p>
          <div className="grid grid-cols-2 gap-3">
            {usuarios.map((u) => (
              <button
                key={u.id}
                onClick={() => setSeleccionado(u)}
                className="flex flex-col items-center gap-2 p-4 border border-[#D9D2C3] rounded-sm bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-[#EFE7DA] flex items-center justify-center text-sm font-semibold text-[#2E4034]">
                  {iniciales(u.nombre)}
                </div>
                <span className="text-sm font-medium">{u.nombre}</span>
                <span className="text-xs text-[#8A8375] capitalize">{u.rol}</span>
              </button>
            ))}
          </div>
          {usuarios.length === 0 && (
            <p className="text-center text-xs text-[#8A8375] mt-4">
              No hay usuarios activos todavía — créalos desde Supabase.
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FBF9F4] gap-4 p-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{seleccionado.nombre}</span>
        <button
          onClick={() => {
            setSeleccionado(null);
            setPin('');
            setError('');
          }}
          className="text-xs text-[#8A8375] underline"
        >
          Cambiar
        </button>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border border-[#5B5648] ${
              i < pin.length ? 'bg-[#22201D]' : ''
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-[#A3402A] h-4">{cargando ? 'Verificando…' : error}</p>

      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'borrar'].map((k, i) =>
          k === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => tecla(k)}
              disabled={cargando}
              className="w-14 h-14 border border-[#D9D2C3] rounded-sm bg-white text-lg"
            >
              {k === 'borrar' ? '⌫' : k}
            </button>
          )
        )}
      </div>
    </main>
  );
}