export const PRODUCTOS_POR_PAGINA = 15;

export const CATEGORIAS = [
  {
    value: "Verdura",
    label: "Verdura",
  },
  {
    value: "Grano",
    label: "Grano",
  },
  {
    value: "Aseo",
    label: "Aseo",
  },
  {
    value: "Icopores",
    label: "Icopores",
  },
  {
    value: "Carnes",
    label: "Carnes",
  },
  {
    value: "Salsamentaria",
    label: "Salsamentaria",
  },
  {
    value: "Frutas",
    label: "Frutas",
  },
] as const;

export const UNIDADES = [
  {
    value: "unidad",
    label: "Unidad",
  },
  {
    value: "kg",
    label: "Kilogramos",
  },
  {
    value: "g",
    label: "Gramos",
  },
  {
    value: "litro",
    label: "Litros",
  },
  {
    value: "ml",
    label: "Mililitros",
  },
] as const;

export const FORMULARIO_INICIAL = {
  nombre: "",
  categoria: "",
  unidad: "unidad",
  stock: "0",
  costo: "0",
  stock_minimo: "0",
};