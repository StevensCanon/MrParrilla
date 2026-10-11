# Arquitectura del bot de WhatsApp de MrParrilla

## Objetivo

Atender pedidos a domicilio por WhatsApp y registrar la comanda en MrParrilla sin duplicar pedidos ni confiar en precios enviados por el cliente. La integración se hará con la API oficial de WhatsApp Cloud API cuando Meta permita completar el alta del portfolio comercial y del número oficial.

## Estado actual del repositorio

- Aplicación Next.js App Router con TypeScript.
- Supabase se usa desde `lib/supabaseClient.ts` con el cliente de navegador y la clave publicable.
- Los platos se consultan desde `platos` (`id`, `nombre`, `categoria`, `precio`, `disponible`).
- Los menús se modelan con `menus`, `menu_platos`, `menu_grupos` y `menu_opciones`; las opciones pueden tener recargo, agotamiento y porciones disponibles/reservadas/consumidas.
- Hay lógica de pedidos en `comandas` y `comanda_items`, pero el esquema completo no está versionado en los archivos SQL del repositorio. Antes de escribir pedidos desde el bot hay que confirmar los nombres, valores de enums, políticas RLS y relaciones directamente contra el esquema real de Supabase.
- No hay todavía un endpoint de webhook de WhatsApp en `app/api`.

## Arquitectura propuesta

1. **Webhook de WhatsApp** — `app/api/whatsapp/webhook/route.ts`
   - GET: validar el token de verificación y devolver el challenge de Meta.
   - POST: validar la firma `X-Hub-Signature-256` con el secreto de la app antes de procesar el cuerpo.
   - Responder rápidamente a Meta y procesar de forma idempotente para tolerar reintentos.

2. **Adaptador de WhatsApp** — `lib/whatsapp/cloud-api.ts`
   - Enviar mensajes usando la API Graph de Meta con `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`.
   - No exponer tokens en el navegador, respuestas de API ni logs.
   - Mantener la versión de Graph API en una variable/configuración centralizada.

3. **Motor conversacional independiente del proveedor** — `lib/whatsapp/bot-engine.ts`
   - Recibir el mensaje normalizado, el estado de conversación y el catálogo vigente.
   - Devolver el texto de respuesta, el siguiente estado y una acción tipada.
   - No consultar Supabase directamente ni crear comandas; esa responsabilidad queda en los servicios de aplicación.

4. **Servicios de aplicación y datos**
   - Consultar el menú del día y sus opciones disponibles desde el servidor.
   - Validar disponibilidad, cantidades y precios siempre en el servidor.
   - Guardar el borrador de pedido por número de teléfono y estado.
   - Crear la comanda solo después de que el cliente confirme explícitamente el resumen.
   - Guardar el identificador de cada mensaje entrante procesado para evitar duplicados por reintentos.
   - Definir de forma explícita el flujo de entrega/domicilio, datos de contacto, dirección, costo de domicilio y método de pago antes de activar pedidos reales.

5. **Configuración y secretos**
   - Variables previstas: `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_GRAPH_API_VERSION`.
   - Los secretos se configuran en el entorno local/de despliegue; nunca se guardan en Git.
   - `.env*` ya está excluido por `.gitignore`.

## Flujo de conversación inicial

1. Saludo y menú de opciones.
2. Consultar menú disponible del día.
3. Elegir plato y opciones requeridas.
4. Elegir cantidades y agregar más productos.
5. Capturar nombre, teléfono (normalizado desde WhatsApp) y dirección de entrega.
6. Mostrar resumen con precios calculados en servidor.
7. Confirmar o cancelar.
8. Crear la comanda una sola vez y responder con su número/identificador.

## Orden de implementación

- **Fase 1 — Contratos y esquema:** confirmar el esquema real de `conversaciones_whatsapp`, `comandas`, `comanda_items`, menús, opciones y reservas; revisar RLS y enums.
- **Fase 2 — Motor y simulador local:** probar el diálogo sin Meta ni pedidos reales.
- **Fase 3 — Persistencia:** guardar estado del diálogo y carrito de forma segura en Supabase.
- **Fase 4 — Cloud API:** implementar webhook, firma, envío de mensajes y deduplicación.
- **Fase 5 — Pruebas integrales:** verificar mensajes repetidos, cancelaciones, platos agotados, precios cambiados, errores de red y confirmación de pedido.
- **Fase 6 — Producción:** conectar el número oficial, revisar permisos, privacidad, política de mensajes y configuración de despliegue.

## Regla de seguridad

El bot no debe crear una comanda a partir de un mensaje ambiguo ni aceptar el total calculado por el cliente. Debe reconstruir el pedido y su precio con datos actuales de Supabase y solicitar una confirmación explícita antes de registrar la venta.
