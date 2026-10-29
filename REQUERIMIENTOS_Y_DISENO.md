# Requerimientos y diseño — Apex Race Control

## 1. Propósito y alcance

Apex Race Control es una aplicación web para administrar información de competencias automovilísticas. La interfaz incluye módulos operativos y una pantalla de administración de catálogos conectada a una API local y a MySQL.

Este documento describe:

- Los requerimientos funcionales y no funcionales.
- El modelo de datos actualmente implementado y una propuesta relacional normalizada.
- La arquitectura del backend y del frontend.
- Los pasos para ejecutar el proyecto en Windows.
- Un espacio reservado para prompts que serán agregados posteriormente por el usuario.

### Estado actual

La aplicación es un prototipo. El panel de administración permite consultar, agregar y editar registros de equipos, pilotos, vehículos, campeonatos, circuitos, eventos y clasificaciones. La interfaz edita cada registro como JSON para preservar datos anidados.

Las otras pantallas aún usan los datos de demostración incluidos en el frontend. El inicio de sesión y los roles son simulados. La API local no implementa autenticación ni autorización propia.

## 2. Cómo ejecutar el proyecto en Windows

### Requisitos previos

- Node.js compatible con las dependencias del proyecto y npm.
- Un servidor MySQL accesible desde esta computadora.
- El host, el puerto, el usuario y la contraseña de conexión a MySQL. El puerto configurado por defecto es `40628`.
- Un cliente MySQL, por ejemplo MySQL Workbench, para ejecutar el esquema.

### Preparación de MySQL

1. Abre `database/schema.sql` en tu cliente MySQL.
2. Conéctate al servidor MySQL correcto y ejecuta el script. Se crea la base `apex_race_control` y las tablas de catálogos.
3. Confirma que el usuario configurado tenga permisos para consultar e insertar datos en esa base.

### Configuración del proyecto

El proyecto utiliza variables de entorno para evitar incluir la contraseña de MySQL en el código:

1. Si todavía no existe `.env`, crea una copia de `.env.example` desde PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Si `.env` ya existe, no lo sobrescribas.

2. Abre `.env` localmente y configura estos valores. No publiques ni compartas la contraseña:

   ```dotenv
   DB_HOST=127.0.0.1
   DB_PORT=40628
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_DATABASE=apex_race_control
   API_PORT=3001
   ```

   `DB_HOST` debe ser el host proporcionado por tu administrador o proveedor de MySQL; `127.0.0.1` solo funciona si MySQL está en esta misma computadora.

### Inicio

Abre dos terminales de PowerShell en la carpeta del proyecto.

En la primera, inicia el backend:

```powershell
npm run api
```

La API debe indicar que está lista en `http://127.0.0.1:3001`. Si muestra un error de conexión, revisa el host, puerto, credenciales, permisos y que hayas ejecutado el esquema.

En la segunda terminal, inicia el frontend:

```powershell
npm run dev
```

Abre la URL que indique Vite, normalmente `http://localhost:5173`. Inicia sesión con el rol Organizador de la demostración y entra a **Administración → Base de datos**.

Si la base está vacía, usa **Cargar datos de ejemplo**. Esta acción solo se habilita cuando todos los catálogos están vacíos. Luego puedes elegir un catálogo, agregar registros o editar uno existente.

Para detener cada proceso, presiona `Ctrl+C` en su terminal.

### Validación

```powershell
npm run build
node --check server/index.js
```

## 3. Requerimientos funcionales

| ID | Requerimiento | Estado |
|---|---|---|
| RF-01 | El sistema permitirá consultar los catálogos de equipos, pilotos, vehículos, campeonatos, circuitos, eventos y clasificaciones desde la pantalla de base de datos. | Implementado |
| RF-02 | El sistema permitirá agregar registros a los catálogos soportados. | Implementado |
| RF-03 | El sistema permitirá editar un registro existente conservando sus campos anidados. | Implementado; editor JSON |
| RF-04 | El sistema mostrará los totales por catálogo y permitirá actualizar la información visible. | Implementado |
| RF-05 | El sistema permitirá buscar registros por nombre o identificador en el catálogo seleccionado. | Implementado |
| RF-06 | El sistema podrá cargar los datos de demostración si todos los catálogos de la base están vacíos. | Implementado |
| RF-07 | La API validará que el cuerpo de una solicitud sea un objeto y que ciertos campos básicos del catálogo sean válidos. | Implementado; validación básica |
| RF-08 | El sistema permitirá iniciar y detener una carrera simulada desde la aplicación. | Implementado con datos del frontend; no persiste en MySQL |
| RF-09 | Los módulos operativos y fichas deberán leer los registros persistidos en MySQL en lugar de depender de los datos de demostración. | Pendiente |
| RF-10 | El sistema deberá ofrecer formularios específicos por entidad con validación contextual. | Pendiente; actualmente se edita JSON |
| RF-11 | El sistema deberá permitir eliminar registros con confirmación y reglas de integridad. | Pendiente; no existe endpoint de eliminación |
| RF-12 | El sistema deberá administrar cuentas reales, autenticación y permisos en el servidor. | Pendiente; autenticación actual simulada |
| RF-13 | El sistema deberá gestionar sesiones, inscripciones y resultados como registros consultables de forma independiente. | Pendiente de normalización |

