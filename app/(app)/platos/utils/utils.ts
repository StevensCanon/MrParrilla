export function formatearDinero(valor: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Math.round(Number(valor) || 0));
  }
  
  export function formatearCategoria(categoria: string): string {
    return categoria
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  }
  
  export function obtenerClasePuntoCategoria(categoria: string): string {
    switch (categoria) {
      case "desayuno":
        return "bg-amber-500";
  
      case "almuerzo":
        return "bg-blue-500";
  
      case "bebida":
        return "bg-green-500";
  
      case "adicional":
        return "bg-violet-500";
  
      case "combos":
        return "bg-red-500";
  
      default:
        return "bg-[#B6B1A2]";
    }
  }