export type Producto = {
    id: string;
    nombre: string;
    categoria: string | null;
    unidad: string;
    stock: number;
    costo: number;
    stock_minimo: number;
    creado_en: string;
  };
  
  export type FormularioProducto = {
    nombre: string;
    categoria: string;
    unidad: string;
    stock: string;
    costo: string;
    stock_minimo: string;
  };
  
  export type EstadoStock = {
    label: string;
    className: string;
  };