## 4. Requerimientos no funcionales

| ID | Requerimiento |
|---|---|
| RNF-01 | Las credenciales de MySQL se configurarán mediante variables de entorno locales y no se expondrán al código del navegador. |
| RNF-02 | La API estará separada del frontend y se comunicará mediante HTTP/JSON. En desarrollo, Vite reenviará `/api` al backend local. |
| RNF-03 | Las consultas a MySQL utilizarán parámetros para los valores de entrada; los nombres de tablas se resolverán mediante una lista permitida en el backend. |
| RNF-04 | El backend devolverá errores HTTP y mensajes comprensibles cuando una operación falle; los detalles técnicos se registrarán en la consola del servidor. |
| RNF-05 | El esquema y los datos de texto utilizarán `utf8mb4` para soportar caracteres en español y otros idiomas. |
| RNF-06 | La inicialización de datos de ejemplo será transaccional y no sobrescribirá una base que ya tenga registros. |
| RNF-07 | El proyecto deberá pasar `npm run build` y `node --check server/index.js` antes de distribuir cambios. |
| RNF-08 | El backend actual escucha únicamente en `127.0.0.1`; no debe exponerse a Internet sin autenticación, autorización, controles de origen, limitación de solicitudes y configuración de despliegue segura. |
| RNF-09 | El prototipo no deberá considerarse listo para producción mientras la API permita operaciones sin verificar la identidad y los permisos del usuario. |
| RNF-10 | Para grandes volúmenes de datos, la API deberá añadir paginación, filtros en servidor y límites explícitos a las respuestas. |

## 5. Modelo de datos

### 5.1 Esquema actualmente implementado

El archivo `database/schema.sql` crea estas tablas:

| Tabla | Propósito |
|---|---|
| `teams` | Catálogo de equipos |
| `drivers` | Catálogo de pilotos |
| `vehicles` | Catálogo de vehículos |
| `championships` | Catálogo de campeonatos |
| `circuits` | Catálogo de circuitos |
| `events` | Catálogo de eventos |
| `standings` | Clasificación de pilotos |
| `team_standings` | Clasificación de equipos |

Cada tabla incluye:

- `id VARCHAR(64)`: clave primaria del registro.
- `data JSON`: documento con los campos de la entidad.
- `created_at` y `updated_at`: fechas de creación y última actualización.

**Importante:** este esquema es híbrido: separa los catálogos en tablas, pero sus atributos y referencias se almacenan dentro de `data` como JSON. Las referencias como `teamId`, `vehicleId`, `championshipId` y `circuitId` son valores de aplicación, no claves foráneas MySQL. Por tanto, las relaciones descritas a continuación son el modelo conceptual del dominio; no todas están impuestas por el esquema actual.

### 5.2 Modelo relacional conceptual recomendado

Para una versión normalizada, se recomienda separar los objetos anidados en tablas y usar claves foráneas:

| Entidad | Clave primaria | Atributos/relaciones principales |
|---|---|---|
| `teams` | `id` | Nombre, nombre corto, país, color, principal |
| `vehicles` | `id` | Número, marca, modelo, categoría, estado; `team_id` referencia `teams.id` |
| `drivers` | `id` | Nombre, nacionalidad, número, licencia, categoría; `team_id` referencia `teams.id`; `vehicle_id` referencia `vehicles.id` cuando aplique |
| `championships` | `id` | Nombre, temporada, estado, organizador, descripción |
| `circuits` | `id` | Nombre, ciudad, país, longitud, número de curvas, zona horaria |
| `events` | `id` | Nombre, fecha, ronda, estado; `championship_id` referencia `championships.id`; `circuit_id` referencia `circuits.id` |
| `event_sessions` | `id` | Tipo, nombre, fecha, hora, duración, estado y vueltas; `event_id` referencia `events.id` |
| `event_entries` | Compuesta: `event_id`, `driver_id` | Inscripciones de pilotos a eventos; ambas columnas son claves foráneas |
| `session_results` | Compuesta: `session_id`, `driver_id` | Posición, tiempo y puntos; referencias a `event_sessions` y `drivers` |
| `standings` | `id` o clave compuesta | Posición y puntos; referencias al campeonato y piloto |
| `team_standings` | `id` o clave compuesta | Posición y puntos; referencias al campeonato y equipo |
| `vehicle_documents` | `id` | Nombre, fecha de vencimiento y estado; `vehicle_id` referencia `vehicles.id` |
| `vehicle_checklist_items` | `id` | Etiqueta y resultado de inspección; `vehicle_id` referencia `vehicles.id` |

