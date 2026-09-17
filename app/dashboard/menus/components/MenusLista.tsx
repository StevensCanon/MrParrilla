import type { Menu } from '../types/types';

import MenuCard from './MenusCard';
import MenusEmpty from './MenusEmpty';
import MenusLoading from './MenusLoading';

type MenusListaProps = {
  menus: Menu[];
  cargando: boolean;
  hayFiltros: boolean;
  eliminandoMenuId: string | null;
  onCrear: () => void;
  onLimpiar: () => void;
  onVer: (menu: Menu) => void;
  onEditar: (menu: Menu) => void;
  onEliminar: (menu: Menu) => void;
};

export default function MenusLista({
  menus,
  cargando,
  hayFiltros,
  eliminandoMenuId,
  onCrear,
  onLimpiar,
  onVer,
  onEditar,
  onEliminar,
}: MenusListaProps) {
  if (cargando) {
    return <MenusLoading />;
  }

  if (menus.length === 0) {
    return (
      <MenusEmpty
        hayFiltros={hayFiltros}
        onCrear={onCrear}
        onLimpiar={onLimpiar}
      />
    );
  }

  return (
    <div className="divide-y divide-zinc-200">
      {menus.map((menu) => (
        <MenuCard
          key={menu.id}
          menu={menu}
          eliminando={
            eliminandoMenuId === menu.id
          }
          onVer={onVer}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      ))}
    </div>
  );
}