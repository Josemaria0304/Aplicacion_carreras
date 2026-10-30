# APEX RACE CONTROL — DOCUMENTACIÓN TÉCNICA Y MANUAL CRUD

> **Versión:** 2.0.0 (CRUD Engine & Unified Store Architecture)  
> **Archivo Word generado:** [`Documentacion_Apex_Race_Control.docx`](file:///c:/Users/casti/Documents/7%20A/Aplicacion_carreras/Documentacion_Apex_Race_Control.docx)  
> **Stack:** React 19 + TypeScript + Tailwind CSS 4 + Zustand 5 + Express 5 + MySQL

---

## 1. Resumen Ejecutivo y Diagnóstico del Proyecto

### Diagnóstico Inicial
Al analizar el proyecto original **Apex Race Control**, se identificó:
1. **Datos de solo lectura en cliente:** Los módulos de Pilotos (`Drivers.tsx`) y Garaje (`Vehicles.tsx`) leían arreglos estáticos desde `src/data/seed.ts`. Cualquier cambio en la base de datos no se reflejaba en la interfaz.
2. **Falta de operaciones CRUD interactivas:** No existían formularios visuales ni modales para agregar, editar o dar de baja corredores y autos.
3. **Inexistencia de Endpoint DELETE:** La API Express en `server/index.js` carecía de la ruta `DELETE /api/:resource/:id`, lo que impedía eliminar registros en MySQL.
4. **Administrador de base de datos rígido:** `DatabaseManager.tsx` solo permitía editar texto JSON crudo en un `<textarea>`, sin soporte de eliminación ni formularios asistidos.

### Solución Implementada
- **Backend Completo:** Se implementaron los endpoints `DELETE /api/:resource/:id` y `GET /api/:resource/:id` en `server/index.js`.
- **Store Reactivo Unificado (`useCompetition`):** Store central en Zustand que administra el ciclo de vida de pilotos, vehículos, equipos y clasificaciones. Implementa **persistencia híbrida**: sincroniza con MySQL mediante la API REST y, si el servidor está apagado o en modo offline, persiste de forma transparente en `LocalStorage`.
- **Modales UI para CRUD:**
  - `DriverModal.tsx`: Formulario completo para inscribir y editar corredores (nombres, dorsal, categoría, equipo, auto, biometría, licencia FIA y ficha médica).
  - `VehicleModal.tsx`: Formulario técnico para registrar y modificar autos (marca, modelo, año, motor, potencia HP, torque, peso BoP, homologación, VIN y estado de Scrutineering).
  - `ConfirmDeleteModal.tsx`: Diálogo modal de advertencia para confirmación segura de borrado.
- **Botones de Acción en UI:**
  - En **Pilotos** (`/pilotos`): Botón `+ Inscribir Piloto` en el encabezado, y botones de edición y eliminación directa en cada tarjeta.
  - En **Detalle de Piloto** (`/pilotos/:id`): Botones `Editar piloto` y `Eliminar`.
  - En **Garaje** (`/garaje`): Botón `+ Registrar Vehículo` en el encabezado, y botones de edición y eliminación en cada chasis.
  - En **Detalle de Vehículo** (`/garaje/:id`): Botones `Editar vehículo` y `Eliminar`.
  - En **Administrador de BD** (`/administracion` → pestaña *Base de datos*): Botón `Eliminar` en cada registro con recálculo dinámico.

---

## 2. Arquitectura de Datos y Sincronización

```
[ Interfaz de Usuario (React 19) ]
         │
         ▼
[ useCompetition Store (Zustand) ] ── (Optimistic Update)
         │
    ┌────┴───────────────────────────┐
    ▼                                ▼
[ LocalStorage (Caché Local) ]   [ API REST Express (/api) ]
                                             │
                                             ▼
                                     [ MySQL Database ]
```

- **Alta / Inserción:** Se genera un ID único, se valida la entidad, se añade al store y se propaga tanto a `LocalStorage` como a MySQL vía `POST /api/:resource`.
- **Modificación / Actualización:** Se actualizan los atributos conservando el ID, refrescando todas las vistas dependientes y enviando `PUT /api/:resource/:id`.
- **Baja / Eliminación:** Se remueve el registro, se ajustan automáticamente las tablas de posiciones (en el caso de pilotos) y se envía `DELETE /api/:resource/:id`.

---

## 3. Guía de Operaciones CRUD

### 3.1. Corredores (Pilotos)
- **Insertar:** En `/pilotos`, presionar `+ Inscribir Piloto`. Completar nombre, apellido, dorsal, categoría (GT3 Pro, Pro-Am, GT4), equipo y vehículo asignado.
- **Consultar / Filtrar:** Filtro en vivo por categoría, búsqueda por texto libre y ordenación por posición, puntos, nombre o dorsal.
- **Modificar:** Clic en el icono de lápiz en la tarjeta o botón `Editar piloto` en la ficha individual.
- **Eliminar:** Clic en el icono de papelera o botón `Eliminar` en el detalle. Confirmar en el modal de advertencia.

### 3.2. Autos (Vehículos / Garaje)
- **Insertar:** En `/garaje`, presionar `+ Registrar Vehículo`. Indicar marca, modelo, número, potencia en HP, peso, equipo y estado técnico (Aprobado, Pendiente, Observado, Rechazado).
- **Consultar:** Filtros por estado Scrutineering y por escudería. Estadísticas en tiempo real de potencia total de la parrilla.
- **Modificar:** Clic en el botón `Editar` de la tarjeta o botón `Editar vehículo` en el detalle.
- **Eliminar:** Clic en el botón `Eliminar` con modal de confirmación.

---

## 4. Endpoints de la API Backend

| Método | Endpoint | Descripción | Código Éxito |
|---|---|---|---|
| `GET` | `/api/health` | Estado de conexión con MySQL | 200 OK |
| `GET` | `/api/counts` | Conteo de registros por catálogo | 200 OK |
| `GET` | `/api/:resource` | Listar registros de un catálogo | 200 OK |
| `GET` | `/api/:resource/:id` | Obtener un registro por ID | 200 OK |
| `POST` | `/api/:resource` | Insertar nuevo registro | 201 Created |
| `PUT` | `/api/:resource/:id` | Modificar registro existente | 200 OK |
| `DELETE` | `/api/:resource/:id` | Eliminar registro | 200 OK |
| `POST` | `/api/bootstrap` | Inicializar datos de ejemplo | 201 Created |

---

## 5. Instrucciones para Ejecutar el Proyecto

1. **Iniciar la API de MySQL:**
   ```bash
   npm run api
   ```
2. **Iniciar la Aplicación Web:**
   ```bash
   npm run dev
   ```
3. **Acceder a la aplicación:**
   Abrir `http://localhost:5173` en el navegador. Iniciar sesión como `Organizador`.

---

*Documento Word correspondiente:* [**`Documentacion_Apex_Race_Control.docx`**](file:///c:/Users/casti/Documents/7%20A/Aplicacion_carreras/Documentacion_Apex_Race_Control.docx)
