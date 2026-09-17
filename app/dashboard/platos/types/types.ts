export type Plato = {
    id: string;
    nombre: string;
    categoria: string;
    precio: number;
    disponible: boolean;
    creado_en: string;
  };
  
  export type FormularioPlato = {
    nombre: string;
    categoria: string;
    precio: string;
    disponible: boolean;
  };
  
  export type PlatoDialogMode = "crear" | "editar";