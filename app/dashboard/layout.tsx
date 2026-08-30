"use client";

import {
  LayoutDashboard,
  Utensils,
  Package,
  ClipboardList,
  Table2,
  Users,
  Wallet,
  LogOut,
  Settings,
  ChefHat,
} from "lucide-react";

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

const menuPrincipal = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Platos",
    href: "/dashboard/platos",
    icon: Utensils,
  },
  {
    title: "Inventario",
    href: "/dashboard/inventario",
    icon: Package,
  },
  {
    title: "Pedidos",
    href: "/dashboard/pedidos",
    icon: ClipboardList,
  },
  {
    title: "Mesas",
    href: "/dashboard/mesas",
    icon: Table2,
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

  const cerrarSesion = () => {
    sessionStorage.removeItem("sesion");
    router.push("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-[#E4DED3]">
        {/* HEADER */}
        <SidebarHeader className="border-b border-[#E4DED3]">
          <div className="flex h-14 items-center gap-3 px-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-[#22201D] text-white">
              <ChefHat size={19} />
            </div>

            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-serif text-sm font-semibold text-[#22201D]">
                Restaurante
              </span>

              <span className="text-[10px] uppercase tracking-wider text-[#8A8375]">
                Administración
              </span>
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
              <SidebarMenuButton tooltip="Cerrar sesión" onClick={cerrarSesion}>
                <LogOut size={17} />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* ÁREA PRINCIPAL */}
      <SidebarInset>
        {/* TOPBAR */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-[#E4DED3] bg-[#F8F6F1] px-4">
          <SidebarTrigger />

          <div className="h-5 w-px bg-[#E4DED3]" />

          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#22201D]">
              Administración
            </span>

            <span className="text-[10px] text-[#8A8375]">
              Gestión del restaurante
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
