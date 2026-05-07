# 📋 Product Backlog - Sistema de Gestión de Citas Médicas

## Clínica San Miguel

---

## 📌 Resumen de Features

El desarrollo del sistema se organiza en **5 Features** que agrupan funcionalidades relacionadas y coherentes entre sí. Cada feature está diseñado para ser desarrollado de manera incremental, permitiendo entregas funcionales al finalizar cada uno.

---

### Feature 0: Fundamentos del Sistema

**Objetivo:** Establecer la infraestructura base del sistema que servirá como cimiento para todos los demás features.

Este feature comprende la implementación de los mecanismos de autenticación y autorización del sistema, incluyendo el registro de nuevos pacientes con validación de datos ecuatorianos (cédula de 10 dígitos, mayoría de edad), inicio de sesión tradicional con email y contraseña, e integración con Google OAuth 2.0 para autenticación social. Se implementa el sistema de tokens JWT para mantener sesiones seguras y el middleware de autorización que protege las rutas según los tres roles del sistema: paciente, doctor y administrador.

Adicionalmente, incluye los CRUDs de las entidades fundamentales que son prerequisito para el funcionamiento del sistema: gestión de usuarios con activación/desactivación y restablecimiento de contraseñas, gestión de especialidades médicas con duración estándar de consulta, gestión de consultorios con información de ubicación y equipamiento, gestión de doctores con asignación de especialidad y credenciales, y gestión de pacientes con búsqueda y exportación de datos.

Finalmente, implementa la estructura de navegación para cada rol: el layout de administrador con menú organizado por secciones (Principal, Gestión Clínica, Pacientes, Administración, Sistema), el layout de doctor con accesos rápidos a funciones clínicas, el layout de paciente con navegación sencilla y amigable, y la página de inicio pública con información de la clínica.

---

### Feature 1: Gestión de Citas y Disponibilidad

**Objetivo:** Implementar el ciclo de vida completo de las citas médicas, desde la configuración de horarios hasta el seguimiento de cada consulta.

Este feature abarca la configuración de horarios de los doctores, permitiendo definir bloques de atención por día de la semana con hora de inicio, fin y duración de cada cita. Incluye la gestión de excepciones de horario para manejar vacaciones, días festivos, capacitaciones y emergencias, con notificación automática a pacientes afectados. Los doctores pueden visualizar su horario configurado y sus próximas ausencias programadas.

El sistema de disponibilidad calcula automáticamente los horarios disponibles de cada doctor, verificando el horario regular, las excepciones activas y las citas ya agendadas para generar una lista de slots disponibles en intervalos configurados. Esta información se expone a través de una API que el frontend consume para mostrar opciones al paciente.

El módulo de agendamiento permite a los pacientes crear nuevas citas siguiendo un flujo paso a paso: selección de especialidad, selección de doctor, selección de fecha, selección de horario disponible, ingreso del motivo de consulta y confirmación final. Los pacientes pueden ver sus citas agendadas, confirmar asistencia, cancelar con motivo obligatorio, o reprogramar seleccionando un nuevo horario disponible.

Para la gestión administrativa, se implementa un calendario de recepción con vista mensual, indicadores de cantidad de citas por día, y filtros por doctor, especialidad y estado. El administrador puede ver el detalle de citas de cada día, asignar consultorios, reasignar doctores verificando disponibilidad, reagendar citas mostrando solo horarios disponibles, cancelar citas con notificación, y exportar reportes a CSV.

La agenda del doctor permite ver sus citas programadas, realizar check-in de pacientes que llegan, iniciar consultas con carga automática de información del paciente, y marcar ausencias (no-show) para estadísticas.

Complementariamente, el sistema de notificaciones de citas envía emails automáticos de confirmación al agendar, recordatorios 24 horas y 1 hora antes de la cita, y notificaciones de cualquier cambio realizado (reagendamiento, cambio de doctor, cancelación).

---

### Feature 2: Consulta Médica y Registros Clínicos

**Objetivo:** Digitalizar el proceso completo de la consulta médica y mantener un historial clínico integral de cada paciente.

Este feature implementa el historial médico del paciente, permitiendo tanto a pacientes como doctores acceder a la información clínica. Los pacientes pueden ver y actualizar sus antecedentes médicos, alergias, enfermedades crónicas, medicamentos actuales, contacto de emergencia e información de seguro. Los doctores tienen acceso al historial completo incluyendo consultas anteriores, diagnósticos, recetas emitidas y resultados de laboratorio, presentados en un timeline de eventos médicos.

El proceso de consulta médica se implementa como un wizard de 4 pasos. El primer paso registra los signos vitales: presión arterial (sistólica/diastólica), frecuencia cardíaca, temperatura, frecuencia respiratoria, saturación de oxígeno, peso y altura, con cálculo automático de IMC y alertas visuales para valores fuera de rango. El segundo paso documenta la consulta usando el formato SOAP (Subjetivo, Objetivo, Análisis, Plan), el estándar de documentación médica que incluye síntomas reportados, hallazgos del examen físico, diagnóstico diferencial y principal, y plan de tratamiento con indicaciones de seguimiento.

El tercer paso permite emitir recetas médicas agregando múltiples medicamentos con nombre, dosis, frecuencia, duración e instrucciones especiales. Cada receta genera automáticamente un código QR único que permite verificar su autenticidad desde una página pública, sin requerir autenticación. Los pacientes pueden ver sus recetas, descargarlas en PDF con formato profesional, y solicitar renovaciones que el doctor puede aprobar o rechazar.

El cuarto paso permite solicitar exámenes de laboratorio seleccionando de una lista de pruebas comunes o agregando exámenes personalizados, indicando prioridad (normal/urgente) y notas especiales. Las órdenes se gestionan desde el módulo de laboratorio donde se actualiza su estado (pendiente, procesando, completado), se cargan resultados y se notifica a pacientes y doctores.

Al finalizar la consulta, el sistema registra la hora de finalización, cambia el estado de la cita a completado, envía un resumen por email al paciente, y opcionalmente permite agendar una cita de seguimiento mostrando los horarios disponibles del doctor.

---

### Feature 3: Facturación, Seguros y Calidad

**Objetivo:** Gestionar los aspectos financieros de la clínica y medir la calidad del servicio prestado.

El módulo de facturación comienza con la gestión de un catálogo de servicios médicos facturables, categorizados en consultas, procedimientos y laboratorio, cada uno con nombre, descripción y precio actualizable con historial de cambios. La creación de facturas permite seleccionar paciente, agregar múltiples items con cantidad y precio unitario, aplicar descuentos, calcular impuestos y generar un número de factura único. Si el paciente tiene seguro activo, el sistema calcula automáticamente la cobertura según los porcentajes configurados para cada servicio, determinando el monto cubierto y el copago del paciente.

Los pacientes pueden ver sus facturas con estados (pendiente, pagada, parcial, anulada), consultar el detalle de items facturados y descargar en PDF. Los administradores pueden registrar pagos parciales o totales con diferentes métodos de pago, generar recibos, y anular facturas sin pagos registrando el motivo.

La gestión de seguros médicos permite administrar los proveedores con sus planes, tipos de cobertura y porcentajes por servicio. Se puede asignar seguro a pacientes con número de póliza, tipo de plan y fecha de vigencia, y verificar la cobertura activa para cualquier servicio.

