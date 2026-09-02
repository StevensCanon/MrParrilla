"use client";

import { BiSolidDashboard } from "react-icons/bi";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { IoIosListBox } from "react-icons/io";
import { IoChatboxEllipses } from "react-icons/io5";
import { MdTableBar } from "react-icons/md";
import { FaKitchenSet } from "react-icons/fa6";
import Image from "next/image";

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

import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const menuPrincipal = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BiSolidDashboard,
  },
  {
    title: "Platos",
    href: "/dashboard/platos",
    icon: GiForkKnifeSpoon,
  },
  {
    title: "Inventario",
    href: "/dashboard/inventario",
    icon: IoIosListBox,
  },
  {
    title: "Pedidos",
    href: "/dashboard/pedidos",
    icon: IoChatboxEllipses,
  },
  {
    title: "Mesas",
    href: "/dashboard/mesas",
    icon: MdTableBar,
  },
  {
    title: "Cocina",
    href: "/dashboard/cocina",
    icon: FaKitchenSet,
  },
];

const menuGestion = [
  {
    title: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
  },
  {
    title: "Finanzas",
    href: "/dashboard/finanzas",
    icon: Wallet,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error cerrando sesión:", error);
      return;
    }

    router.push("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-[#E4DED3]">
        {/* HEADER */}
        <SidebarHeader className="border-b border-[#E4DED3]">
          <div className="flex h-14 items-center gap-3 px-2">
            <div className="flex shrink-0 items-center justify-center rounded-sm text-white">
              <Image
                src="/Logo.png"
                alt="Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>

            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-bold text-black">
                MrParrilla
              </span>

              <span className="text-[10px] uppercase tracking-wider text-[#8A8375]"></span>
            </div>
          </div>
        </SidebarHeader>

        {/* CONTENIDO */}
        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-wider text-[#8A8375]">
              Principal
            </SidebarGroupLabel>

            <SidebarMenu>
              {menuPrincipal.map((item) => {
                const activo =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href + "/"));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={activo}
                      tooltip={item.title}
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon size={17} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-wider text-[#8A8375]">
              Gestión
            </SidebarGroupLabel>

            <SidebarMenu>
              {menuGestion.map((item) => {
                const activo =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={activo}
                      tooltip={item.title}
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon size={17} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* FOOTER */}
        <SidebarFooter className="border-t border-[#E4DED3] p-2">
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
              <SidebarMenuButton
                tooltip="Cerrar sesión"
                onClick={cerrarSesion}
              >
                <LogOut size={17} />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* ÁREA PRINCIPAL */}
      <SidebarInset className="text-white">
        {/* TOPBAR */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-white border-b-4 bg-red-800 px-4">
          <SidebarTrigger />

          <div className="h-5 w-px bg-white" />

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              Gestion del Restaurante
            </span>
          </div>
        </header>

        {/* PÁGINA */}
        <div className="min-h-[calc(100vh-3.5rem)] bg-[#F8F6F1]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