Relaciones principales:

```text
teams          1 ─── N vehicles
teams          1 ─── N drivers
vehicles       1 ─── N drivers (según la política de asignación)
championships  1 ─── N events
circuits       1 ─── N events
events         1 ─── N event_sessions
events         N ─── N drivers, mediante event_entries
event_sessions N ─── N drivers, mediante session_results
championships  1 ─── N standings de pilotos y equipos
vehicles       1 ─── N documentos y elementos de checklist
```

La normalización y la adopción de claves foráneas deberán realizarse mediante una migración que transforme los documentos JSON existentes y valide referencias antes de retirar datos anteriores.

## 6. Backend

### Tecnologías

- Node.js y Express.
- `mysql2/promise` para la conexión y consultas a MySQL.
- `dotenv` para leer configuración desde `.env`.
- API REST local, consumida por el frontend.

### Configuración

| Variable | Uso | Valor de ejemplo |
|---|---|---|
| `DB_HOST` | Host MySQL | `127.0.0.1` |
| `DB_PORT` | Puerto MySQL | `40628` |
| `DB_USER` | Usuario MySQL | Definido localmente |
| `DB_PASSWORD` | Contraseña MySQL | Definida localmente |
| `DB_DATABASE` | Base de datos | `apex_race_control` |
| `API_PORT` | Puerto HTTP del backend | `3001` |

### Endpoints actuales

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/api/health` | Comprueba la conexión de API a MySQL |
| `GET` | `/api/counts` | Consulta los totales de los catálogos |
| `GET` | `/api/:resource` | Lista un catálogo permitido |
| `POST` | `/api/:resource` | Agrega un registro |
| `PUT` | `/api/:resource/:id` | Edita un registro existente |
| `POST` | `/api/bootstrap` | Inserta datos de ejemplo en una base vacía |

Los valores admitidos para `:resource` son `teams`, `vehicles`, `drivers`, `circuits`, `championships`, `events`, `standings` y `teamStandings`. No existe una ruta `DELETE` en esta versión.

### Responsabilidades del backend

- Validar las solicitudes y devolver códigos HTTP apropiados.
- Mantener las credenciales fuera del frontend.
- Permitir operaciones únicamente sobre los catálogos definidos.
- Guardar y consultar los documentos JSON en MySQL.
- Informar errores de conexión o persistencia sin presentar la operación como exitosa.

### Trabajo pendiente del backend

- Autenticación real y autorización por rol en cada endpoint.
- Validación de esquema completa por entidad.
- Claves foráneas, transacciones de negocio y tratamiento de referencias inválidas.
- Endpoints de eliminación protegida, paginación y filtros.
- Auditoría persistente, pruebas de API y gestión de migraciones.

## 7. Frontend

### Tecnologías

- React y TypeScript.
- Vite para el servidor de desarrollo y la compilación.
- React Router para navegación.
- Tailwind CSS para estilos.

### Pantalla de administración de base de datos

La página se encuentra en **Administración → Base de datos** y contiene:

- Selector de catálogo y contador de registros.
- Búsqueda por nombre o identificador.
- Acciones para agregar y editar registros.
- Editor JSON para campos sencillos y anidados.
- Carga inicial de datos de demostración si la base está completamente vacía.
- Indicadores de conexión y errores de API.

Vite configura un proxy de desarrollo para que las solicitudes de `/api` lleguen a `http://127.0.0.1:3001`.

### Trabajo pendiente del frontend

- Cambiar los módulos operativos para leer y guardar sus datos mediante la API.
- Sustituir el editor JSON por formularios y controles validados por entidad.
- Añadir confirmación de eliminación, estados de carga y prevención de pérdida de cambios.
- Manejar la sesión del usuario real y ocultar acciones según permisos verificados por el backend.

## 8. Espacio para prompts

Este apartado queda reservado para los prompts que agregará el usuario.

### Prompt 1


### Prompt 2


### Prompt 3


### Prompt 4


### Prompt 5