El módulo de calidad implementa encuestas de satisfacción post-consulta enviadas por email o accesibles desde el portal del paciente, evaluando aspectos como puntualidad, atención del doctor, claridad de explicaciones e instalaciones con escala de 1-5 estrellas y comentarios libres. Los pacientes también pueden calificar directamente a sus doctores. Los administradores tienen acceso a un dashboard de calidad con promedios de satisfacción general, por doctor y por especialidad, tendencias temporales, comentarios destacados y alertas por calificaciones bajas. Los doctores pueden ver sus propias calificaciones, distribución y comentarios recibidos.

Adicionalmente, se implementa una lista de espera para pacientes que desean cita con especialidades o doctores sin disponibilidad inmediata, ordenada por prioridad y fecha de registro, con notificación automática cuando se libera un espacio.

---

### Feature 4: Dashboards, Reportes y Seguridad

**Objetivo:** Proporcionar visibilidad del estado del sistema a cada rol y garantizar la seguridad y trazabilidad de las operaciones.

Los dashboards personalizados brindan información relevante a cada tipo de usuario. El dashboard del paciente muestra tarjetas con próximas citas, citas completadas, resultados de laboratorio pendientes y recetas activas, junto con el detalle de la próxima cita y el historial reciente de consultas. El dashboard del doctor presenta estadísticas del día y la semana, lista de citas ordenadas por hora, cita próxima destacada, acciones pendientes (notas por completar, resultados por revisar) y un calendario mini.

El dashboard administrativo es el más completo, mostrando estadísticas generales de la clínica (doctores, especialidades, citas, pacientes), estadísticas detalladas de citas con gráficos por estado, mes y día de semana, y métricas avanzadas de rendimiento: promedio de citas diarias, promedio por doctor, tasas de cancelación, completitud y no-show, tiempo promedio de anticipación de reservas y duración promedio de consultas. Incluye análisis de horas pico ordenadas por demanda en formato HH:00, tablas de performance por doctor (citas totales, completadas, canceladas, score de eficiencia) y por especialidad (demanda, duración promedio, tasa de completitud).

El sistema de reportes permite exportar las estadísticas del dashboard a CSV, generar reportes de citas por rango de fechas para doctores, y reportes de facturación con totales facturados, cobrados y pendientes, desglosados por servicio y doctor.

El centro de notificaciones permite a pacientes y doctores ver todas sus notificaciones ordenadas por fecha, filtrar por tipo, y marcarlas como leídas. Los administradores pueden crear notificaciones masivas seleccionando destinatarios y programando envíos, con estadísticas de lectura. Cada usuario puede configurar sus preferencias de notificaciones (email, in-app, frecuencia de recordatorios).

El módulo de auditoría registra automáticamente todas las acciones importantes del sistema: usuario, acción, entidad afectada, fecha/hora e IP, almacenando los cambios realizados (antes/después) de forma inmutable. Los administradores pueden consultar los logs con filtros por usuario, tipo de acción, fecha y módulo, ver detalles y exportar a CSV. El sistema genera alertas de seguridad por múltiples intentos de login fallidos, accesos desde ubicaciones inusuales o acciones masivas.

Finalmente, la gestión de seguridad y accesos permite administrar usuarios (ver último acceso, activar/desactivar, restablecer contraseña, ver historial de sesiones), cambiar contraseña con validación y cierre de otras sesiones, gestionar perfil con foto y preferencias, y ver/cerrar sesiones activas remotamente para detectar accesos no autorizados.

---

### Tabla Resumen de Features

| Feature | Nombre | Épicas | Historias |
|---------|--------|--------|-----------|
| **Feature 0** | Fundamentos del Sistema | 3 | 12 |
| **Feature 1** | Gestión de Citas y Disponibilidad | 6 | 21 |
| **Feature 2** | Consulta Médica y Registros Clínicos | 5 | 17 |
| **Feature 3** | Facturación, Seguros y Calidad | 3 | 14 |
| **Feature 4** | Dashboards, Reportes y Seguridad | 7 | 18 |
| | **TOTAL** | **24** | **82** |

---

## 🎯 Feature 0: Fundamentos del Sistema

### Descripción
Este feature establece los cimientos del sistema, implementando la autenticación de usuarios, los CRUDs de las entidades base, y la estructura de navegación. Es prerequisito para todos los demás features.

---

### Épica 0.1: Autenticación y Autorización

#### Historia de Usuario 0.1.1: Registro de Pacientes
**Como** visitante del sistema  
**Quiero** poder registrarme como paciente  
**Para** acceder a los servicios de la clínica

**Criterios de Aceptación:**
- Formulario de registro con campos: nombre, apellido, cédula (10 dígitos), fecha de nacimiento, teléfono, email, contraseña
- Validación de cédula ecuatoriana
- Validación de mayoría de edad (18+ años)
- Validación de contraseña con confirmación
- Email único en el sistema
- Redirección a login tras registro exitoso
- Mensajes de error descriptivos

---

#### Historia de Usuario 0.1.2: Inicio de Sesión
**Como** usuario registrado  
**Quiero** iniciar sesión con mis credenciales  
**Para** acceder a mi panel correspondiente

**Criterios de Aceptación:**
- Formulario con email y contraseña
- Validación de credenciales contra base de datos
- Generación de token JWT al autenticar
- Almacenamiento seguro del token en localStorage
- Redirección automática según rol (patient, doctor, admin)
- Mensaje de error para credenciales inválidas
- Bloqueo de cuenta tras múltiples intentos fallidos

---

#### Historia de Usuario 0.1.3: Autenticación con Google OAuth
**Como** usuario  
**Quiero** poder iniciar sesión con mi cuenta de Google  
**Para** acceder más rápidamente sin recordar otra contraseña

**Criterios de Aceptación:**
- Botón "Continuar con Google" en login
- Flujo OAuth 2.0 completo con Google
- Creación automática de usuario si no existe
- Solicitud de datos adicionales (cédula, teléfono) si es primera vez
- Vinculación de cuenta Google con cuenta existente si el email coincide
- Manejo de errores de OAuth

---

#### Historia de Usuario 0.1.4: Cierre de Sesión
**Como** usuario autenticado  
**Quiero** poder cerrar mi sesión de forma segura  
**Para** proteger mi cuenta cuando termine de usar el sistema

**Criterios de Aceptación:**
- Botón de cerrar sesión visible en el menú
- Confirmación antes de cerrar sesión
- Eliminación del token del localStorage
- Redirección a página de login
- Invalidación de sesión en el servidor

---

#### Historia de Usuario 0.1.5: Middleware de Autorización
**Como** sistema  
**Quiero** proteger las rutas según el rol del usuario  
**Para** garantizar que solo usuarios autorizados accedan a cada funcionalidad

**Criterios de Aceptación:**
- Verificación de token JWT en cada petición protegida
- Validación de rol para acceso a rutas específicas
- Respuesta 401 para token inválido o expirado
- Respuesta 403 para acceso no autorizado por rol
- Redirección automática en frontend ante errores de autorización

---

### Épica 0.2: CRUDs de Entidades Base

#### Historia de Usuario 0.2.1: CRUD de Usuarios
**Como** administrador  
**Quiero** gestionar los usuarios del sistema  
**Para** controlar el acceso y mantener la información actualizada

**Criterios de Aceptación:**
- Listar usuarios con paginación y búsqueda
- Crear nuevos usuarios con rol asignado
- Editar información de usuarios existentes
- Activar/desactivar usuarios
- Restablecer contraseña de usuarios
- Visualizar fecha de último acceso

---

