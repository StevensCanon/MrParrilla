# Arquitectura del bot de WhatsApp de MrParrilla

## Objetivo

Atender pedidos a domicilio desde el número oficial de WhatsApp y registrar las comandas en MrParrilla, sin confiar en precios enviados por el cliente ni crear pedidos por mensajes ambiguos. La conexión con el número real depende de completar la configuración de WhatsApp Cloud API y los permisos comerciales en Meta.

## Estado implementado en `feature/whatsapp-bot-foundation`

- Motor conversacional independiente en `lib/whatsapp/bot-engine.ts`.
- Webhook `app/api/whatsapp/webhook/route.ts`: GET para verificar el challenge de Meta y POST con comprobación HMAC de `X-Hub-Signature-256`.
- Adaptador saliente en `lib/whatsapp/cloud-api.ts`.
- Cliente de Supabase exclusivo del servidor en `lib/whatsapp/supabase-server.ts`, usando `SUPABASE_SERVICE_ROLE_KEY`; esa clave no se debe usar en componentes cliente ni subir a Git.
- Migración `supabase/sql/20261011_whatsapp_bot_foundation.sql` para persistencia, restricción de acceso desde el navegador, conversaciones únicas por teléfono y deduplicación de mensajes entrantes.
- La conversación y la respuesta quedan guardadas en una transacción antes del envío, para que los reintentos no vuelvan a ejecutar el motor ni agreguen dos veces el mismo producto al borrador.

## Configuración

Configura estas variables en el entorno local o de despliegue. No agregues secretos al repositorio:

- `SUPABASE_URL` (o reutiliza `NEXT_PUBLIC_SUPABASE_URL`).
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; nunca `NEXT_PUBLIC_*`).
- `WHATSAPP_VERIFY_TOKEN`.
- `WHATSAPP_APP_SECRET`.
- `WHATSAPP_ACCESS_TOKEN`.
- `WHATSAPP_PHONE_NUMBER_ID`.
- `WHATSAPP_GRAPH_API_VERSION` (formato `vXX.0`, correspondiente a una versión disponible para la aplicación de Meta).

Antes de registrar el webhook en Meta:

1. Ejecuta la migración SQL en el proyecto correcto de Supabase.
2. Si la migración avisa que existen teléfonos duplicados en `conversaciones_whatsapp`, revisa y resuelve esos duplicados; la migración no elimina registros automáticamente.
3. Despliega la aplicación en una URL HTTPS pública.
4. Configura en Meta la URL `/api/whatsapp/webhook`, el mismo token de verificación y la suscripción a mensajes.
5. Conserva todos los secretos únicamente en variables de entorno del servidor.

## Alcance actual y tareas pendientes

Esta entrega permite intercambiar mensajes de texto, consultar platos del menú activo de hoy, añadir productos al borrador, consultar el carrito y conservar el estado entre mensajes. **Todavía no registra comandas reales.** El motor aún necesita el flujo completo de opciones obligatorias/opcionales, cantidades editables, nombre y dirección, costo de domicilio, método de pago, validación de porciones y reservas de `menu_opciones`.

La siguiente fase debe implementar una operación de servidor transaccional para verificar de nuevo menú, productos, precios, opciones y disponibilidad y crear la comanda con `canal = 'whatsapp'`, sus elementos principales/hijos y las reservas correspondientes. Solo después de una confirmación inequívoca del resumen se debe invocar esa operación. La deduplicación de los mensajes es distinta de la idempotencia de creación de comandas; ambas deben mantenerse.

## Seguridad y RLS

Las políticas existentes de `comandas` y `comanda_items` dependen de roles de empleados de MrParrilla. El webhook no debe simular un empleado ni abrir políticas de inserción a `anon`. Las operaciones automatizadas usan una clave de servicio exclusivamente del servidor y deben validar cada dato. Las tablas de conversación quedan sin permisos para `anon` y `authenticated`, mientras el servidor accede a ellas.

No se deben registrar teléfonos, contenido de mensajes, tokens ni cuerpos de respuesta sensibles en logs de producción. Antes de producción también se deben revisar privacidad, mensajes duplicados, reintentos, productos agotados, errores de red y disponibilidad del número oficial.
