# Sistema de Notificaciones por Email - Clínica San Miguel

## 📋 Características Implementadas

### ✅ Notificaciones Automáticas

1. **Recordatorio 24 horas antes de la cita**
   - Se crea automáticamente al crear una cita
   - Se envía 24 horas antes de la fecha programada
   - Incluye detalles completos: doctor, especialidad, fecha, hora, ubicación

2. **Cancelación de cita**
   - Se envía cuando el doctor cambia el status a "cancelado" (status_id = 5)
   - Incluye el motivo de cancelación (si se proporciona)

3. **Reprogramación de cita**
   - Se envía cuando el doctor cambia la fecha/hora de una cita existente
   - Muestra la fecha anterior y la nueva fecha
   - Incluye motivo de reprogramación (si se proporciona)

## 🎨 Diseño de Emails

Los correos tienen:
- Plantillas HTML profesionales con diseño responsive
- Gradientes azules corporativos
- Logo de la clínica (🏥)
- Botones de acción con enlaces al sistema
- Información organizada en tarjetas visuales
- Footer con datos de contacto

## 🔧 Configuración

### Modo Actual: SIMULACIÓN

Por defecto, el sistema está en **modo simulación**. Los emails se muestran en la consola del servidor pero NO se envían realmente.

### Activar Emails Reales

Para enviar emails reales, configura SMTP en el archivo `.env`:

```env
# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
```

#### Opción 1: Gmail

1. **Habilita la verificación en 2 pasos** en tu cuenta de Gmail
2. **Genera una contraseña de aplicación**:
   - Ve a https://myaccount.google.com/security
   - Busca "Contraseñas de aplicaciones"
   - Genera una nueva para "Correo"
3. **Usa esa contraseña en `SMTP_PASS`**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=clinicasanmiguel@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

#### Opción 2: Otros Proveedores

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu_email@outlook.com
SMTP_PASS=tu_contraseña
```

**SendGrid (profesional):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu_api_key_de_sendgrid
```

## ⏰ Scheduler de Recordatorios

El sistema revisa **cada 5 minutos** si hay recordatorios pendientes para enviar.

### Logs del Scheduler

```
✅ Scheduler de recordatorios iniciado (cada 5 minutos)
🔍 Revisando recordatorios pendientes...
📬 Encontrados 3 recordatorios para enviar
✅ Recordatorio enviado para cita abc-123
```

## 📊 Tabla de Reminders

La tabla `reminders` almacena todos los recordatorios:

```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id),
  reminder_type VARCHAR(50),           -- 'appointment_reminder'
  scheduled_send_time TIMESTAMP,       -- Cuándo enviar
  sent_at TIMESTAMP,                   -- Cuándo se envió
  send_status VARCHAR(50),             -- 'pending', 'sent', 'failed', 'cancelled', 'skipped'
  recipient_email VARCHAR(255),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Estados de Envío

- **pending**: Esperando a ser enviado
- **sent**: Enviado exitosamente
- **failed**: Error al enviar (se reintenta)
- **cancelled**: Cita fue cancelada, no enviar
- **skipped**: Cita ya completada/cancelada al momento de enviar

## 🔄 Flujo de Trabajo

### 1. Crear Cita

```javascript
// Backend: appointmentController.createAppointment()
1. Paciente crea cita
2. Se guarda en DB (appointments)
3. Automáticamente se crea recordatorio en DB (reminders)
   - scheduled_send_time = fecha_cita - 24 horas
   - send_status = 'pending'