#### Historia de Usuario 0.2.2: CRUD de Especialidades
**Como** administrador  
**Quiero** gestionar las especialidades médicas  
**Para** organizar los servicios que ofrece la clínica

**Criterios de Aceptación:**
- Listar especialidades con estado
- Crear nueva especialidad con nombre y descripción
- Editar especialidades existentes
- Activar/desactivar especialidades
- Ver cantidad de doctores por especialidad
- Definir duración estándar de consulta por especialidad

---

#### Historia de Usuario 0.2.3: CRUD de Consultorios
**Como** administrador  
**Quiero** gestionar los consultorios de la clínica  
**Para** asignarlos a las citas médicas

**Criterios de Aceptación:**
- Listar consultorios con estado de disponibilidad
- Crear consultorio con nombre, número, piso y equipamiento
- Editar información de consultorios
- Marcar consultorio como disponible/no disponible/en mantenimiento
- Filtrar por piso o estado

---

#### Historia de Usuario 0.2.4: CRUD de Doctores
**Como** administrador  
**Quiero** gestionar los doctores de la clínica  
**Para** mantener el directorio médico actualizado

**Criterios de Aceptación:**
- Listar doctores con foto, nombre, especialidad y estado
- Crear doctor con datos personales, profesionales y credenciales
- Asignar especialidad al doctor
- Editar información del doctor
- Activar/desactivar doctores
- Ver estadísticas básicas del doctor
- Cargar foto de perfil

---

#### Historia de Usuario 0.2.5: CRUD de Pacientes
**Como** administrador  
**Quiero** gestionar los pacientes registrados  
**Para** mantener la información de pacientes actualizada

**Criterios de Aceptación:**
- Listar pacientes con búsqueda por nombre o cédula
- Ver perfil completo del paciente
- Editar información del paciente
- Ver historial de citas del paciente
- Activar/desactivar pacientes
- Exportar lista de pacientes

---

### Épica 0.3: Estructura de Navegación

#### Historia de Usuario 0.3.1: Layout de Administrador
**Como** administrador  
**Quiero** tener un panel de navegación organizado  
**Para** acceder fácilmente a todas las funciones administrativas

**Criterios de Aceptación:**
- Sidebar con menú organizado por secciones
- Secciones: Principal, Gestión Clínica, Pacientes, Administración, Sistema
- Indicador visual del módulo activo
- Header con nombre del usuario y módulo actual
- Botón de cerrar sesión
- Diseño responsive

---

#### Historia de Usuario 0.3.2: Layout de Doctor
**Como** doctor  
**Quiero** tener un panel de navegación intuitivo  
**Para** acceder rápidamente a mis funciones clínicas

**Criterios de Aceptación:**
- Sidebar con accesos a: Dashboard, Agenda, Pacientes, Recetas, Laboratorio, Reportes, Horario, Perfil
- Indicador de notificaciones pendientes
- Indicador visual del módulo activo
- Header con información del doctor
- Diseño responsive

---

#### Historia de Usuario 0.3.3: Layout de Paciente
**Como** paciente  
**Quiero** tener un panel de navegación sencillo  
**Para** acceder a mis servicios médicos fácilmente

**Criterios de Aceptación:**
- Sidebar con accesos a: Dashboard, Nueva Cita, Mis Citas, Historial, Recetas, Laboratorio, Facturación, Perfil
- Indicador de notificaciones
- Indicador visual del módulo activo
- Header con nombre del paciente
- Diseño responsive y amigable

---

#### Historia de Usuario 0.3.4: Página de Inicio Pública
**Como** visitante  
**Quiero** ver información de la clínica en la página principal  
**Para** conocer los servicios antes de registrarme

**Criterios de Aceptación:**
- Página de bienvenida con información de la clínica
- Botones de acceso a Login y Registro
- Información de especialidades disponibles
- Información de contacto
- Diseño atractivo y profesional

---

## 🎯 Feature 1: Gestión de Citas y Disponibilidad

### Descripción
Este feature implementa todo el flujo de gestión de citas médicas, desde la configuración de horarios hasta el seguimiento del estado de cada cita, incluyendo las herramientas de gestión para recepción.

---

### Épica 1.1: Configuración de Horarios

#### Historia de Usuario 1.1.1: Gestión de Horarios de Doctores
**Como** administrador  
**Quiero** configurar los horarios de atención de cada doctor  
**Para** definir cuándo están disponibles para citas

**Criterios de Aceptación:**
- Seleccionar doctor para configurar horario
- Definir horario por día de la semana
- Establecer hora de inicio y fin para cada día
- Definir duración de cada cita (15, 20, 30, 45, 60 minutos)
- Permitir múltiples bloques horarios por día
- Validar que no haya solapamiento de horarios
- Visualizar resumen semanal del horario

---

#### Historia de Usuario 1.1.2: Gestión de Excepciones de Horario
**Como** administrador  
**Quiero** registrar excepciones en los horarios de los doctores  
**Para** manejar vacaciones, ausencias y días especiales

**Criterios de Aceptación:**
- Crear excepción para un doctor específico
- Tipos de excepción: vacaciones, día festivo, capacitación, emergencia, otro
- Definir fecha de inicio y fin de la excepción
- Agregar notas o motivo de la ausencia
- Las excepciones anulan la disponibilidad del horario regular
- Notificar a pacientes afectados por la excepción
- Visualizar calendario con excepciones marcadas

---

#### Historia de Usuario 1.1.3: Visualización de Horario por Doctor
**Como** doctor  
**Quiero** ver mi horario configurado  
**Para** conocer mis días y horas de atención

**Criterios de Aceptación:**
- Vista de horario semanal del doctor
- Mostrar bloques de atención configurados
- Indicar excepciones programadas
- Vista de calendario mensual con días de atención
- Información de próximas ausencias

---

### Épica 1.2: Sistema de Disponibilidad

#### Historia de Usuario 1.2.1: Cálculo de Disponibilidad
**Como** sistema  
**Quiero** calcular los horarios disponibles de un doctor  
**Para** mostrar opciones válidas al agendar citas

**Criterios de Aceptación:**
- Consultar horario regular del doctor para el día solicitado
- Verificar si existe excepción que anule el día
- Obtener citas ya agendadas para ese día
- Calcular slots disponibles en intervalos según duración de cita
- Excluir horarios ya ocupados
- Retornar lista de horarios disponibles con formato HH:MM

---

#### Historia de Usuario 1.2.2: API de Disponibilidad
**Como** frontend  
**Quiero** consultar la disponibilidad de un doctor  
**Para** mostrar los horarios al paciente

**Criterios de Aceptación:**
- Endpoint: GET /availability/doctor/:doctorId/date/:date
- Respuesta con array de slots: { time, available, duration }
- Respuesta vacía si el doctor no tiene horario ese día
- Respuesta vacía si hay excepción activa
- Manejo de errores apropiado

---

### Épica 1.3: Agendamiento de Citas

#### Historia de Usuario 1.3.1: Agendar Nueva Cita (Paciente)
**Como** paciente  
**Quiero** agendar una cita médica  
**Para** ser atendido por un especialista

**Criterios de Aceptación:**
- Paso 1: Seleccionar especialidad
- Paso 2: Seleccionar doctor de la especialidad
- Paso 3: Seleccionar fecha (calendario)
- Paso 4: Ver y seleccionar horario disponible
- Paso 5: Agregar motivo de consulta
- Paso 6: Confirmar y crear cita
- Mostrar resumen de la cita creada
- Enviar confirmación por email
- Redireccionar a "Mis Citas"

