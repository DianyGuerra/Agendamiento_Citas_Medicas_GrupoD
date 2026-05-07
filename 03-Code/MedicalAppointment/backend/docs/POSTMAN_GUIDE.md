# Guía para probar endpoints en Postman

## Configuración inicial

1. **Abre Postman** y crea una nueva Collection llamada "Medical Appointment API"
2. **URL base**: `http://localhost:3000/api`
3. **Asegúrate** de que el servidor esté corriendo (`npm start` en `/backend`)

---

## 1. Login (POST /api/sessions)

### Request
- **Method**: POST
- **URL**: `http://localhost:3000/api/sessions`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "admin@clinica.com",
  "password": "admin123"
}
```

### Response esperado (200)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@clinica.com",
    "role": "admin",
    "first_name": "Admin",
    "last_name": "Sistema",
    "phone_number": null,
    "cedula": "1234567890"
  }
}
```

### ⚡ Acción importante
**Copia el `token`** de la respuesta - lo usarás en las siguientes requests.

En Postman, puedes guardar el token automáticamente:
1. Ve a la pestaña **Tests** del request
2. Agrega este código:
```javascript
pm.test("Login exitoso", function () {
    pm.response.to.have.status(200);
    var jsonData = pm.response.json();
    pm.environment.set("authToken", jsonData.token);
    pm.environment.set("refreshToken", jsonData.refreshToken);
});
```

---

## 2. Refresh Token (POST /api/sessions/refresh)

### Request
- **Method**: POST
- **URL**: `http://localhost:3000/api/sessions/refresh`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

💡 **Tip**: Si guardaste el token en variables de entorno, usa:
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

### Response esperado (200)
```json
{
  "success": true,
  "token": "nuevo_token_aqui...",
  "refreshToken": "nuevo_refresh_token_aqui..."
}
```

---

## 3. Logout (DELETE /api/sessions)

### Request
- **Method**: DELETE
- **URL**: `http://localhost:3000/api/sessions`
- **Headers**:
  - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

💡 **Tip**: Si usas variables de entorno:
  - `Authorization: Bearer {{authToken}}`

### Response esperado (200)
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

## 4. Solicitar Reset de Contraseña (POST /api/password-resets)

### Request
- **Method**: POST
- **URL**: `http://localhost:3000/api/password-resets`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "email": "admin@clinica.com"
}
```

### Response esperado (200)
```json
{
  "success": true,
  "message": "Si el correo existe, recibirás instrucciones para resetear tu contraseña"
}
```

### 📧 Ver el token
Ve a la **consola del servidor** (donde corre `npm start`). Verás algo como:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL DE RECUPERACIÓN DE CONTRASEÑA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para: admin@clinica.com
Asunto: Recuperación de contraseña - Medical Appointment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hola Admin,

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
http://127.0.0.1:5500/MedicalAppointment/panels/resetPassword.html?token=a1b2c3d4e5f6...

Este enlace expirará en 1 hora.
```

**Copia el token** de la URL (después de `?token=`)

---

## 5. Confirmar Reset de Contraseña (PATCH /api/password-resets/:token)

### Request
- **Method**: PATCH
- **URL**: `http://localhost:3000/api/password-resets/a1b2c3d4e5f6...`
  - Reemplaza `a1b2c3d4e5f6...` con el token que copiaste de la consola
- **Headers**:
  - `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "password": "nuevaContraseña123",
  "confirmPassword": "nuevaContraseña123"
}
```

### Response esperado (200)
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

### Errores comunes
- **400 - Las contraseñas no coinciden**: `password` y `confirmPassword` son diferentes
- **400 - Token inválido o expirado**: El token ya fue usado o pasó 1 hora
- **400 - Contraseña muy corta**: La contraseña debe tener al menos 6 caracteres

---

## 6. Probar Endpoint Protegido (ejemplo: GET /api/doctors/current)

### Request
- **Method**: GET
- **URL**: `http://localhost:3000/api/doctors/current`
- **Headers**:
  - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Usa el token que obtuviste del login

### Response esperado
Si el token es válido, obtendrás los datos del doctor.
Si el token es inválido, obtendrás un error 401.

---

## Variables de Entorno en Postman

Para no copiar/pegar tokens manualmente:

1. **Crear entorno**:
   - Click en el ícono del ojo (⚙️) → Add/Edit
   - Crea un nuevo entorno llamado "Local"
   - Agrega variables:
     - `baseUrl`: `http://localhost:3000/api`
     - `authToken`: (se llenará automáticamente)
     - `refreshToken`: (se llenará automáticamente)

2. **Usar en requests**:
   - URL: `{{baseUrl}}/sessions`
   - Header: `Authorization: Bearer {{authToken}}`
   - Body: `"refreshToken": "{{refreshToken}}"`

3. **Auto-guardar tokens** (en pestaña Tests del request de login):
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("authToken", jsonData.token);
    pm.environment.set("refreshToken", jsonData.refreshToken);
    pm.test("Token guardado", function () {
        pm.expect(jsonData.token).to.exist;
    });
}
```

---

## Colección Pre-configurada para Importar

Crea un archivo `Medical-Appointment-Auth.postman_collection.json` con este contenido:

```json
{
  "info": {
    "name": "Medical Appointment - Auth",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@clinica.com\",\n  \"password\": \"admin123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/sessions",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "sessions"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "    var jsonData = pm.response.json();",
              "    pm.environment.set('authToken', jsonData.token);",
              "    pm.environment.set('refreshToken', jsonData.refreshToken);",
              "}"
            ]
          }
        }
      ]
    },
    {
      "name": "2. Refresh Token",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"refreshToken\": \"{{refreshToken}}\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/sessions/refresh",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "sessions", "refresh"]
        }
      }
    },
    {
      "name": "3. Logout",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{authToken}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/sessions",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "sessions"]
        }
      }
    },
    {
      "name": "4. Solicitar Password Reset",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@clinica.com\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/password-resets",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "password-resets"]
        }
      }
    },
    {
      "name": "5. Confirmar Password Reset",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"password\": \"nuevaContraseña123\",\n  \"confirmPassword\": \"nuevaContraseña123\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/password-resets/TU_TOKEN_AQUI",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "password-resets", "TU_TOKEN_AQUI"]
        }
      }
    }
  ]
}
```

**Importar en Postman**:
1. File → Import
2. Selecciona el archivo JSON
3. La colección aparecerá lista para usar

---

## Checklist de Pruebas

- [ ] Login con credenciales correctas → Token recibido
- [ ] Login con credenciales incorrectas → Error 401
- [ ] Refresh token con token válido → Nuevo token recibido
- [ ] Refresh token con token inválido → Error 401
- [ ] Logout → Mensaje de éxito
- [ ] Solicitar reset → Email simulado en consola
- [ ] Confirmar reset con token válido → Contraseña actualizada
- [ ] Confirmar reset con contraseñas diferentes → Error 400
- [ ] Confirmar reset con token expirado → Error 400
- [ ] Usar endpoint protegido sin token → Error 401
- [ ] Usar endpoint protegido con token válido → Datos retornados

---

## Troubleshooting

### Error: "No es posible conectar con el servidor remoto"
- ✅ Verifica que el servidor esté corriendo: `npm start` en `/backend`
- ✅ Confirma que el servidor esté en `http://localhost:3000`

### Error: "Credenciales inválidas"
- ✅ Verifica el email: `admin@clinica.com`
- ✅ Verifica la contraseña: `admin123`
- ✅ Asegúrate de que el usuario exista en la base de datos

### Error: "Token inválido"
- ✅ Copia el token completo sin espacios
- ✅ Verifica que el formato sea: `Bearer TOKEN_AQUI`
- ✅ El token expira en 24 horas

### No veo el email de reset
- ✅ Mira la consola del servidor (donde corre `npm start`)
- ✅ El email se imprime en la terminal, no se envía realmente


Opción 2: Asignar contraseña mediante Password Reset


POST http://localhost:3000/api/password-resets{  "email": "usuario_google@gmail.com"}
Luego confirma el reset con el token que aparece en la consola del servidor:


PATCH http://localhost:3000/api/password-resets/TOKEN_DE_LA_CONSOLA{  "password": "nuevaContraseña123",  "confirmPassword": "nuevaContraseña123"}
Ahora ese usuario ya tiene contraseña y puede hacer login tradicional:


POST http://localhost:3000/api/sessions{  "email": "usuario_google@gmail.com",  "password": "nuevaContraseña123"}
Opción 3: Actualizar la BD directamente