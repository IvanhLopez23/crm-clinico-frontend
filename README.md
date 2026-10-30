# Panel de gestion (frontend)

Next.js 16 (App Router) + React 19 + Tailwind CSS 4.

## Arranque

```bash
# desde frontend/
pnpm install
pnpm dev     # http://localhost:3001
```

Requiere el backend en `http://localhost:3000` (configurable con
`API_BASE_URL` en `.env.local`).

```bash
cp .env.local.example .env.local
```

## Arquitectura

- **Server components + server actions**: el token JWT vive en una cookie
  `httpOnly`; el navegador nunca lo ve.
- **`src/lib/api.ts`**: cliente server-side del backend.
- **`src/lib/session.ts`**: sesion por request (usuario + clinica) con
  `cache()` de React.
- **Multiempresa SaaS**: tokens con `scope=tenant` (clinica + rol) o
  `scope=platform` (administrador SaaS). Los scopes no pueden cruzar rutas y
  el panel `/platform` administra tenants sin exponer PHI entre clinicas.
- **i18n**: español e inglés con cookie `crm_locale`, diccionarios en
  `src/i18n` y selector de idioma en login, panel, portal del especialista,
  plataforma y portal público.
- **`src/app/(app)/`**: layout protegido con sidebar, panel, agenda y
  disponibilidad.
- **Sistema de diseno**: tokens en `src/app/globals.css` (Tailwind `@theme`),
  paleta teal accesible, tipografia Inter, foco visible y estados vacios.
- **Tema claro/oscuro**: clase `dark` en `<html>`, persistida en
  `localStorage` (`crm-theme`), con fallback a `prefers-color-scheme` y toggle
  en sidebar, header movil y login.
- **Notificaciones**: `ToastProvider` global en el layout raíz. Las acciones
  muestran un popup animado arriba a la derecha (o arriba en móvil) con barra
  de progreso, cierre manual y autocierre a los 4.2 s. Los formularios exitosos
  usan `useToastActionState`; las redirecciones usan `FlashToast`.
- **shadcn/ui**: configurado en `components.json`; componentes base en
  `src/components/ui` (Button, Card, Calendar, DatePicker, Dialog, Input,
  Label, Popover, Select, Badge) con los tokens visuales del CRM.

## Pantallas

| Ruta | Contenido |
|---|---|
| `/login` | acceso del personal |
| `/` | panel del dia: KPIs y agenda |
| `/mi-dia` | shell móvil del especialista: citas por día con filtros, expediente, cancelar/reagendar y perfil |
| `/agenda` | agenda por especialista, filtro por especialista, nueva cita y transiciones |
| `/sala` | sala de espera en vivo, semáforo y acciones (SSE) |
| `/tv/sala` | modo TV sin sidebar ni header, con botón de regreso |
| `/pacientes` | busqueda y alta de pacientes |
| `/pacientes/[id]` | ficha 360 editable: datos, alergias, etiquetas, familia, tutores y citas |
| `/especialistas` | alta y listado del equipo |
| `/especialistas/[id]` | perfil, servicios propios con precio/duración, horario semanal y bloqueos |
| `/configuracion` | usuarios, roles y foto opcional (solo admin) |
| `/availability` | huecos por especialista/servicio con actualización automática y agenda directa desde un horario |
| `/mensajes` | bandeja de recordatorios y lista de espera con ofertas de hueco |
| `/reservar/[slug]` | portal público de reservas por clínica |
| `/platform` | panel SaaS: métricas globales, tenants y suspensión |
| `/platform/tenants/[id]` | configuración del tenant y administración de sus usuarios |

## Siguiente

- Reportes financieros y conciliación de pagos.
- Recordatorios por plantillas personalizadas y proveedores reales.
- Portal público con pago de anticipo.
