-- Migration: Add permissions field to roles table
-- This allows assigning permissions to roles so that all users with that role inherit those permissions

-- Add permissions column to roles table
ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Add description for core roles
COMMENT ON COLUMN roles.permissions IS 'Array of permission strings assigned to this role (e.g., citas.ver, facturacion.registrar_pago)';

-- Update admin role with all permissions by default
UPDATE roles 
SET permissions = ARRAY[
  'citas.ver', 'citas.crear', 'citas.reprogramar', 'citas.cancelar', 'citas.reasignar', 'citas.checkin',
  'facturacion.ver', 'facturacion.registrar_pago', 'facturacion.anular', 'facturacion.exportar',
  'doctores.ver', 'doctores.crear', 'doctores.editar', 'doctores.desactivar',
  'pacientes.ver', 'pacientes.editar', 'pacientes.desactivar', 'pacientes.historial',
  'horarios.ver', 'horarios.editar', 'horarios.excepciones',
  'consultorios.ver', 'consultorios.crear', 'consultorios.editar', 'consultorios.desactivar',
  'especialidades.ver', 'especialidades.crear', 'especialidades.editar', 'especialidades.eliminar',
  'reportes.ver', 'reportes.exportar',
  'auditoria.ver', 'auditoria.exportar',
  'seguridad.usuarios', 'seguridad.roles', 'seguridad.permisos', 'seguridad.reset_password'
]
WHERE code = 'admin';

-- Update doctor role with default permissions
UPDATE roles 
SET permissions = ARRAY[
  'citas.ver', 'citas.crear', 'citas.reprogramar', 'citas.cancelar',
  'pacientes.ver', 'pacientes.historial',
  'horarios.ver',
  'consultorios.ver'
]
WHERE code = 'doctor';

-- Update patient role with default permissions
UPDATE roles 
SET permissions = ARRAY[
  'citas.ver', 'citas.crear', 'citas.cancelar'
]
WHERE code = 'patient';