---

#### Historia de Usuario 1.3.2: Ver Mis Citas (Paciente)
**Como** paciente  
**Quiero** ver todas mis citas agendadas  
**Para** conocer mis próximas consultas y el historial

**Criterios de Aceptación:**
- Lista de citas próximas ordenadas por fecha
- Lista de citas pasadas (historial)
- Información de cada cita: fecha, hora, doctor, especialidad, estado
- Filtros por estado
- Código de color según estado
- Acciones disponibles según estado de la cita

---

#### Historia de Usuario 1.3.3: Confirmar Cita (Paciente)
**Como** paciente  
**Quiero** confirmar mi asistencia a una cita  
**Para** asegurar mi lugar en la agenda del doctor

**Criterios de Aceptación:**
- Botón "Confirmar" visible en citas con estado "scheduled"
- Cambio de estado a "confirmed" al confirmar
- Actualización visual inmediata
- Envío de confirmación por email
- También permitir confirmar desde enlace en email

---

#### Historia de Usuario 1.3.4: Cancelar Cita (Paciente)
**Como** paciente  
**Quiero** cancelar una cita agendada  
**Para** liberar el espacio si no puedo asistir

**Criterios de Aceptación:**
- Botón "Cancelar" en citas pendientes o confirmadas
- Modal de confirmación con campo para motivo
- Motivo de cancelación obligatorio
- Cambio de estado a "cancelled"
- Envío de notificación al doctor
- No permitir cancelar citas pasadas
- Advertencia si cancela con menos de 24h de anticipación

---

#### Historia de Usuario 1.3.5: Reprogramar Cita (Paciente)
**Como** paciente  
**Quiero** cambiar la fecha/hora de una cita  
**Para** ajustarla a mi disponibilidad

**Criterios de Aceptación:**
- Botón "Reprogramar" en citas activas
- Modal con selector de nueva fecha
- Mostrar horarios disponibles del mismo doctor
- Seleccionar nuevo horario de la lista
- Campo opcional para motivo del cambio
- Actualizar cita con nueva fecha/hora
- Enviar notificación de cambio

---

### Épica 1.4: Gestión de Citas (Recepción/Admin)

#### Historia de Usuario 1.4.1: Calendario de Recepción
**Como** administrador/recepcionista  
**Quiero** ver todas las citas en un calendario  
**Para** gestionar la agenda diaria de la clínica

**Criterios de Aceptación:**
- Vista de calendario mensual
- Indicador de cantidad de citas por día
- Navegación entre meses
- Al hacer clic en un día, mostrar lista de citas
- Filtros por doctor, especialidad y estado
- Tarjetas de resumen: confirmadas, pendientes, check-in, completadas, canceladas, no show

---

#### Historia de Usuario 1.4.2: Vista de Citas del Día
**Como** administrador  
**Quiero** ver el detalle de citas de un día específico  
**Para** gestionar las citas de ese día

**Criterios de Aceptación:**
- Modal con lista de citas del día seleccionado
- Información: hora, paciente, doctor, especialidad, estado, consultorio
- Ordenadas por hora
- Acciones disponibles para cada cita
- Código de color por estado

---

#### Historia de Usuario 1.4.3: Asignar Consultorio a Cita
**Como** administrador  
**Quiero** asignar un consultorio a una cita  
**Para** indicar dónde se realizará la consulta

**Criterios de Aceptación:**
- Botón "Asignar Sala" en cada cita
- Modal con lista de consultorios disponibles
- Mostrar información del consultorio: nombre, número, piso
- Solo mostrar consultorios marcados como disponibles
- Actualizar cita con consultorio asignado
- Permitir cambiar consultorio ya asignado

---

#### Historia de Usuario 1.4.4: Reasignar Doctor
**Como** administrador  
**Quiero** cambiar el doctor asignado a una cita  
**Para** manejar imprevistos o redistribuir carga

**Criterios de Aceptación:**
- Botón "Reasignar Doctor" en cada cita
- Modal con lista de doctores de la misma especialidad
- Verificar disponibilidad del nuevo doctor en ese horario
- Actualizar cita con nuevo doctor
- Notificar al paciente del cambio
- Registrar el cambio en historial

---

#### Historia de Usuario 1.4.5: Reagendar Cita (Admin)
**Como** administrador  
**Quiero** cambiar la fecha/hora de una cita  
**Para** reorganizar la agenda cuando sea necesario

**Criterios de Aceptación:**
- Botón "Reagendar" en cada cita
- Modal con selector de nueva fecha
- Mostrar horarios disponibles del doctor
- Solo permitir seleccionar de horarios disponibles
- Campo para motivo del cambio
- Actualizar cita con nueva programación
- Notificar al paciente

---

#### Historia de Usuario 1.4.6: Cancelar Cita (Admin)
**Como** administrador  
**Quiero** cancelar una cita  
**Para** manejar situaciones que requieran cancelación

**Criterios de Aceptación:**
- Botón "Cancelar" en cada cita activa
- Modal de confirmación con motivo obligatorio
- Cambio de estado a "cancelled"
- Notificar al paciente y doctor
- Liberar el horario para nuevas citas

---

#### Historia de Usuario 1.4.7: Descargar Reporte de Citas
**Como** administrador  
**Quiero** exportar las citas a un archivo  
**Para** tener registros offline o compartir información

**Criterios de Aceptación:**
- Botón "Descargar Reporte" en el calendario
- Exportar citas del mes actual a CSV
- Incluir: fecha, hora, paciente, doctor, especialidad, estado, consultorio
- Nombre de archivo con fecha de generación

---

### Épica 1.5: Agenda del Doctor

#### Historia de Usuario 1.5.1: Ver Agenda de Citas (Doctor)
**Como** doctor  
**Quiero** ver mi agenda de citas  
**Para** conocer mis consultas programadas

**Criterios de Aceptación:**
- Vista de calendario con mis citas
- Vista de lista de citas del día
- Información: hora, paciente, motivo, estado
- Filtrar por fecha o estado
- Indicador de cita próxima a iniciar

---

#### Historia de Usuario 1.5.2: Realizar Check-in de Paciente
**Como** doctor  
**Quiero** marcar que un paciente ha llegado  
**Para** registrar su presencia antes de la consulta

**Criterios de Aceptación:**
- Botón "Check-in" en citas confirmadas
- Cambio de estado a "checked_in"
- Registro de hora de llegada
- Actualización visual inmediata

---

#### Historia de Usuario 1.5.3: Iniciar Consulta
**Como** doctor  
**Quiero** iniciar una consulta médica  
**Para** comenzar la atención del paciente

**Criterios de Aceptación:**
- Botón "Iniciar Consulta" en citas con check-in
- Redirección al módulo de consulta médica
- Registro de hora de inicio de consulta
- Cargar información del paciente automáticamente

---

#### Historia de Usuario 1.5.4: Marcar No Show
**Como** doctor/admin  
**Quiero** marcar que un paciente no se presentó  
**Para** liberar el espacio y registrar la ausencia

**Criterios de Aceptación:**
- Opción para marcar "No Show" en citas pasadas sin completar
- Cambio de estado a "no_show"
- Registro para estadísticas
- Notificación al paciente

---

### Épica 1.6: Notificaciones de Citas

#### Historia de Usuario 1.6.1: Email de Confirmación de Cita
**Como** paciente  
**Quiero** recibir confirmación por email al agendar  
**Para** tener registro de mi cita

