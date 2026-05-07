# Documentación de API - Autenticación y Sesiones

## Arquitectura

El sistema de autenticación sigue una arquitectura en capas:

```
Routes (sessions.js, passwordResets.js)
    ↓
Controllers (manejo de request/response)
    ↓
Services (authService.js - lógica de negocio)
    ↓
Repositories (authRepository.js - acceso a datos)
    ↓
Database (Supabase PostgreSQL)
```

## Endpoints de Sesiones

### POST /api/sessions - Login
Autentica un usuario y retorna tokens JWT.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response exitoso (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "role": "patient",
    "first_name": "Juan",
    "last_name": "Pérez",
    "phone_number": "0987654321",
    "cedula": "1234567890"
  }
}
```

**Errores:**
- 400: Email o contraseña faltantes
- 401: Credenciales inválidas
- 500: Error del servidor

---

### DELETE /api/sessions - Logout
Cierra la sesión del usuario (invalida el token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

**Nota:** Por ahora, el logout se maneja del lado del cliente eliminando el token. En producción, se recomienda implementar una blacklist de tokens usando Redis.

---

### POST /api/sessions/refresh - Refresh Token
Renueva el access token usando un refresh token válido.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response exitoso (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- 400: Refresh token faltante
- 401: Token expirado o inválido (códigos: REFRESH_TOKEN_EXPIRED, INVALID_REFRESH_TOKEN)
- 404: Usuario no encontrado
- 500: Error del servidor

---

## Endpoints de Recuperación de Contraseña

### POST /api/password-resets - Solicitar Reset
Envía un email con un token para resetear la contraseña.

**Request:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Si el correo existe, recibirás instrucciones para resetear tu contraseña"
}
```

**Nota:** Por seguridad, siempre retorna éxito incluso si el email no existe.

---

### PATCH /api/password-resets/:token - Confirmar Reset
Actualiza la contraseña usando el token enviado por email.

**URL:** `/api/password-resets/a1b2c3d4e5f6...`

**Request:**
```json
{
  "password": "nuevaContraseña123",
  "confirmPassword": "nuevaContraseña123"
}
```

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Errores:**
- 400: Campos faltantes, contraseñas no coinciden, contraseña muy corta, o token inválido/expirado
- 500: Error del servidor

---

## OAuth con Google

### GET /api/auth/google
Redirige al usuario a Google para autenticación.

### GET /api/auth/google/callback
Callback de Google OAuth. Genera JWT y redirige al frontend con el token.

**Query params en la redirección:**
- `oauth`: Token JWT codificado en base64

**Configuración:**
- OAuth sin sesiones (stateless)
- Token JWT generado directamente
- No se usa `express-session`

---

## Servicios Auxiliares

### emailService.js
Maneja el envío de correos electrónicos:
- `sendPasswordResetEmail()`: Email con link de reset
- `sendPasswordChangedConfirmation()`: Confirmación de cambio
- `sendWelcomeEmail()`: Email de bienvenida

**Nota:** Actualmente en modo mock (imprime en consola). Para producción, configurar SendGrid, AWS SES, o Nodemailer.

### authRepository.js
Capa de acceso a datos:
- Operaciones CRUD de usuarios
- Verificación de credenciales
- Gestión de tokens de reset
- Hash y verificación de contraseñas

### authService.js
Lógica de negocio:
- `login()`: Autenticación de usuarios
- `register()`: Registro de nuevos usuarios
- `refreshToken()`: Renovación de tokens
- `requestPasswordReset()`: Solicitud de reset
- `resetPassword()`: Confirmación de reset

---

## Variables de Entorno Requeridas

```env
JWT_SECRET=tu_secret_key_aqui
JWT_REFRESH_SECRET=tu_refresh_secret_key_aqui (opcional, usa JWT_SECRET si no está)
FRONTEND_URL=http://127.0.0.1:5500/MedicalAppointment
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

---

## Migración de Base de Datos

Ejecutar el script SQL en Supabase:
```sql
-- Ver: backend/migrations/create_password_resets_table.sql
```

Crea la tabla `password_resets` con:
- Token hasheado (SHA-256)
- Fecha de expiración
- Flag de uso
- Relación con usuarios

---

## Cambios desde el Sistema Anterior

### ✅ Eliminado:
- `express-session` - OAuth ahora es stateless
- `passport.serializeUser` / `deserializeUser` - No se usa sesión
- `/api/auth/login` - Movido a `/api/sessions`

### ✅ Agregado:
- `/api/sessions` - Gestión de sesiones con JWT
- `/api/password-resets` - Recuperación de contraseña
- Arquitectura Repository/Service para auth
- Refresh tokens para renovación sin re-login
- Email service para notificaciones

### ✅ Mejorado:
- OAuth con Google genera JWT directamente (stateless)
- Separación de responsabilidades (Repository, Service, Controller)
- Manejo de errores estandarizado
- Documentación clara de endpoints
