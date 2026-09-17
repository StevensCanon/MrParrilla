import {
    useCallback,
    useState,
  } from "react";
  
  import {
    actualizarProducto,
    crearProducto,
    eliminarProducto as eliminarProductoDB,
    obtenerProductos,
  } from "../libs/libs";
  
  import {
    FORMULARIO_INICIAL,
  } from "../constants/constants";
  
  import type {
    FormularioProducto,
    Producto,
  } from "../types/types";
  
  export function useInventario() {
    const [productos, setProductos] =
      useState<Producto[]>([]);
  
    const [cargando, setCargando] =
      useState(true);
  
    const [guardando, setGuardando] =
      useState(false);
  
    const [error, setError] =
      useState<string | null>(null);
  
    const [modalAbierto, setModalAbierto] =
      useState(false);
  
    const [productoEditando, setProductoEditando] =
      useState<Producto | null>(null);
  
    const [formulario, setFormulario] =
      useState<FormularioProducto>(
        FORMULARIO_INICIAL,
      );
  
    const cargarProductos = useCallback(
      async () => {
        try {
          setCargando(true);
          setError(null);
  
          const datos =
            await obtenerProductos();
  
          setProductos(datos);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el inventario.",
          );
        } finally {
          setCargando(false);
        }
      },
      [],
    );
  
    const abrirCrear = useCallback(() => {
      setProductoEditando(null);
      setFormulario(FORMULARIO_INICIAL);
      setError(null);
      setModalAbierto(true);
    }, []);
  
    const abrirEditar = useCallback(
      (producto: Producto) => {
        setProductoEditando(producto);
  
        setFormulario({
          nombre: producto.nombre,
          categoria:
            producto.categoria ?? "",
          unidad: producto.unidad,
          stock: String(producto.stock),
          costo: String(producto.costo),
          stock_minimo:
            String(producto.stock_minimo),
        });
  
        setError(null);
        setModalAbierto(true);
      },
      [],
    );
  
    const cerrarModal = useCallback(() => {
      if (guardando) {
        return;
      }
  
      setModalAbierto(false);
      setProductoEditando(null);
      setFormulario(FORMULARIO_INICIAL);
    }, [guardando]);
  
    const cambiarCampo = useCallback(
      (
        campo: keyof FormularioProducto,
        valor: string,
      ) => {
        setFormulario((actual) => ({
          ...actual,
          [campo]: valor,
        }));
      },
      [],
    );
  
    const guardarProducto = useCallback(
      async (): Promise<boolean> => {
        setError(null);
  
        const nombre =
          formulario.nombre.trim();
  
        if (!nombre) {
          setError(
            "Ingresa el nombre del producto.",
          );
          return false;
        }
  
        const stock =
          Number(formulario.stock);
  
        const costo =
          Number(formulario.costo);
  
        const stockMinimo =
          Number(formulario.stock_minimo);
  
        if (
          Number.isNaN(stock) ||
          Number.isNaN(costo) ||
          Number.isNaN(stockMinimo)
        ) {
          setError(
            "Revisa los valores numéricos.",
          );
          return false;
        }
  
        if (
          stock < 0 ||
          costo < 0 ||
          stockMinimo < 0
        ) {
          setError(
            "Los valores no pueden ser negativos.",
          );
          return false;
        }
  
        setGuardando(true);
  
        try {
          const datos = {
            nombre,
            categoria:
              formulario.categoria || null,
            unidad: formulario.unidad,
            stock,
            costo,
            stock_minimo: stockMinimo,
          };
  
          if (productoEditando) {
            await actualizarProducto(
              productoEditando.id,
              datos,
            );
          } else {
            await crearProducto(datos);
          }
  
          const productosActualizados =
            await obtenerProductos();
  
          setProductos(
            productosActualizados,
          );
  
          setModalAbierto(false);
          setProductoEditando(null);
          setFormulario(
            FORMULARIO_INICIAL,
          );
  
          return true;
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo guardar el producto.",
          );
  
          return false;
        } finally {
          setGuardando(false);
        }
      },
      [
        formulario,
        productoEditando,
      ],
    );
  
    const eliminarProducto = useCallback(
      async (
        producto: Producto,
      ): Promise<boolean> => {
        setError(null);
  
        try {
          await eliminarProductoDB(
            producto.id,
          );
  
          setProductos((actuales) =>
            actuales.filter(
              (actual) =>
                actual.id !== producto.id,
            ),
          );
  
          return true;
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo eliminar el producto.",
          );
  
          return false;
        }
      },
      [],
    );
  
    return {
      productos,
      cargando,
      guardando,
      error,
      setError,
  
      modalAbierto,
      setModalAbierto,
  
      productoEditando,
  
      formulario,
      setFormulario,
  
      cargarProductos,
      abrirCrear,
      abrirEditar,
      cerrarModal,
      cambiarCampo,
      guardarProducto,
      eliminarProducto,
    };
  }