**Criterios de Aceptación:**
- Envío automático al crear cita
- Contenido: fecha, hora, doctor, especialidad, ubicación
- Enlace para confirmar cita
- Enlace para cancelar cita
- Diseño profesional del email

---

#### Historia de Usuario 1.6.2: Recordatorio de Cita
**Como** paciente  
**Quiero** recibir recordatorio antes de mi cita  
**Para** no olvidar asistir

**Criterios de Aceptación:**
- Recordatorio 24 horas antes por email
- Recordatorio 1 hora antes por email
- Contenido: fecha, hora, doctor, consultorio
- Enlace para confirmar o cancelar

---

#### Historia de Usuario 1.6.3: Notificación de Cambios
**Como** paciente  
**Quiero** ser notificado de cambios en mi cita  
**Para** estar informado de cualquier modificación

**Criterios de Aceptación:**
- Email al reagendar cita
- Email al cambiar doctor
- Email al cancelar cita
- Información clara del cambio realizado

---

## 🎯 Feature 2: Consulta Médica y Registros Clínicos

### Descripción
Este feature implementa el proceso completo de la consulta médica, incluyendo el registro de información clínica, emisión de recetas, órdenes de laboratorio y gestión del historial médico del paciente.

---

### Épica 2.1: Historial Médico

#### Historia de Usuario 2.1.1: Ver Historial Médico (Paciente)
**Como** paciente  
**Quiero** ver mi historial médico completo  
**Para** conocer mi información clínica

**Criterios de Aceptación:**
- Sección de información personal
- Sección de antecedentes médicos
- Lista de alergias registradas
- Lista de enfermedades crónicas
- Medicamentos actuales
- Historial de consultas realizadas

---

#### Historia de Usuario 2.1.2: Actualizar Información Médica (Paciente)
**Como** paciente  
**Quiero** actualizar mi información médica  
**Para** mantener mis antecedentes actualizados

**Criterios de Aceptación:**
- Editar alergias conocidas
- Editar enfermedades crónicas
- Editar medicamentos actuales
- Agregar contacto de emergencia
- Información de seguro médico
- Guardar cambios con confirmación

---

#### Historia de Usuario 2.1.3: Ver Historial del Paciente (Doctor)
**Como** doctor  
**Quiero** ver el historial médico de un paciente  
**Para** tener contexto antes de la consulta

**Criterios de Aceptación:**
- Acceso al historial desde la cita o lista de pacientes
- Ver información personal y de contacto
- Ver antecedentes médicos completos
- Ver consultas anteriores con diagnósticos
- Ver recetas emitidas
- Ver resultados de laboratorio
- Timeline de eventos médicos

---

#### Historia de Usuario 2.1.4: CRUD de Registros Médicos
**Como** doctor  
**Quiero** gestionar los registros médicos del paciente  
**Para** mantener su historial actualizado

**Criterios de Aceptación:**
- Crear nuevo registro médico
- Tipos: diagnóstico, procedimiento, vacuna, alergia, condición crónica
- Editar registros existentes
- Marcar fecha del registro
- Agregar notas adicionales
- No permitir eliminar registros (solo marcar como corregido)

---

### Épica 2.2: Consulta Médica

#### Historia de Usuario 2.2.1: Wizard de Consulta - Signos Vitales
**Como** doctor  
**Quiero** registrar los signos vitales del paciente  
**Para** documentar su estado físico actual

**Criterios de Aceptación:**
- Paso 1 del wizard de consulta
- Campos: presión arterial (sistólica/diastólica), frecuencia cardíaca, temperatura, frecuencia respiratoria, saturación de oxígeno, peso, altura
- Cálculo automático de IMC
- Validación de rangos normales con alertas
- Indicadores visuales para valores fuera de rango
- Guardar y continuar al siguiente paso

---

#### Historia de Usuario 2.2.2: Wizard de Consulta - Notas SOAP
**Como** doctor  
**Quiero** documentar la consulta usando formato SOAP  
**Para** mantener un registro estructurado de la atención

**Criterios de Aceptación:**
- Paso 2 del wizard de consulta
- Sección Subjetivo: síntomas reportados, historia de enfermedad actual
- Sección Objetivo: hallazgos del examen físico
- Sección Análisis: diagnóstico diferencial, diagnóstico principal
- Sección Plan: tratamiento, indicaciones, seguimiento
- Campo adicional para notas generales
- Opción de cita de seguimiento
- Guardar y continuar

---

#### Historia de Usuario 2.2.3: Wizard de Consulta - Recetas
**Como** doctor  
**Quiero** emitir recetas médicas durante la consulta  
**Para** prescribir el tratamiento al paciente

**Criterios de Aceptación:**
- Paso 3 del wizard de consulta
- Agregar múltiples medicamentos
- Por cada medicamento: nombre, dosis, frecuencia, duración, instrucciones
- Vista previa de la receta
- Generar código QR único para verificación
- Guardar receta vinculada a la consulta
- Continuar al siguiente paso

---

#### Historia de Usuario 2.2.4: Wizard de Consulta - Órdenes de Laboratorio
**Como** doctor  
**Quiero** solicitar exámenes de laboratorio  
**Para** complementar el diagnóstico del paciente

**Criterios de Aceptación:**
- Paso 4 del wizard de consulta
- Lista de exámenes comunes para seleccionar
- Agregar exámenes personalizados
- Indicar prioridad: normal o urgente
- Agregar notas o instrucciones especiales
- Crear órdenes vinculadas a la consulta
- Finalizar consulta

---

#### Historia de Usuario 2.2.5: Finalizar Consulta
**Como** doctor  
**Quiero** completar y cerrar la consulta  
**Para** registrar que la atención ha terminado

**Criterios de Aceptación:**
- Resumen de toda la información ingresada
- Opción de agendar cita de seguimiento
- Confirmación para finalizar
- Cambio de estado de cita a "completed"
- Registro de hora de finalización
- Envío de resumen al paciente por email
- Redirección a la agenda

---

#### Historia de Usuario 2.2.6: Agendar Cita de Seguimiento
**Como** doctor  
**Quiero** agendar una cita de seguimiento  
**Para** programar el control del paciente

**Criterios de Aceptación:**
- Modal para agendar seguimiento
- Selector de fecha
- Mostrar horarios disponibles
- Indicar motivo del seguimiento
- Opción de notificar al paciente
- Crear cita automáticamente vinculada

---

### Épica 2.3: Recetas Médicas

#### Historia de Usuario 2.3.1: Ver Recetas (Paciente)
**Como** paciente  
**Quiero** ver mis recetas médicas  
**Para** conocer mis tratamientos activos

**Criterios de Aceptación:**
- Lista de todas las recetas emitidas
- Filtrar por fecha o estado
- Ver detalle de cada receta
- Información: fecha, doctor, medicamentos, dosis, frecuencia, duración
- Indicador de receta vigente/vencida
- Código QR de verificación visible

---

#### Historia de Usuario 2.3.2: Descargar Receta PDF
**Como** paciente  
**Quiero** descargar mi receta en PDF  
**Para** presentarla en la farmacia

**Criterios de Aceptación:**
- Botón de descarga en cada receta
- PDF con formato profesional
- Incluye: datos del paciente, doctor, medicamentos, instrucciones
- Código QR de verificación
- Fecha de emisión y vencimiento

---

#### Historia de Usuario 2.3.3: Verificación de Receta por QR
**Como** farmacéutico  
**Quiero** verificar una receta escaneando el QR  
**Para** confirmar su autenticidad