```

### 2. Enviar Recordatorio

```javascript
// Backend: reminderScheduler (cada 5 minutos)
1. Busca reminders con send_status='pending'
2. Filtra los que ya pasaron su scheduled_send_time
3. Verifica que la cita siga activa
4. Envía email
5. Actualiza send_status='sent' y sent_at
```

### 3. Cancelar Cita

```javascript
// Backend: appointmentController.updateAppointmentStatus()
1. Doctor cambia status_id a 5 (cancelled)
2. Se obtienen datos de paciente y cita
3. Se envía email de cancelación INMEDIATAMENTE
4. Se cancelan recordatorios pendientes (send_status='cancelled')
```

### 4. Reprogramar Cita

```javascript
// Backend: appointmentController.updateAppointmentByDoctor()
1. Doctor cambia scheduled_start/scheduled_end
2. Se detecta cambio de fecha
3. Se envía email de reprogramación INMEDIATAMENTE
4. Se cancela recordatorio antiguo
5. Se crea nuevo recordatorio para nueva fecha
```

## 🧪 Pruebas

### 1. Probar en Modo Simulación

Crea una cita y verifica en la consola del servidor:

```
✅ Recordatorio creado para cita abc-123
📧 [SIMULACIÓN] Email: 🔔 Recordatorio: Cita Médica Mañana → paciente@clinica.com
```

### 2. Probar Recordatorio Inmediato

Para probar sin esperar 24 horas, edita manualmente el recordatorio en Supabase:

```sql
-- Cambiar scheduled_send_time a "ahora"
UPDATE reminders 
SET scheduled_send_time = NOW() - INTERVAL '1 minute'
WHERE appointment_id = 'tu-appointment-id';
```

Espera 5 minutos y verás el email enviado.

### 3. Probar Cancelación

1. Como doctor, cancela una cita desde el dashboard
2. Verifica en consola:
```
📧 [SIMULACIÓN] Email: ❌ Cita Cancelada → paciente@clinica.com
```

## 📝 Personalización

### Cambiar Remitente

Edita `emailService.js`:

```javascript
from: `"Clínica San Miguel" <${process.env.SMTP_USER}>`,
```

### Cambiar Horario del Recordatorio

Actualmente está a 24 horas. Para cambiarlo a 48 horas:

```javascript
// appointmentController.js - createAppointmentReminder()
const reminderTime = new Date(appointmentDateTime.getTime() - (48 * 60 * 60 * 1000));
```

### Cambiar Frecuencia del Scheduler

Actualmente revisa cada 5 minutos. Para cambiar a cada 10 minutos:

```javascript
// reminderScheduler.js
this.task = cron.schedule('*/10 * * * *', async () => {
```

## 🚀 Despliegue en Producción

### Variables de Entorno en Render

Al desplegar en Render, configura:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=clinica@sanmiguel.com
SMTP_PASS=tu_contraseña_de_aplicacion
FRONTEND_URL=https://medical-appointment-web-system.vercel.app
```

### Verificar en Producción

```bash
# Ver logs del servidor
render logs --tail

# Buscar estos mensajes:
# ✅ Servidor SMTP listo
# ✅ Scheduler de recordatorios iniciado
```

## 🐛 Troubleshooting

### Emails no se envían

1. Verifica que SMTP_USER y SMTP_PASS están configurados
2. Revisa logs: `❌ Error SMTP: ...`
3. Si usas Gmail, verifica contraseña de aplicación
4. Prueba conexión SMTP manualmente

### Recordatorios no se procesan

1. Verifica que el scheduler se inició: `✅ Scheduler de recordatorios iniciado`
2. Revisa la tabla reminders en Supabase
3. Verifica que hay recordatorios con `send_status='pending'`
4. Revisa logs: `🔍 Revisando recordatorios pendientes...`

### Emails en spam

1. Configura SPF y DKIM en tu dominio
2. Usa un servicio profesional como SendGrid
3. Evita palabras spam en asuntos
4. Incluye enlace para darse de baja

## 📚 Referencias

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Cron Syntax](https://www.npmjs.com/package/node-cron)

## ✅ Checklist de Implementación

- [x] Servicio de email con plantillas HTML
- [x] Recordatorio automático 24h antes
- [x] Notificación de cancelación
- [x] Notificación de reprogramación
- [x] Scheduler cada 5 minutos
- [x] Integración con appointmentController
- [x] Modo simulación para desarrollo
- [x] Logging detallado
- [ ] Configurar SMTP en producción
- [ ] Pruebas en producción
- [ ] Monitoreo de emails enviados
