# Apex Race Control

Plataforma modular de gestión de carreras de motorsport. Consola operativa para organización, dirección de carrera, comisarios, cronometraje, equipos y prensa, con **live timing simulado en tiempo real** y catálogos persistentes en MySQL.

> La carrera continúa siendo una simulación de navegador. La administración de equipos, pilotos, vehículos, campeonatos, circuitos, eventos y clasificaciones ahora se puede guardar en MySQL.

## Stack

| Capa | Tecnología |
| --- | --- |
| Build | Vite 8 |
| UI | React 19 + TypeScript 7 |
| Estilos | Tailwind CSS 4 |
| Rutas | React Router 7 |
| Estado | Zustand 5 (con persistencia de sesión) |
| API | Express 5 + mysql2 |
| Base de datos | MySQL |
| Gráficas | Recharts 3 |
| Iconos | lucide-react |
| Tipografías | Barlow Condensed · Inter Variable · IBM Plex Mono (Fontsource) |

## Puesta en marcha

Después de configurar MySQL y el archivo `.env` siguiendo la sección siguiente, instala las dependencias:

```bash
npm install
```

Inicia cada proceso en una terminal distinta:

```powershell
npm run api
```

```powershell
npm run dev
```

Abre `http://localhost:5173`.

## Configurar MySQL

1. Abre y ejecuta [`database/schema.sql`](./database/schema.sql) en MySQL, conectándote al servidor que corresponda al puerto `40628`. El script crea la base `apex_race_control` y las tablas de catálogos.
2. Si aún no tienes un archivo `.env`, créalo copiando `.env.example` y completa host, usuario y contraseña. No sobrescribas un `.env` existente. El archivo está excluido de Git:

   ```powershell
   if (!(Test-Path .env)) { Copy-Item .env.example .env }
   ```

3. Abre dos terminales de PowerShell en la carpeta del proyecto. En la primera inicia la API y en la segunda la aplicación:

   ```bash
   npm run api
   ```

   ```bash
   npm run dev
   ```

4. Antes de iniciar la API, define `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env` con credenciales propias y seguras. Esa cuenta tendrá rol Organizador. Abre la dirección que indique Vite, normalmente `http://localhost:5173`; puedes crear una cuenta de consulta desde **Crear cuenta** o entrar con el organizador. Si la base está vacía, usa **Administración → Base de datos → Cargar datos de ejemplo**.

La API solo escucha en `127.0.0.1` y Vite reenvía `/api` al puerto `3001`. El usuario MySQL configurado debe tener permisos sobre `apex_race_control`. Si la conexión falla, revisa el host, puerto, usuario, contraseña y que hayas ejecutado el esquema. Los cambios de catálogo se guardan como JSON para preservar objetos anidados (por ejemplo, sesiones y resultados). La pantalla permite editar el JSON del registro completo.

Consulta [`REQUERIMIENTOS_Y_DISENO.md`](./REQUERIMIENTOS_Y_DISENO.md) para el detalle de requerimientos, modelo de datos, arquitectura y guía de ejecución.

```bash
npm run build     # typecheck + build de producción
npm run preview   # sirve el build
npm run typecheck # solo TypeScript
```

## Login y roles

El registro crea cuentas con rol **Público**. Para crear o actualizar la cuenta **Organizador**, configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`; el servidor valida esas credenciales y guarda las contraseñas de usuarios con hash scrypt y salt. La sesión usa una cookie `HttpOnly` y dura 12 horas; al reiniciar la API, las sesiones activas se invalidan. Los endpoints de datos requieren sesión y solo el Organizador puede crear, modificar o eliminar registros.

| Rol | Acceso destacado |
| --- | --- |
| Organizador | Todo, incluida `/administracion` |
| Dirección de carrera | Control de sesión, sanciones, publicación de resultados |
| Comisario | Sanciones y datos médicos |
| Cronometraje | Edición de tiempos |
| Piloto | Inscripción propia y vista de datos |
| Prensa / Público | Solo consulta |

Los permisos de interfaz se definen en `src/lib/permissions.ts` (`can(role, permission)`). El servidor asigna el rol y no permite cambiarlo desde Ajustes.

## Funcionalidad

- **Dashboard** — estado operativo, sesión en vivo, checklist técnico, próximas sesiones y top 5.
- **Live timing** — clasificación con intervalos, gaps, sectores, vueltas recientes, banderas, safety car, sanciones, feed de eventos y **modo TV** a pantalla completa.
- **Pilotos** — fichas deportivas, licencias, datos médicos protegidos por rol, progresión de puntos (Recharts) y export JSON.
- **Garaje** — verificación técnica, documentación, checklist, especificaciones y export JSON.
- **Campeonatos** — calendario, sesiones por evento, podium, equipos, escala de puntos.
- **Eventos** — programa, mapa del circuito, resultados por sesión, oficiales y export CSV.
- **Clasificación** — pilotos y equipos, resultados por ronda, gráfica de puntos y export CSV.
- **Administración** — usuarios, invitaciones, matriz de permisos y auditoría (solo Organizador).
- **Ajustes** — perfil, preferencias de consola, velocidad de simulación y notificaciones.

### Simulación de carrera

El motor vive en `src/store/useRace.ts`. Avanza cada `2000 / simulationSpeed` ms y cada tick representa ~6 s de sesión: vueltas, sectores, adelantamientos, vueltas rápidas, banderas y mensajes del feed. Los ajustes de velocidad están en `/ajustes`.

## Estructura

```
src/
  components/        UI kit, layout, timing, track map, feed, diálogos
  data/seed.ts       datos ficticios completos (GT Series International 2026)
  lib/               helpers de datos, permisos y utilidades
  pages/             una página por módulo
  store/             useRace (simulación) · useSession (auth, ajustes, toasts)
  types.ts           modelo de dominio
```

## Despliegue

El proyecto es una SPA con `BrowserRouter`. En un hosting estático necesita reescritura de rutas hacia `index.html`:

- **Vercel** — `vercel.json` incluido.
- **Netlify** — `netlify.toml` incluido.
- Cualquier servidor: redirige `/*` a `/index.html` con estado 200.

## Notas

- Datos, pilotos, equipos y circuitos son ficticios.
- La base MySQL guarda los catálogos editados desde Administración. Los demás módulos aún conservan los datos de demostración del cliente.
- Para producción, sirve la API sobre HTTPS y configura variables de entorno fuertes. Netlify/Vercel en este repositorio solo publican la SPA; el backend Express y MySQL deben desplegarse por separado y la URL de API debe configurarse para ese entorno.
- Los exports CSV/JSON se generan en el cliente mediante blobs.