**Criterios de Aceptación:**
- Página pública de verificación
- Escanear o ingresar código manualmente
- Mostrar estado: válida, expirada, inválida
- Si es válida, mostrar información de la receta
- Mostrar datos del doctor que emitió
- No requerir autenticación para verificar

---

#### Historia de Usuario 2.3.4: Gestión de Recetas (Doctor)
**Como** doctor  
**Quiero** ver y gestionar las recetas que he emitido  
**Para** dar seguimiento a los tratamientos

**Criterios de Aceptación:**
- Lista de recetas emitidas
- Filtrar por paciente o fecha
- Ver detalle de cada receta
- Estado de cada receta
- Opción de renovar receta

---

#### Historia de Usuario 2.3.5: Renovación de Recetas
**Como** doctor  
**Quiero** renovar una receta existente  
**Para** continuar tratamientos crónicos

**Criterios de Aceptación:**
- Botón "Renovar" en recetas vigentes
- Copiar medicamentos de la receta original
- Permitir ajustar dosis si es necesario
- Generar nueva receta con nuevo QR
- Vincular a consulta de control si existe
- Notificar al paciente

---

#### Historia de Usuario 2.3.6: Solicitud de Renovación (Paciente)
**Como** paciente  
**Quiero** solicitar renovación de una receta  
**Para** continuar mi tratamiento sin nueva consulta

**Criterios de Aceptación:**
- Botón "Solicitar Renovación" en recetas
- Agregar mensaje para el doctor
- Enviar solicitud al doctor
- Notificación al doctor
- Estado de solicitud visible
- Doctor puede aprobar o rechazar

---

### Épica 2.4: Órdenes de Laboratorio

#### Historia de Usuario 2.4.1: Ver Órdenes de Laboratorio (Paciente)
**Como** paciente  
**Quiero** ver mis órdenes de laboratorio  
**Para** conocer los exámenes solicitados y sus resultados

**Criterios de Aceptación:**
- Lista de órdenes con estado
- Estados: pendiente, en proceso, completado
- Ver detalle de cada orden
- Ver resultados cuando estén disponibles
- Descargar resultados en PDF

---

#### Historia de Usuario 2.4.2: Gestión de Órdenes (Laboratorio/Admin)
**Como** administrador de laboratorio  
**Quiero** gestionar las órdenes de laboratorio  
**Para** procesar los exámenes solicitados

**Criterios de Aceptación:**
- Lista de órdenes pendientes
- Actualizar estado de orden
- Cargar resultados de exámenes
- Marcar orden como completada
- Notificar al paciente y doctor
- Historial de órdenes procesadas

---

#### Historia de Usuario 2.4.3: Revisar Resultados (Doctor)
**Como** doctor  
**Quiero** revisar los resultados de laboratorio de mis pacientes  
**Para** interpretar los exámenes y ajustar tratamiento

**Criterios de Aceptación:**
- Lista de resultados pendientes de revisión
- Ver resultados detallados
- Marcar como revisado
- Agregar notas de interpretación
- Indicar si requiere acción
- Notificar al paciente si hay hallazgos importantes

---

### Épica 2.5: Notas de Consulta

#### Historia de Usuario 2.5.1: CRUD de Notas de Consulta
**Como** doctor  
**Quiero** gestionar las notas de consulta  
**Para** documentar cada atención médica

**Criterios de Aceptación:**
- Crear nota vinculada a una cita
- Campos SOAP obligatorios
- Diagnóstico principal
- Códigos CIE-10 (opcional)
- Editar notas de consultas recientes
- No permitir editar notas antiguas (más de 48h)
- Historial de modificaciones

---

#### Historia de Usuario 2.5.2: Ver Notas de Consulta (Paciente)
**Como** paciente  
**Quiero** ver las notas de mis consultas  
**Para** recordar las indicaciones del doctor

**Criterios de Aceptación:**
- Lista de consultas con notas
- Ver diagnóstico y plan de tratamiento
- Ver indicaciones del doctor
- Formato legible para el paciente
- No mostrar notas internas del doctor

---

## 🎯 Feature 3: Facturación, Seguros y Calidad

### Descripción
Este feature implementa el sistema de facturación de servicios médicos, la gestión de proveedores de seguros, y las herramientas de medición de calidad del servicio incluyendo encuestas de satisfacción y calificaciones.

---

### Épica 3.1: Facturación

#### Historia de Usuario 3.1.1: CRUD de Servicios Médicos
**Como** administrador  
**Quiero** gestionar el catálogo de servicios facturables  
**Para** mantener los precios actualizados

**Criterios de Aceptación:**
- Listar servicios con precio
- Crear nuevo servicio con nombre, descripción, precio
- Categorizar servicios (consulta, procedimiento, laboratorio)
- Editar precios de servicios
- Activar/desactivar servicios
- Historial de cambios de precio

---

#### Historia de Usuario 3.1.2: Crear Factura
**Como** administrador  
**Quiero** generar facturas para los pacientes  
**Para** cobrar los servicios prestados

**Criterios de Aceptación:**
- Seleccionar paciente
- Agregar items de factura (servicios, consultas)
- Calcular subtotal automáticamente
- Aplicar descuentos si aplica
- Calcular impuestos
- Calcular total
- Aplicar cobertura de seguro si tiene
- Generar número de factura único
- Guardar factura

---

#### Historia de Usuario 3.1.3: Gestión de Items de Factura
**Como** administrador  
**Quiero** gestionar los items de cada factura  
**Para** detallar los servicios cobrados

**Criterios de Aceptación:**
- Agregar múltiples items a una factura
- Cada item: servicio, cantidad, precio unitario, subtotal
- Editar items antes de facturar
- Eliminar items
- Cálculo automático de totales

---

#### Historia de Usuario 3.1.4: Ver Facturas (Paciente)
**Como** paciente  
**Quiero** ver mis facturas  
**Para** conocer mis pagos y deudas

**Criterios de Aceptación:**
- Lista de facturas con estado
- Estados: pendiente, pagada, parcial, anulada
- Ver detalle de cada factura
- Ver items facturados
- Ver monto total y pagado
- Descargar factura en PDF

---

#### Historia de Usuario 3.1.5: Registrar Pago
**Como** administrador  
**Quiero** registrar pagos de facturas  
**Para** actualizar el estado de cuenta del paciente

**Criterios de Aceptación:**
- Seleccionar factura pendiente
- Ingresar monto de pago
- Seleccionar método de pago
- Permitir pagos parciales
- Actualizar estado de factura
- Generar recibo de pago
- Historial de pagos por factura

---

#### Historia de Usuario 3.1.6: Anular Factura
**Como** administrador  
**Quiero** anular una factura emitida  
**Para** corregir errores o cancelaciones

**Criterios de Aceptación:**
- Solo facturas sin pagos
- Requiere motivo de anulación
- Cambio de estado a "anulada"
- Registro de quién anuló y cuándo
- No elimina la factura, solo cambia estado

---

#### Historia de Usuario 3.1.7: Cálculo de Facturación con Seguro
**Como** sistema  
**Quiero** calcular automáticamente la cobertura del seguro  
**Para** aplicar descuentos correctamente

**Criterios de Aceptación:**
- Verificar si paciente tiene seguro activo
- Obtener porcentaje de cobertura por servicio
- Calcular monto cubierto por seguro
- Calcular copago del paciente
- Mostrar desglose en la factura

---

### Épica 3.2: Seguros Médicos

