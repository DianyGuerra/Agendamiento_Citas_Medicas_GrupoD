# 📋 Guía de Usuario - Sistema de Gestión de Citas Médicas

## Clínica San Miguel

---

## 📑 Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Requisitos del Sistema](#2-requisitos-del-sistema)
3. [Acceso al Sistema](#3-acceso-al-sistema)
   - [Registro de Nuevo Usuario](#31-registro-de-nuevo-usuario)
   - [Inicio de Sesión](#32-inicio-de-sesión)
   - [Recuperación de Contraseña](#33-recuperación-de-contraseña)
   - [Inicio de Sesión con Google](#34-inicio-de-sesión-con-google)
4. [Panel del Paciente](#4-panel-del-paciente)
   - [Dashboard Principal](#41-dashboard-principal)
   - [Agendar Nueva Cita](#42-agendar-nueva-cita)
   - [Gestión de Citas](#43-gestión-de-citas)
   - [Historial Médico](#44-historial-médico)
   - [Recetas Médicas](#45-recetas-médicas)
   - [Resultados de Laboratorio](#46-resultados-de-laboratorio)
   - [Facturación](#47-facturación)
   - [Notificaciones](#48-notificaciones)
   - [Perfil del Paciente](#49-perfil-del-paciente)
5. [Panel del Doctor](#5-panel-del-doctor)
   - [Dashboard del Doctor](#51-dashboard-del-doctor)
   - [Agenda de Citas](#52-agenda-de-citas)
   - [Consulta Médica](#53-consulta-médica)
   - [Gestión de Pacientes](#54-gestión-de-pacientes)
   - [Recetas y Prescripciones](#55-recetas-y-prescripciones)
   - [Órdenes de Laboratorio](#56-órdenes-de-laboratorio)
   - [Reportes y Estadísticas](#57-reportes-y-estadísticas)
   - [Horarios y Disponibilidad](#58-horarios-y-disponibilidad)
   - [Perfil del Doctor](#59-perfil-del-doctor)
6. [Panel de Administración](#6-panel-de-administración)
   - [Dashboard Administrativo](#61-dashboard-administrativo)
   - [Calendario de Recepción](#62-calendario-de-recepción)
   - [Gestión de Doctores](#63-gestión-de-doctores)
   - [Gestión de Horarios](#64-gestión-de-horarios)
   - [Gestión de Consultorios](#65-gestión-de-consultorios)
   - [Gestión de Especialidades](#66-gestión-de-especialidades)
   - [Gestión de Pacientes](#67-gestión-de-pacientes)
   - [Consultas y Laboratorio](#68-consultas-y-laboratorio)
   - [Facturación](#69-facturación)
   - [Seguros Médicos](#610-seguros-médicos)
   - [Control de Calidad](#611-control-de-calidad)
   - [Seguridad y Auditoría](#612-seguridad-y-auditoría)
7. [Funcionalidades Especiales](#7-funcionalidades-especiales)
   - [Verificación de Recetas por QR](#71-verificación-de-recetas-por-qr)
   - [Confirmación de Citas por Email](#72-confirmación-de-citas-por-email)
   - [Calificación de Consultas](#73-calificación-de-consultas)
8. [Preguntas Frecuentes (FAQ)](#8-preguntas-frecuentes-faq)
9. [Solución de Problemas](#9-solución-de-problemas)
10. [Contacto y Soporte](#10-contacto-y-soporte)

---

## 1. Introducción

Bienvenido al **Sistema de Gestión de Citas Médicas de la Clínica San Miguel**. Esta plataforma integral permite la gestión eficiente de citas médicas, historiales clínicos, recetas, órdenes de laboratorio y facturación.

### 🎯 Objetivos del Sistema

- Facilitar la programación y gestión de citas médicas
- Mantener un registro digital completo del historial médico de los pacientes
- Agilizar el proceso de consulta médica
- Gestionar recetas y órdenes de laboratorio de forma segura
- Proporcionar herramientas de análisis y reportes para la administración

### 👥 Tipos de Usuarios

El sistema cuenta con tres roles principales:

| Rol | Descripción |
|-----|-------------|
| **Paciente** | Usuarios que agendan citas, revisan su historial médico y recetas |
| **Doctor** | Profesionales médicos que atienden consultas y generan diagnósticos |
| **Administrador** | Personal que gestiona la operación general de la clínica |

---

## 2. Requisitos del Sistema

### 🖥️ Requisitos de Hardware

- Computadora, tablet o smartphone con conexión a internet
- Resolución de pantalla mínima recomendada: 1024x768 píxeles

### 🌐 Navegadores Compatibles

| Navegador | Versión Mínima |
|-----------|----------------|
| Google Chrome | 90+ |
| Mozilla Firefox | 88+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |

### 📱 Dispositivos Móviles

- iOS 14 o superior
- Android 10 o superior

### ⚙️ Requisitos Adicionales

- JavaScript habilitado en el navegador
- Cookies habilitadas
- Conexión a internet estable (mínimo 1 Mbps)

---

## 3. Acceso al Sistema

### 3.1 Registro de Nuevo Usuario

Para registrarse como nuevo paciente en el sistema:

1. **Acceder a la página principal** del sistema
2. **Hacer clic en "Registrarse"** en la parte superior derecha
3. **Completar el formulario de registro** con los siguientes datos:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| Nombre | Su nombre de pila | ✅ |
| Apellido | Su apellido completo | ✅ |
| Cédula | Número de cédula (10 dígitos) | ✅ |
| Fecha de nacimiento | Debe ser mayor de 18 años | ✅ |
| Teléfono | Número de contacto (10 dígitos) | ❌ |
| Email | Correo electrónico válido | ✅ |
| Contraseña | Mínimo 6 caracteres | ✅ |
| Confirmar contraseña | Debe coincidir con la contraseña | ✅ |

4. **Aceptar los términos y condiciones**
5. **Hacer clic en "Registrarse"**
6. Se le redirigirá automáticamente a la página de inicio de sesión

> ⚠️ **Importante**: Asegúrese de proporcionar un correo electrónico válido, ya que recibirá notificaciones importantes sobre sus citas.

### 3.2 Inicio de Sesión

Para acceder al sistema:

1. **Navegar a la página de inicio de sesión**
2. **Ingresar sus credenciales**:
   - Correo electrónico registrado
   - Contraseña
3. **Hacer clic en "Iniciar Sesión"**
4. El sistema le redirigirá automáticamente al panel correspondiente según su rol

### 3.3 Recuperación de Contraseña

Si olvidó su contraseña:

1. En la página de inicio de sesión, hacer clic en **"¿Olvidaste tu contraseña?"**
2. Ingresar el correo electrónico asociado a su cuenta
3. Recibirá un enlace para restablecer su contraseña
4. Seguir las instrucciones del correo electrónico

### 3.4 Inicio de Sesión con Google

El sistema permite autenticación con Google para mayor comodidad:

1. En la página de inicio de sesión, hacer clic en **"Continuar con Google"**
2. Seleccionar su cuenta de Google
3. Autorizar el acceso
4. Si es primera vez, se le pedirá completar su perfil con datos adicionales

---

## 4. Panel del Paciente

### 4.1 Dashboard Principal

El dashboard del paciente muestra un resumen de su actividad médica:

#### Tarjetas de Resumen

| Tarjeta | Descripción |
|---------|-------------|
| **Próximas Citas** | Número de citas programadas pendientes |
| **Citas Completadas** | Total de consultas realizadas |
| **Resultados Pendientes** | Exámenes de laboratorio en proceso |
| **Recetas Activas** | Prescripciones médicas vigentes |

#### Próxima Cita

Se muestra la información detallada de su próxima cita:
- Nombre del doctor
- Especialidad
- Fecha y hora
- Consultorio asignado

#### Historial Reciente

Muestra las últimas 3 consultas realizadas con:
- Fecha de la consulta
- Diagnóstico principal
- Doctor que atendió
- Especialidad

#### Acciones Rápidas

- 📅 **Nueva Cita**: Agendar una nueva cita médica
- 📋 **Historial**: Ver historial médico completo
- 💊 **Recetas**: Consultar recetas activas
- 🔬 **Laboratorio**: Ver resultados de exámenes

### 4.2 Agendar Nueva Cita

Para agendar una nueva cita médica:

#### Paso 1: Selección de Especialidad y Doctor

1. Acceder a **"Nueva Cita"** desde el dashboard o menú lateral
2. **Seleccionar la especialidad** que necesita
3. **Elegir un doctor** de la lista disponible para esa especialidad
4. **Seleccionar la fecha** deseada para la consulta

#### Paso 2: Selección de Horario

1. El sistema mostrará los **horarios disponibles** para el doctor seleccionado
2. Los horarios se muestran en bloques de 30 minutos
3. Los horarios ocupados aparecen deshabilitados
4. **Hacer clic en el horario** que prefiera

#### Paso 3: Confirmación

1. **Revisar los datos** de la cita:
   - Especialidad
   - Doctor
   - Fecha y hora
   - Duración estimada
2. **Agregar el motivo** de la consulta (opcional pero recomendado)
3. **Confirmar la cita** haciendo clic en "Agendar Cita"

#### Estados de la Cita

| Estado | Descripción | Color |
|--------|-------------|-------|
| Programada | Cita agendada, pendiente de confirmación | 🟡 Amarillo |
| Confirmada | Cita confirmada por el paciente | 🔵 Azul |
| Check-in | Paciente ha llegado a la clínica | 🟣 Morado |
| Completada | Consulta finalizada | 🟢 Verde |
| Cancelada | Cita cancelada | 🔴 Rojo |
| No asistió | Paciente no se presentó | ⚫ Gris |

### 4.3 Gestión de Citas

En la sección **"Mis Citas"** puede:

#### Ver Citas

- **Próximas citas**: Lista de citas programadas
- **Historial de citas**: Citas pasadas completadas o canceladas

#### Acciones Disponibles

| Acción | Descripción |
|--------|-------------|
| **Ver Detalles** | Información completa de la cita |
| **Confirmar** | Confirmar asistencia a la cita |
| **Reprogramar** | Cambiar fecha/hora de la cita |
| **Cancelar** | Cancelar la cita (requiere motivo) |
| **Calificar** | Evaluar la consulta (solo citas completadas) |

#### Cancelación de Citas

Para cancelar una cita:
1. Hacer clic en **"Cancelar"** en la cita deseada
2. Seleccionar el **motivo de cancelación**
3. Confirmar la cancelación

> ⚠️ **Nota**: Se recomienda cancelar con al menos 24 horas de anticipación para evitar cargos.

### 4.4 Historial Médico

El historial médico contiene toda su información clínica:

#### Información General

- Datos personales
- Información de contacto
- Contacto de emergencia
- Seguro médico

#### Antecedentes Médicos

- Alergias conocidas
- Enfermedades crónicas
- Cirugías previas
- Medicamentos actuales

#### Registros de Consultas

Cada consulta incluye:
- Fecha y hora
- Doctor que atendió
- Signos vitales registrados
- Notas SOAP (Subjetivo, Objetivo, Análisis, Plan)
- Diagnóstico
- Tratamiento indicado
- Cita de seguimiento (si aplica)

### 4.5 Recetas Médicas

En la sección de **Recetas** puede:

#### Ver Recetas

- Lista de todas las recetas emitidas
- Filtrar por fecha, doctor o estado
- Ver detalles de cada medicamento

#### Información de Cada Receta

| Campo | Descripción |
|-------|-------------|
| Medicamento | Nombre del fármaco |
| Dosis | Cantidad a tomar |
| Frecuencia | Cada cuánto tomar |
| Duración | Por cuánto tiempo |
| Instrucciones | Indicaciones especiales |

#### Código QR de Verificación

Cada receta incluye un código QR único que permite:
- Verificar la autenticidad de la receta
- Confirmar que no ha sido alterada
- Validar que no ha expirado

### 4.6 Resultados de Laboratorio

#### Ver Resultados

- Lista de órdenes de laboratorio
- Estado de cada orden (pendiente, procesando, completado)
- Descargar resultados en PDF

#### Estados de Órdenes

| Estado | Descripción |
|--------|-------------|
| Pendiente | Orden emitida, muestra no tomada |
| Procesando | Muestra en análisis |
| Completado | Resultados disponibles |

### 4.7 Facturación

En la sección de **Facturación**:

- Ver historial de facturas
- Estado de pagos (pendiente, pagado)
- Descargar facturas en PDF
- Ver detalle de servicios facturados
- Información del seguro aplicado (si corresponde)

### 4.8 Notificaciones

El sistema envía notificaciones sobre:

- 📅 Recordatorio de citas próximas
- ✅ Confirmación de citas agendadas
- ❌ Cancelación de citas
- 🔬 Resultados de laboratorio disponibles
- 💊 Renovación de recetas
- 📢 Avisos generales de la clínica

#### Configuración de Notificaciones

Puede configurar:
- Notificaciones por correo electrónico
- Notificaciones en la aplicación
- Frecuencia de recordatorios

### 4.9 Perfil del Paciente

En **Mi Perfil** puede:

#### Datos Personales

- Actualizar información de contacto
- Cambiar foto de perfil
- Actualizar dirección

#### Información Médica

- Actualizar alergias
- Agregar enfermedades crónicas
- Actualizar medicamentos actuales
- Información del seguro médico

#### Seguridad

- Cambiar contraseña
- Ver historial de inicio de sesión
- Configurar autenticación de dos factores

---

## 5. Panel del Doctor

### 5.1 Dashboard del Doctor

El dashboard proporciona una visión general de la actividad del día:

#### Estadísticas del Día

| Métrica | Descripción |
|---------|-------------|
| **Citas Hoy** | Total de citas programadas para hoy |
| **Esta Semana** | Citas de los próximos 7 días |
| **Completadas** | Consultas finalizadas hoy |
| **Pendientes** | Citas por atender |

#### Citas del Día

Lista cronológica de las citas del día con:
- Hora de la cita
- Nombre del paciente
- Motivo de consulta
- Estado actual
- Acciones rápidas (iniciar consulta, ver historial)

#### Acciones Pendientes

Alertas sobre:
- Citas próximas a iniciar (en los próximos 30 minutos)
- Notas de consulta pendientes de completar
- Resultados de laboratorio por revisar
- Recetas pendientes de firma

### 5.2 Agenda de Citas

#### Vista de Calendario

El calendario muestra todas las citas del doctor:
- Vista mensual, semanal o diaria
- Código de colores por estado de cita
- Filtros por estado

#### Gestión de Citas

Desde la agenda puede:
- Ver detalles de cada cita
- Confirmar citas
- Realizar check-in del paciente
- Iniciar consulta
- Cancelar o reprogramar

### 5.3 Consulta Médica

La consulta médica sigue un flujo estructurado en 4 pasos:

#### Paso 1: Signos Vitales

Registro de signos vitales del paciente:

| Signo | Unidad |
|-------|--------|
| Presión arterial | mmHg (sistólica/diastólica) |
| Frecuencia cardíaca | lpm |
| Temperatura | °C |
| Frecuencia respiratoria | rpm |
| Saturación de oxígeno | % |
| Peso | kg |
| Altura | cm |

#### Paso 2: Notas SOAP

Sistema de documentación médica estructurado:

| Sección | Contenido |
|---------|-----------|
| **Subjetivo** | Síntomas reportados por el paciente, historia de la enfermedad actual |
| **Objetivo** | Hallazgos del examen físico, signos vitales, resultados de estudios |
| **Análisis** | Diagnóstico diferencial, diagnóstico principal, razonamiento clínico |
| **Plan** | Tratamiento, medicamentos, estudios a solicitar, seguimiento |

#### Paso 3: Recetas

Generación de prescripciones médicas:

1. **Agregar medicamento** con:
   - Nombre del medicamento
   - Dosis
   - Frecuencia
   - Duración del tratamiento
   - Instrucciones especiales

2. Las recetas generan automáticamente un código QR para verificación

3. El paciente recibe la receta por correo electrónico

#### Paso 4: Órdenes de Laboratorio

Solicitud de exámenes:

1. **Seleccionar exámenes** de la lista de pruebas comunes:
   - Hemograma completo
   - Glucosa en ayunas
   - Perfil lipídico
   - Función renal
   - Función hepática
   - Urianálisis
   - Y más...

2. **Indicar prioridad**:
   - Normal
   - Urgente

3. **Agregar notas** o instrucciones especiales

#### Finalización de Consulta

Al completar todos los pasos:
1. Revisar la información ingresada
2. Confirmar y guardar la consulta
3. Opcionalmente, agendar cita de seguimiento
4. El paciente recibe notificación de consulta completada

### 5.4 Gestión de Pacientes

#### Lista de Pacientes

- Ver todos los pacientes atendidos
- Buscar por nombre o cédula
- Filtrar por última consulta

#### Historial del Paciente

Para cada paciente puede ver:
- Información personal
- Antecedentes médicos
- Historial de consultas
- Recetas emitidas
- Resultados de laboratorio
- Notas clínicas

### 5.5 Recetas y Prescripciones

#### Gestión de Recetas

- Ver todas las recetas emitidas
- Filtrar por paciente o fecha
- Ver estado de cada receta
- Renovar recetas existentes

#### Renovación de Recetas

Para pacientes con tratamientos crónicos:
1. Seleccionar la receta a renovar
2. Verificar que el paciente está al día con sus controles
3. Ajustar dosis si es necesario
4. Emitir nueva receta

### 5.6 Órdenes de Laboratorio

#### Gestión de Órdenes

- Ver órdenes pendientes de resultados
- Revisar resultados recibidos
- Marcar como revisado
- Agregar notas sobre los resultados

### 5.7 Reportes y Estadísticas

El doctor tiene acceso a reportes de su actividad:

#### Estadísticas Disponibles

| Reporte | Descripción |
|---------|-------------|
| Citas por mes | Gráfico de citas atendidas mensualmente |
| Tasa de completitud | Porcentaje de citas completadas vs canceladas |
| Diagnósticos frecuentes | Top 10 diagnósticos más comunes |
| Tiempo promedio de consulta | Duración promedio de las consultas |

#### Exportar Reportes

Puede descargar reportes en formato CSV o PDF.

### 5.8 Horarios y Disponibilidad

#### Gestión de Horarios

El doctor puede ver (pero no modificar directamente):
- Horarios regulares de atención
- Días de la semana que atiende
- Duración de las citas

> ⚠️ Para modificar horarios, contactar a administración.

#### Excepciones

Puede solicitar a administración:
- Días de vacaciones
- Ausencias programadas
- Cambios temporales de horario

### 5.9 Perfil del Doctor

#### Información Profesional

- Especialidad
- Número de licencia médica
- Años de experiencia
- Formación académica

#### Datos de Contacto

- Teléfono
- Correo electrónico
- Foto de perfil

#### Configuración

- Cambiar contraseña
- Preferencias de notificaciones

---

## 6. Panel de Administración

### 6.1 Dashboard Administrativo

El dashboard administrativo muestra métricas clave de la clínica:

#### Estadísticas Generales

| Métrica | Descripción |
|---------|-------------|
| Total Doctores | Doctores registrados en el sistema |
| Doctores Activos | Doctores actualmente atendiendo |
| Total Especialidades | Especialidades ofrecidas |
| Próximas Citas | Citas programadas |

#### Estadísticas de Citas

- **Por estado**: Gráfico circular mostrando distribución
- **Por mes**: Gráfico de barras con tendencia mensual
- **Por día de semana**: Análisis de demanda semanal

#### Métricas Avanzadas

| Métrica | Descripción |
|---------|-------------|
| Citas diarias promedio | Promedio de citas por día |
| Citas por doctor | Promedio de citas por médico |
| Tasa de cancelación | Porcentaje de citas canceladas |
| Tasa de completitud | Porcentaje de citas completadas |
| Tasa de No Show | Porcentaje de pacientes que no asisten |

#### Horas Pico

Muestra las horas de mayor demanda ordenadas por cantidad de citas:
- Formato: HH:00
- Cantidad de citas por hora

#### Performance por Doctor

Tabla con métricas de cada doctor:
- Total de citas
- Citas completadas
- Score de eficiencia

#### Performance por Especialidad

Análisis de demanda por especialidad:
- Total de citas
- Duración promedio
- Tasa de completitud

#### Exportar Reporte

Botón para descargar reporte completo en CSV con todas las métricas.

### 6.2 Calendario de Recepción

Herramienta central para gestión de citas del día a día:

#### Vista de Calendario

- Navegación por mes
- Vista de días con indicador de citas
- Código de colores por cantidad

#### Tarjetas de Resumen

| Tarjeta | Descripción |
|---------|-------------|
| Confirmadas | Citas confirmadas por pacientes |
| Pendientes | Citas sin confirmar |
| Check-in | Pacientes que han llegado |
| Completadas | Consultas finalizadas |
| Canceladas | Citas canceladas |
| No asistió | Pacientes ausentes |

#### Modal de Día

Al hacer clic en un día:
- Lista de todas las citas del día
- Información de cada cita:
  - Hora
  - Paciente
  - Doctor
  - Especialidad
  - Estado
  - Consultorio

#### Acciones por Cita

| Acción | Descripción | Color |
|--------|-------------|-------|
| **Sala** | Asignar o cambiar consultorio | Teal |
| **Reasignar** | Cambiar doctor asignado | Ámbar |
| **Reagendar** | Cambiar fecha/hora | Índigo |
| **Cancelar** | Cancelar la cita | Rojo |

#### Asignar Consultorio

1. Hacer clic en "Sala"
2. Seleccionar consultorio disponible
3. Confirmar asignación

#### Reasignar Doctor

1. Hacer clic en "Reasignar"
2. Seleccionar nuevo doctor (de la misma especialidad)
3. Confirmar reasignación

#### Reagendar Cita

1. Hacer clic en "Reagendar"
2. Seleccionar nueva fecha
3. El sistema muestra horarios disponibles del doctor
4. Seleccionar nuevo horario
5. Opcionalmente agregar motivo
6. Confirmar reagendamiento

#### Descargar Reporte

Botón verde para exportar todas las citas del mes a CSV.

### 6.3 Gestión de Doctores

#### Lista de Doctores

Vista de todos los doctores con:
- Foto
- Nombre completo
- Especialidad
- Estado (activo/inactivo)
- Acciones (ver, editar, desactivar)

#### Agregar Nuevo Doctor

1. Hacer clic en "Nuevo Doctor"
2. Completar formulario:
   - Datos personales (nombre, cédula, fecha de nacimiento)
   - Datos de contacto (email, teléfono)
   - Información profesional (especialidad, licencia)
   - Credenciales de acceso
3. Guardar

#### Editar Doctor

- Actualizar información personal
- Cambiar especialidad
- Modificar estado
- Actualizar foto de perfil

### 6.4 Gestión de Horarios

#### Horarios Regulares

Configuración de horarios de atención para cada doctor:

| Campo | Descripción |
|-------|-------------|
| Día de semana | Lunes a Domingo |
| Hora inicio | Hora de inicio de atención |
| Hora fin | Hora de fin de atención |
| Duración cita | Duración de cada cita (minutos) |

#### Excepciones de Horario

Para manejar ausencias y cambios:

| Tipo | Descripción |
|------|-------------|
| Vacaciones | Días de descanso programados |
| Día festivo | Feriados |
| Capacitación | Ausencia por formación |
| Emergencia | Ausencias no programadas |

#### Crear Excepción

1. Seleccionar doctor
2. Indicar tipo de excepción
3. Establecer fechas (inicio y fin)
4. Agregar notas
5. Guardar

### 6.5 Gestión de Consultorios

#### Lista de Consultorios

| Campo | Descripción |
|-------|-------------|
| Nombre | Identificador del consultorio |
| Número | Número de habitación |
| Piso | Ubicación en el edificio |
| Equipamiento | Equipos disponibles |
| Estado | Disponible/Ocupado/Mantenimiento |

#### Agregar Consultorio

1. Nombre del consultorio
2. Número de habitación
3. Piso
4. Equipamiento disponible
5. Marcar como disponible

#### Asignación a Citas

Los consultorios se asignan a las citas desde el calendario de recepción.

### 6.6 Gestión de Especialidades

#### Lista de Especialidades

- Nombre de la especialidad
- Descripción
- Número de doctores asignados
- Estado (activa/inactiva)

#### Agregar Especialidad

1. Nombre
2. Descripción detallada
3. Duración estándar de consulta
4. Guardar

### 6.7 Gestión de Pacientes

#### Lista de Pacientes

Búsqueda y visualización de pacientes:
- Nombre completo
- Cédula
- Email
- Teléfono
- Fecha de última cita

#### Ver Paciente

Acceso completo al perfil:
- Información personal
- Historial de citas
- Historial médico
- Facturas

#### Editar Paciente

- Actualizar información de contacto
- Actualizar información médica
- Gestionar seguro médico

### 6.8 Consultas y Laboratorio

#### Consultas

Vista de todas las consultas realizadas:
- Filtrar por fecha, doctor, paciente
- Ver detalles de cada consulta
- Exportar registros

#### Laboratorio

Gestión de órdenes de laboratorio:
- Ver órdenes pendientes
- Actualizar estado de órdenes
- Cargar resultados
- Notificar a paciente

### 6.9 Facturación

#### Gestión de Facturas

| Función | Descripción |
|---------|-------------|
| Crear factura | Generar nueva factura |
| Ver facturas | Lista de todas las facturas |
| Cobrar | Registrar pago |
| Anular | Anular factura emitida |

#### Estados de Factura

| Estado | Descripción |
|--------|-------------|
| Pendiente | Factura emitida, pago pendiente |
| Pagada | Pago recibido |
| Parcial | Pago parcial realizado |
| Anulada | Factura cancelada |

#### Items Facturables

- Consultas médicas
- Procedimientos
- Exámenes de laboratorio
- Medicamentos
- Otros servicios

### 6.10 Seguros Médicos

#### Proveedores de Seguro

Lista de aseguradoras con convenio:
- Nombre del proveedor
- Tipo de cobertura
- Porcentaje de cobertura
- Servicios cubiertos

#### Agregar Proveedor

1. Datos de la aseguradora
2. Tipos de plan
3. Cobertura por servicio
4. Información de contacto

### 6.11 Control de Calidad

#### Encuestas de Satisfacción

Gestión de encuestas post-consulta:
- Ver resultados de encuestas
- Estadísticas de satisfacción
- Comentarios de pacientes

#### Calificaciones por Doctor

- Promedio de calificación
- Número de evaluaciones
- Comentarios destacados

### 6.12 Seguridad y Auditoría

#### Gestión de Usuarios

| Función | Descripción |
|---------|-------------|
| Ver usuarios | Lista de todos los usuarios |
| Activar/Desactivar | Cambiar estado de cuenta |
| Restablecer contraseña | Generar nueva contraseña |
| Asignar rol | Cambiar permisos |

#### Logs de Auditoría

Registro de todas las acciones en el sistema:
- Usuario que realizó la acción
- Tipo de acción
- Fecha y hora
- Detalles de la operación

#### Filtros de Auditoría

- Por usuario
- Por tipo de acción
- Por fecha
- Por módulo

---

## 7. Funcionalidades Especiales

### 7.1 Verificación de Recetas por QR

Cada receta médica incluye un código QR único para verificación:

#### Proceso de Verificación

1. **Escanear el código QR** con cualquier lector de QR
2. Se abre la página de verificación automáticamente
3. El sistema muestra:
   - Estado de la receta (válida/inválida/expirada)
   - Información del paciente
   - Información del doctor
   - Detalles de los medicamentos
   - Fecha de emisión y vencimiento

#### Usos del QR

- Farmacias pueden verificar autenticidad
- Prevención de falsificación
- Control de dispensación

### 7.2 Confirmación de Citas por Email

El sistema envía correos automáticos para:

#### Tipos de Notificaciones

| Evento | Contenido del Correo |
|--------|---------------------|
| Cita creada | Confirmación de agendamiento con botón para confirmar |
| Recordatorio 24h | Recordatorio un día antes de la cita |
| Recordatorio 1h | Recordatorio una hora antes |
| Cita cancelada | Notificación de cancelación |
| Cita reagendada | Nueva fecha y hora |
| Consulta completada | Resumen de la consulta |
| Resultados de lab | Notificación de resultados disponibles |

#### Enlace de Confirmación

Cada correo incluye un enlace único para confirmar la cita directamente sin necesidad de iniciar sesión.

### 7.3 Calificación de Consultas

Después de cada consulta, el paciente puede evaluar la experiencia:

#### Sistema de Calificación

- **Estrellas**: 1 a 5 estrellas
- **Aspectos evaluados**:
  - Puntualidad
  - Atención del doctor
  - Claridad de explicaciones
  - Instalaciones
- **Comentarios**: Campo libre para observaciones

#### Acceso a Calificación

1. Desde el correo de consulta completada
2. Desde la sección "Mis Citas" > cita completada
3. Enlace directo enviado por email

---

## 8. Preguntas Frecuentes (FAQ)

### Registro y Acceso

**P: ¿Puedo registrarme si soy menor de edad?**
R: No, el registro directo requiere ser mayor de 18 años. Los menores deben ser registrados por un tutor legal.

**P: ¿Olvidé mi contraseña, qué hago?**
R: Use la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión para recibir un enlace de restablecimiento por correo.

**P: ¿Puedo tener más de una cuenta?**
R: No, solo se permite una cuenta por número de cédula.

### Citas

**P: ¿Con cuánta anticipación puedo agendar una cita?**
R: Puede agendar citas hasta con 30 días de anticipación, dependiendo de la disponibilidad del doctor.

**P: ¿Puedo agendar múltiples citas el mismo día?**
R: Sí, puede tener citas con diferentes especialidades el mismo día.

**P: ¿Qué pasa si no puedo asistir a mi cita?**
R: Cancele la cita con al menos 24 horas de anticipación para evitar cargos por no asistencia.

**P: ¿Cómo sé en qué consultorio debo presentarme?**
R: Recibirá una notificación con el consultorio asignado. También puede verificar en "Mis Citas".

### Historial Médico

**P: ¿Quién puede ver mi historial médico?**
R: Solo usted, los doctores que le atienden y el personal administrativo autorizado.

**P: ¿Puedo solicitar una copia de mi historial?**
R: Sí, puede descargar su historial desde la sección correspondiente o solicitarlo en recepción.

### Recetas y Laboratorio

**P: ¿Por cuánto tiempo es válida una receta?**
R: Las recetas tienen una validez de 30 días desde su emisión, a menos que el doctor indique lo contrario.

**P: ¿Cuánto tardan los resultados de laboratorio?**
R: Depende del tipo de examen. La mayoría de exámenes básicos están disponibles en 24-48 horas.

### Facturación

**P: ¿Qué formas de pago aceptan?**
R: Efectivo, tarjeta de débito/crédito, y seguros médicos con convenio.

**P: ¿Puedo solicitar factura después de la consulta?**
R: Sí, puede solicitar su factura hasta 30 días después de la consulta.

---

## 9. Solución de Problemas

### Problemas de Acceso

| Problema | Solución |
|----------|----------|
| No puedo iniciar sesión | Verifique que las credenciales sean correctas. Use "Recuperar contraseña" si es necesario |
| La página no carga | Verifique su conexión a internet. Intente en otro navegador |
| Error al registrarse | Verifique que todos los campos obligatorios estén completos y la cédula tenga 10 dígitos |

### Problemas con Citas

| Problema | Solución |
|----------|----------|
| No veo horarios disponibles | El doctor puede no tener disponibilidad. Intente otra fecha o doctor |
| No puedo cancelar mi cita | Las citas solo pueden cancelarse hasta 1 hora antes |
| Mi cita no aparece | Actualice la página. Si persiste, contacte a soporte |

### Problemas Técnicos

| Problema | Solución |
|----------|----------|
| La página se ve diferente | Limpie el caché del navegador (Ctrl+Shift+Delete) |
| Los botones no funcionan | Asegúrese de que JavaScript esté habilitado |
| No recibo correos | Verifique la carpeta de spam. Agregue nuestro dominio a contactos |

### Errores Comunes

| Código | Significado | Acción |
|--------|-------------|--------|
| 401 | Sesión expirada | Inicie sesión nuevamente |
| 403 | Sin permisos | Contacte a administración |
| 404 | Página no encontrada | Verifique la URL |
| 500 | Error del servidor | Intente más tarde o contacte soporte |

---

## 10. Contacto y Soporte

### Canales de Atención

| Canal | Información | Horario |
|-------|-------------|---------|
| **Teléfono** | +593 (0) 000-0000 | Lun-Vie 8:00-18:00 |
| **WhatsApp** | +593 000-000-0000 | Lun-Vie 8:00-18:00 |
| **Email** | soporte@clinicasanmiguel.com | 24/7 (respuesta en 24h) |
| **Presencial** | Recepción de la clínica | Lun-Sáb 7:00-20:00 |

### Soporte Técnico

Para problemas técnicos con el sistema:
- **Email técnico**: sistemas@clinicasanmiguel.com
- **Horario**: Lunes a Viernes 8:00-18:00

### Emergencias Médicas

> ⚠️ **En caso de emergencia médica, llame al 911 o acuda al servicio de emergencias más cercano.**

Este sistema es para gestión de citas programadas, no para emergencias.

---

## 📌 Notas Finales

Este manual está sujeto a actualizaciones conforme el sistema evolucione. La versión más reciente siempre estará disponible en el sistema.

**Versión del Manual**: 1.0  
**Última Actualización**: Febrero 2026  
**Sistema**: Medical Appointment Web System v2.0

---

*© 2026 Clínica San Miguel. Todos los derechos reservados.*
