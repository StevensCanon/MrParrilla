"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BiSolidDashboard } from "react-icons/bi";
import { GiForkKnifeSpoon, GiFireBowl } from "react-icons/gi";
import { IoIosListBox, IoChatboxEllipses } from "react-icons/io5";
import { MdTableBar } from "react-icons/md";
import { FaKitchenSet } from "react-icons/fa6";
import { FaCashRegister } from "react-icons/fa";
import { Users, Wallet, LogOut, Settings } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabaseClient";

type RolUsuario = "admin" | "mesero" | "cajero" | "cocina";

const menuPrincipal = [
  { title: "Dashboard", href: "/dashboard", icon: BiSolidDashboard },
  { title: "Platos", href: "/dashboard/platos", icon: GiForkKnifeSpoon },
  { title: "Menús", href: "/dashboard/menus", icon: GiFireBowl },
  { title: "Caja", href: "/dashboard/caja", icon: FaCashRegister },
  { title: "Mesas", href: "/dashboard/mesas", icon: MdTableBar },
  { title: "Pedidos", href: "/dashboard/pedidos", icon: IoChatboxEllipses },
  { title: "Cocina", href: "/dashboard/cocina", icon: FaKitchenSet },
  { title: "Inventario", href: "/dashboard/inventario", icon: IoIosListBox },
];

const menuGestion = [
  { title: "Clientes", href: "/dashboard/clientes", icon: Users },
  { title: "Finanzas", href: "/dashboard/finanzas", icon: Wallet },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [rolUsuario, setRolUsuario] = useState<RolUsuario | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarRol = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (activo && data?.rol) {
        setRolUsuario(data.rol as RolUsuario);
      }
    };

    void cargarRol();

    return () => {
      activo = false;
    };
  }, [router]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const nombresRoles: Record<RolUsuario, string> = {
    admin: "Administrador",
    mesero: "Mesero",
    cajero: "Cajero",
    cocina: "Cocinera",
  };

  const rutaActiva = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-[#E5E0D7] bg-white">
        <SidebarHeader className="border-b border-[#E5E0D7]">
          <div className="flex h-14 items-center gap-3 px-2">
            <Image
              src="/Logo.png"
              alt="MrParrilla"
              width={48}
              height={48}
              className="size-10 object-contain"
              loading="eager"
            />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-black text-[#22201D]">MrParrilla</p>
              <span className="mt-1 inline-flex rounded-md bg-[#FFF0EA] px-2 py-0.5 text-[11px] font-semibold text-[#B84D31]">
                {rolUsuario ? nombresRoles[rolUsuario] : "Usuario"}
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-[#918A7E]">
              Principal
            </SidebarGroupLabel>
            <SidebarMenu>
              {menuPrincipal.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={rutaActiva(item.href)}
                    tooltip={item.title}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon size={17} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-[#918A7E]">
              Gestión
            </SidebarGroupLabel>
            <SidebarMenu>
              {menuGestion.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={rutaActiva(item.href)}
                    tooltip={item.title}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon size={17} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-[#E5E0D7] p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Configuración"
                onClick={() => router.push("/dashboard/configuracion")}
              >
                <Settings size={17} />
                <span>Configuración</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Cerrar sesión" onClick={() => void cerrarSesion()}>
                <LogOut size={17} />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#F8F6F1] text-[#22201D]">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-[#E5E0D7] bg-white/95 px-4 backdrop-blur">
          <SidebarTrigger className="text-[#5F594F]" />
          <div className="h-5 w-px bg-[#E5E0D7]" />
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#C85C3D]" />
            <span className="text-sm font-semibold text-[#38342E]">
              Gestión del restaurante
            </span>
          </div>
        </header>
        <div className="min-h-[calc(100vh-3.5rem)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