#### Historia de Usuario 3.2.1: CRUD de Proveedores de Seguro
**Como** administrador  
**Quiero** gestionar los proveedores de seguro  
**Para** mantener los convenios actualizados

**Criterios de Aceptación:**
- Listar proveedores de seguro
- Crear proveedor con nombre, contacto, planes
- Definir tipos de cobertura
- Establecer porcentajes de cobertura por servicio
- Editar información del proveedor
- Activar/desactivar proveedores
- Ver pacientes por proveedor

---

#### Historia de Usuario 3.2.2: Asignar Seguro a Paciente
**Como** administrador  
**Quiero** registrar el seguro de un paciente  
**Para** aplicar coberturas en facturación

**Criterios de Aceptación:**
- Seleccionar proveedor de seguro
- Ingresar número de póliza
- Ingresar tipo de plan
- Fecha de vigencia
- Verificar cobertura activa
- Actualizar información del paciente

---

#### Historia de Usuario 3.2.3: Verificar Cobertura
**Como** administrador  
**Quiero** verificar la cobertura de un paciente  
**Para** informar sobre servicios cubiertos

**Criterios de Aceptación:**
- Consultar seguro del paciente
- Ver servicios cubiertos
- Ver porcentajes de cobertura
- Ver vigencia de la póliza
- Indicar si está activo

---

### Épica 3.3: Calidad y Satisfacción

#### Historia de Usuario 3.3.1: Encuesta de Satisfacción Post-Consulta
**Como** paciente  
**Quiero** evaluar mi experiencia de consulta  
**Para** dar retroalimentación sobre el servicio

**Criterios de Aceptación:**
- Encuesta enviada por email tras consulta completada
- También accesible desde "Mis Citas"
- Preguntas sobre: puntualidad, atención, claridad, instalaciones
- Escala de 1-5 estrellas por aspecto
- Campo de comentarios libre
- Envío anónimo opcional
- Agradecer por completar encuesta

---

#### Historia de Usuario 3.3.2: Calificar Consulta
**Como** paciente  
**Quiero** calificar a mi doctor  
**Para** compartir mi experiencia

**Criterios de Aceptación:**
- Calificación de 1-5 estrellas
- Comentario opcional
- Una calificación por consulta
- Visible solo para el doctor y administración
- No publicar comentarios negativos sin revisión

---

#### Historia de Usuario 3.3.3: CRUD de Encuestas de Satisfacción
**Como** administrador  
**Quiero** gestionar las encuestas de satisfacción  
**Para** personalizar las preguntas

**Criterios de Aceptación:**
- Ver encuestas configuradas
- Crear nuevas preguntas
- Editar preguntas existentes
- Activar/desactivar preguntas
- Definir tipo de respuesta (estrellas, texto, opción múltiple)
- Ordenar preguntas

---

#### Historia de Usuario 3.3.4: Ver Resultados de Calidad (Admin)
**Como** administrador  
**Quiero** ver los resultados de las encuestas  
**Para** evaluar la calidad del servicio

**Criterios de Aceptación:**
- Dashboard de calidad
- Promedio de satisfacción general
- Satisfacción por doctor
- Satisfacción por especialidad
- Tendencia temporal
- Comentarios destacados
- Alertas por calificaciones bajas

---

#### Historia de Usuario 3.3.5: Ver Calificaciones (Doctor)
**Como** doctor  
**Quiero** ver mis calificaciones  
**Para** conocer la percepción de mis pacientes

**Criterios de Aceptación:**
- Promedio de calificación
- Número total de evaluaciones
- Distribución de calificaciones
- Comentarios recibidos
- Tendencia mensual

---

#### Historia de Usuario 3.3.6: Lista de Espera
**Como** administrador  
**Quiero** gestionar una lista de espera  
**Para** atender pacientes cuando haya disponibilidad

**Criterios de Aceptación:**
- Agregar paciente a lista de espera
- Indicar especialidad o doctor deseado
- Indicar urgencia
- Notificar cuando haya disponibilidad
- Ordenar por prioridad y fecha de registro
- Remover de lista al agendar

---

## 🎯 Feature 4: Dashboards, Reportes y Seguridad

### Descripción
Este feature implementa los dashboards con estadísticas avanzadas para cada rol, la generación de reportes, el sistema de notificaciones, y las herramientas de auditoría y seguridad del sistema.

---

### Épica 4.1: Dashboard de Paciente

#### Historia de Usuario 4.1.1: Dashboard Principal del Paciente
**Como** paciente  
**Quiero** ver un resumen de mi actividad médica  
**Para** tener una visión general rápida

**Criterios de Aceptación:**
- Tarjeta de próximas citas con contador
- Tarjeta de citas completadas
- Tarjeta de resultados de laboratorio pendientes
- Tarjeta de recetas activas
- Detalle de próxima cita con información completa
- Historial reciente (últimas 3 consultas)
- Accesos rápidos a funciones principales

---

### Épica 4.2: Dashboard de Doctor

#### Historia de Usuario 4.2.1: Dashboard Principal del Doctor
**Como** doctor  
**Quiero** ver un resumen de mi actividad del día  
**Para** planificar mi jornada

**Criterios de Aceptación:**
- Estadísticas del día: citas totales, completadas, pendientes
- Estadísticas de la semana
- Lista de citas del día ordenadas por hora
- Cita próxima destacada
- Acciones pendientes (notas por completar, resultados por revisar)
- Calendario mini con citas de la semana
- Accesos rápidos a funciones principales

---

### Épica 4.3: Dashboard Administrativo

#### Historia de Usuario 4.3.1: Dashboard de Estadísticas Generales
**Como** administrador  
**Quiero** ver estadísticas generales de la clínica  
**Para** monitorear la operación

**Criterios de Aceptación:**
- Total de doctores (activos/inactivos)
- Total de especialidades
- Total de citas próximas
- Total de pacientes registrados
- Tendencia de citas mensual

---

#### Historia de Usuario 4.3.2: Estadísticas de Citas
**Como** administrador  
**Quiero** ver estadísticas detalladas de citas  
**Para** analizar la demanda

**Criterios de Aceptación:**
- Gráfico de citas por estado (pie chart)
- Gráfico de citas por mes (bar chart)
- Gráfico de citas por día de semana
- Filtros por rango de fechas
- Comparativa con período anterior

---

#### Historia de Usuario 4.3.3: Métricas Avanzadas
**Como** administrador  
**Quiero** ver métricas avanzadas de rendimiento  
**Para** tomar decisiones informadas

**Criterios de Aceptación:**
- Promedio de citas diarias
- Promedio de citas por doctor
- Tasa de cancelación
- Tasa de completitud
- Tasa de no-show
- Tiempo promedio de anticipación de reservas
- Duración promedio de consultas

---

#### Historia de Usuario 4.3.4: Horas Pico
**Como** administrador  
**Quiero** conocer las horas de mayor demanda  
**Para** optimizar la programación

**Criterios de Aceptación:**
- Lista de horas pico ordenada por demanda
- Mostrar hora en formato HH:00
- Mostrar cantidad de citas por hora
- Top 10 horas más demandadas
- Visualización clara y ordenada

---

#### Historia de Usuario 4.3.5: Performance por Doctor
**Como** administrador  
**Quiero** ver el rendimiento de cada doctor  
**Para** evaluar su productividad

**Criterios de Aceptación:**
- Tabla con métricas por doctor
- Total de citas
- Citas completadas
- Citas canceladas
- Tasa de no-show
- Score de eficiencia
- Ordenar por cualquier columna

---

#### Historia de Usuario 4.3.6: Performance por Especialidad
**Como** administrador  
**Quiero** ver el rendimiento por especialidad  
**Para** identificar áreas de oportunidad

**Criterios de Aceptación:**
- Tabla con métricas por especialidad
- Total de citas
- Citas completadas
- Duración promedio de consulta
- Tasa de completitud
- Score de demanda
- Distribución de doctores

---

### Épica 4.4: Reportes

#### Historia de Usuario 4.4.1: Exportar Reporte del Dashboard
**Como** administrador  
**Quiero** exportar las estadísticas del dashboard  
**Para** compartir o archivar la información

**Criterios de Aceptación:**
- Botón "Descargar Reporte" en dashboard
- Exportar a formato CSV
- Incluir todas las métricas visibles
- Incluir fecha de generación
- Nombre de archivo descriptivo

---

#### Historia de Usuario 4.4.2: Reportes de Citas (Doctor)
**Como** doctor  
**Quiero** generar reportes de mis citas  
**Para** llevar control de mi actividad

**Criterios de Aceptación:**
- Seleccionar rango de fechas
- Ver resumen de citas en el período
- Exportar a CSV o PDF
- Incluir estadísticas básicas

---

#### Historia de Usuario 4.4.3: Reporte de Facturación
**Como** administrador  
**Quiero** generar reportes de facturación  
**Para** analizar los ingresos

**Criterios de Aceptación:**
- Seleccionar rango de fechas
- Total facturado
- Total cobrado
- Total pendiente
- Desglose por servicio
- Desglose por doctor
- Exportar a CSV

---

### Épica 4.5: Sistema de Notificaciones

#### Historia de Usuario 4.5.1: Centro de Notificaciones (Paciente)
**Como** paciente  
**Quiero** ver todas mis notificaciones  
**Para** estar informado de novedades

**Criterios de Aceptación:**
- Lista de notificaciones ordenadas por fecha
- Tipos: citas, resultados, recetas, avisos
- Marcar como leída
- Indicador de notificaciones nuevas
- Filtrar por tipo

---

#### Historia de Usuario 4.5.2: Centro de Notificaciones (Doctor)
**Como** doctor  
**Quiero** ver mis notificaciones  
**Para** estar al tanto de mis pendientes

**Criterios de Aceptación:**
- Notificaciones de nuevas citas
- Notificaciones de cancelaciones
- Alertas de resultados de laboratorio
- Solicitudes de renovación de recetas
- Marcar como leída
- Indicador en menú

---

#### Historia de Usuario 4.5.3: Gestión de Notificaciones (Admin)
**Como** administrador  
**Quiero** gestionar las notificaciones del sistema  
**Para** comunicar información importante

**Criterios de Aceptación:**
- Crear notificación masiva
- Seleccionar destinatarios (todos, pacientes, doctores)
- Programar envío
- Ver historial de notificaciones enviadas
- Estadísticas de lectura

---

#### Historia de Usuario 4.5.4: Preferencias de Notificaciones
**Como** usuario  
**Quiero** configurar mis preferencias de notificaciones  
**Para** recibir solo lo que me interesa

**Criterios de Aceptación:**
- Activar/desactivar notificaciones por email
- Activar/desactivar notificaciones in-app
- Configurar frecuencia de recordatorios
- Seleccionar tipos de notificaciones

---

### Épica 4.6: Auditoría

#### Historia de Usuario 4.6.1: Registro de Acciones (Audit Log)
**Como** sistema  
**Quiero** registrar todas las acciones importantes  
**Para** mantener trazabilidad

**Criterios de Aceptación:**
- Registrar: usuario, acción, entidad, fecha/hora, IP
- Acciones: crear, editar, eliminar, login, logout
- Almacenar cambios realizados (antes/después)
- No permitir modificar logs
- Retención de logs configurable

---

#### Historia de Usuario 4.6.2: Consulta de Logs de Auditoría
**Como** administrador  
**Quiero** consultar los logs de auditoría  
**Para** investigar acciones en el sistema

**Criterios de Aceptación:**
- Lista de logs con paginación
- Filtrar por usuario
- Filtrar por tipo de acción
- Filtrar por rango de fechas
- Filtrar por entidad/módulo
- Ver detalle de cada log
- Exportar logs a CSV

---

#### Historia de Usuario 4.6.3: Alertas de Seguridad
**Como** administrador  
**Quiero** recibir alertas de actividad sospechosa  
**Para** actuar ante posibles amenazas

**Criterios de Aceptación:**
- Alerta por múltiples intentos de login fallidos
- Alerta por acceso desde ubicación inusual
- Alerta por acciones masivas
- Panel de alertas activas
- Marcar alertas como resueltas

---

### Épica 4.7: Seguridad y Accesos

#### Historia de Usuario 4.7.1: Gestión de Usuarios del Sistema
**Como** administrador  
**Quiero** gestionar los usuarios y sus accesos  
**Para** controlar quién puede usar el sistema

**Criterios de Aceptación:**
- Lista de todos los usuarios
- Ver último acceso
- Ver estado de cuenta
- Activar/desactivar usuarios
- Restablecer contraseña
- Ver historial de sesiones

---

#### Historia de Usuario 4.7.2: Cambio de Contraseña
**Como** usuario  
**Quiero** cambiar mi contraseña  
**Para** mantener mi cuenta segura

**Criterios de Aceptación:**
- Formulario de cambio de contraseña
- Solicitar contraseña actual
- Validar nueva contraseña
- Confirmar nueva contraseña
- Forzar cierre de otras sesiones
- Notificar por email del cambio

---

#### Historia de Usuario 4.7.3: Perfil de Usuario
**Como** usuario  
**Quiero** gestionar mi perfil  
**Para** mantener mi información actualizada

**Criterios de Aceptación:**
- Ver información personal
- Editar datos de contacto
- Cambiar foto de perfil
- Ver historial de sesiones
- Configurar preferencias

---

#### Historia de Usuario 4.7.4: Sesiones Activas
**Como** usuario  
**Quiero** ver mis sesiones activas  
**Para** detectar accesos no autorizados

**Criterios de Aceptación:**
- Lista de sesiones activas
- Información: dispositivo, ubicación, fecha
- Cerrar sesiones remotamente
- Cerrar todas las sesiones excepto actual

---

---

## 📊 Resumen de Historias de Usuario por Feature

| Feature | Épicas | Historias de Usuario |
|---------|--------|---------------------|
| Feature 0 | 3 | 12 |
| Feature 1 | 6 | 21 |
| Feature 2 | 5 | 17 |
| Feature 3 | 3 | 14 |
| Feature 4 | 7 | 18 |
| **Total** | **24** | **82** |

---

## 📝 Glosario

| Término | Definición |
|---------|------------|
| **CRUD** | Create, Read, Update, Delete - operaciones básicas de datos |
| **SOAP** | Subjective, Objective, Assessment, Plan - formato de notas médicas |
| **JWT** | JSON Web Token - sistema de autenticación |
| **OAuth** | Protocolo de autorización para login con terceros |
| **QR** | Quick Response - código de respuesta rápida |
| **Check-in** | Registro de llegada del paciente |
| **No-show** | Paciente que no se presenta a su cita |
| **Slot** | Espacio de tiempo disponible para cita |

---

*Documento generado para el Sistema de Gestión de Citas Médicas - Clínica San Miguel*  
*Versión 1.0 - Febrero 2026*
