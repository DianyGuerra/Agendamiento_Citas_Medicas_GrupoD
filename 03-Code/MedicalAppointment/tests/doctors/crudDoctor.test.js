const {
  createQueryMock,
  invokeHandler,
  loadDoctorRepository,
  loadDoctorRoutes,
  loadDoctorController,
  createDoctorBody,
  createDoctorCreateBody,
  createDoctorUpdateBody,
  createExistingUser,
  createSpecialty,
  createDoctorRecord,
  createDoctorWithRelations,
  createRoleQueryMock,
  createReq,
  expectNextError
} = require('./helpers');

const createSuccessfulQuery = (data) => createQueryMock({ data, error: null });
const createDatabaseErrorQuery = (message, code = '500') => createQueryMock({
  data: null,
  error: { code, message }
});

const getRoutePaths = (router) => router.stack
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);

const loadFreshController = () => {
  jest.resetModules();
  jest.clearAllMocks();
  return loadDoctorController();
};

describe('Doctor module unit tests - CRUD layer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  // ========================================================================
  // REPOSITORY: valida consultas, transformaciones y manejo de errores de datos.
  // ========================================================================
  describe('CRUD layer - doctor.repository', () => {
    test('reads doctor profiles by user id and doctor id', async () => {
      // Verifica las consultas puntuales del repositorio y el caso sin filas de Supabase.
      const { repo, fromMock } = loadDoctorRepository();
      const profileQuery = createSuccessfulQuery(createDoctorWithRelations());
      const missingDetailsQuery = createDatabaseErrorQuery('No rows returned', 'PGRST116');

      fromMock
        .mockReturnValueOnce(profileQuery)
        .mockReturnValueOnce(missingDetailsQuery);

      const profile = await repo.findByUserId('user-1');
      const missingDoctor = await repo.findWithDetails('missing-doc');

      expect(fromMock).toHaveBeenCalledWith('doctors');
      expect(profileQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(profile).toEqual(expect.objectContaining({
        id: 'doc-1',
        user_id: 'user-1',
        users: expect.objectContaining({ first_name: 'Ana' }),
        specialties: expect.objectContaining({ name: 'Cardiologia' })
      }));
      expect(missingDetailsQuery.eq).toHaveBeenCalledWith('id', 'missing-doc');
      expect(missingDoctor).toBeNull();
    });

    test('lists doctors by specialty and all doctors with formatting, filters, and sorting', async () => {
      // Cubre los listados principales: filtros activos, paginacion, orden por apellido y busqueda.
      const { repo, fromMock } = loadDoctorRepository();
      const bySpecialtyQuery = createSuccessfulQuery([
        createDoctorWithRelations({
          id: 'doc-2',
          professional_id: 'MED-002',
          users: createExistingUser({
            id: 'user-2',
            first_name: 'Luis',
            last_name: 'Zambrano',
            email: 'luis@example.com',
            is_active: true
          }),
          specialties: createSpecialty({ name: 'Pediatria', consultation_fee: 80 })
        }),
        createDoctorWithRelations({
          users: createExistingUser({ is_active: true }),
          specialties: createSpecialty({ name: 'Pediatria', consultation_fee: 80 })
        })
      ]);
      const allDoctorsQuery = createSuccessfulQuery([
        createDoctorWithRelations({
          users: createExistingUser({ is_active: true }),
          specialties: createSpecialty()
        }),
        createDoctorWithRelations({
          id: 'doc-3',
          user_id: 'user-3',
          professional_id: 'MED-003',
          specialty_id: 'sp-3',
          users: createExistingUser({
            id: 'user-3',
            first_name: 'Carlos',
            last_name: 'Paz',
            email: 'carlos@example.com',
            is_active: true
          }),
          specialties: createSpecialty({ id: 'sp-3', name: 'Dermatologia' })
        })
      ]);

      fromMock
        .mockReturnValueOnce(bySpecialtyQuery)
        .mockReturnValueOnce(allDoctorsQuery);

      const specialtyDoctors = await repo.findBySpecialty('sp-1', { limit: 10, offset: 0 });
      const searchedDoctors = await repo.findAllWithDetails({
        limit: 10,
        offset: 0,
        activeOnly: true,
        search: 'ana'
      });

      expect(bySpecialtyQuery.eq).toHaveBeenCalledWith('specialty_id', 'sp-1');
      expect(bySpecialtyQuery.eq).toHaveBeenCalledWith('active', true);
      expect(bySpecialtyQuery.eq).toHaveBeenCalledWith('users.is_active', true);
      expect(specialtyDoctors.map((doctor) => doctor.last_name)).toEqual(['Mora', 'Zambrano']);
      expect(allDoctorsQuery.eq).toHaveBeenCalledWith('active', true);
      expect(allDoctorsQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(searchedDoctors).toEqual([
        expect.objectContaining({
          id: 'doc-1',
          first_name: 'Ana',
          specialty_name: 'Cardiologia',
          status: 'active'
        })
      ]);
    });

    test('handles inactive doctors, missing nested data, active status updates, and soft delete metadata', async () => {
      // Revisa ramas de doctores inactivos, relaciones nulas y operaciones basadas en el campo active.
      const { repo, fromMock, updateMock } = loadDoctorRepository();
      const inactiveSpecialtyQuery = createSuccessfulQuery([
        createDoctorWithRelations({
          active: false,
          users: createExistingUser({ is_active: false }),
          specialties: createSpecialty()
        })
      ]);
      const missingNestedQuery = createSuccessfulQuery([
        createDoctorWithRelations({
          id: 'doc-2',
          users: null,
          specialties: null
        }),
        createDoctorWithRelations({
          users: createExistingUser({ is_active: true }),
          specialties: createSpecialty({ name: 'Medicina General' })
        })
      ]);
      const inactiveAllQuery = createSuccessfulQuery([
        createDoctorWithRelations({
          active: false,
          users: createExistingUser({ is_active: false }),
          specialties: createSpecialty()
        }),
        createDoctorWithRelations({
          id: 'doc-3',
          active: true,
          users: createExistingUser({
            id: 'user-3',
            first_name: 'Luis',
            last_name: 'Paz',
            email: 'luis@example.com',
            is_active: true
          }),
          specialties: createSpecialty({ name: 'Pediatria' })
        })
      ]);

      fromMock
        .mockReturnValueOnce(inactiveSpecialtyQuery)
        .mockReturnValueOnce(missingNestedQuery)
        .mockReturnValueOnce(inactiveAllQuery);

      const inactiveSpecialtyDoctors = await repo.findBySpecialty('sp-1', { activeOnly: false });
      const doctorsWithMissingData = await repo.findBySpecialty('sp-1', { activeOnly: false });
      const allDoctors = await repo.findAllWithDetails({ activeOnly: false });
      const formatted = repo.formatDoctorResponse(createDoctorRecord({
        users: null,
        specialties: null,
        active: false
      }));
      const activated = await repo.updateActiveStatus('doc-1', true);
      const deleted = await repo.softDelete('doc-1');

      expect(inactiveSpecialtyQuery.eq).not.toHaveBeenCalledWith('active', true);
      expect(inactiveSpecialtyQuery.eq).not.toHaveBeenCalledWith('users.is_active', true);
      expect(inactiveSpecialtyDoctors[0]).toEqual(expect.objectContaining({
        active: false,
        status: 'inactive',
        is_active: false
      }));
      expect(doctorsWithMissingData[0]).toEqual(expect.objectContaining({
        id: 'doc-2',
        first_name: undefined,
        specialty_name: undefined,
        status: 'active'
      }));
      expect(allDoctors.map((doctor) => doctor.status)).toEqual(['inactive', 'active']);
      expect(formatted).toEqual(expect.objectContaining({
        first_name: undefined,
        specialty_name: undefined,
        specialty: null,
        status: 'inactive'
      }));
      expect(updateMock).toHaveBeenCalledWith('doc-1', { active: true });
      expect(updateMock).toHaveBeenCalledWith('doc-1', { active: false });
      expect(activated).toEqual({ id: 'doc-1', active: true });
      expect(deleted).toBe(true);
      expect(repo.hasSoftDelete()).toBe(false);
    });

    test('throws database errors for failed repository reads', async () => {
      // Asegura que los errores inesperados de Supabase se propaguen con mensajes claros.
      const { repo, fromMock } = loadDoctorRepository();

      fromMock
        .mockReturnValueOnce(createDatabaseErrorQuery('Database failed'))
        .mockReturnValueOnce(createDatabaseErrorQuery('Details failed'))
        .mockReturnValueOnce(createDatabaseErrorQuery('Specialty query failed'))
        .mockReturnValueOnce(createDatabaseErrorQuery('Find all failed'));

      await expect(repo.findByUserId('user-1')).rejects.toThrow('Database error: Database failed');
      await expect(repo.findWithDetails('doc-1')).rejects.toThrow('Database error: Details failed');
      await expect(repo.findBySpecialty('sp-1')).rejects.toThrow('Database error: Specialty query failed');
      await expect(repo.findAllWithDetails()).rejects.toThrow('Database error: Find all failed');
    });
  });

  // ========================================================================
  // ROUTES: valida que Express exponga endpoints y protecciones por rol.
  // ========================================================================
  describe('CRUD layer - doctor.routes', () => {
    test('registers public, doctor, and admin doctor routes', () => {
      // Confirma la superficie HTTP principal y los guards usados por rutas protegidas.
      const { router, requireRole } = loadDoctorRoutes();

      expect(requireRole).toHaveBeenCalledWith('doctor');
      expect(requireRole).toHaveBeenCalledWith('admin');
      expect(getRoutePaths(router)).toEqual(expect.arrayContaining([
        'get /',
        'get /specialty/:specialtyId',
        'get /me',
        'put /me',
        'get /my-patients',
        'post /',
        'post /with-user',
        'get /:id',
        'put /:id',
        'post /:id/reset-password',
        'delete /:id'
      ]));
    });
  });

  // ========================================================================
  // CONTROLLER: valida entradas HTTP, delegacion a repositorios y respuestas.
  // ========================================================================
  describe('CRUD layer - doctor.controller', () => {
    test('handles doctor listing and read endpoints', async () => {
      // Cubre listados generales, listados por especialidad, detalle, perfil y casos no encontrados.
      let context = loadFreshController();
      context.doctorRepository.findAllWithDetails.mockResolvedValue([
        createDoctorRecord(),
        createDoctorRecord({ id: 'doc-2' })
      ]);
      await invokeHandler(context.controller.getAll, createReq({
        query: { page: '1', limit: '10', search: 'ana' }
      }));
      expect(context.doctorRepository.findAllWithDetails).toHaveBeenCalledWith(expect.objectContaining({
        limit: 10,
        offset: 0,
        search: 'ana',
        activeOnly: true
      }));
      expect(context.responseBuilderMock.paginated).toHaveBeenCalled();

      context = loadFreshController();
      context.doctorRepository.findBySpecialty.mockResolvedValue([createDoctorRecord()]);
      await invokeHandler(context.controller.getAll, createReq({
        query: { page: '2', limit: '5', specialty_id: 'sp-1', active: 'false' }
      }));
      expect(context.doctorRepository.findBySpecialty).toHaveBeenCalledWith('sp-1', {
        limit: 5,
        offset: 5,
        activeOnly: false
      });

      context = loadFreshController();
      const doctor = createDoctorRecord();
      context.doctorRepository.findWithDetails.mockResolvedValue(doctor);
      await invokeHandler(context.controller.getById, createReq({ params: { id: 'doc-1' } }));
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), doctor);

      context = loadFreshController();
      context.doctorRepository.findWithDetails.mockResolvedValue(null);
      const missingById = await invokeHandler(
        context.controller.getById,
        createReq({ params: { id: 'missing-doc' } })
      );
      expectNextError(missingById, 'Doctor');

      context = loadFreshController();
      context.doctorRepository.findByUserId.mockResolvedValue(doctor);
      await invokeHandler(context.controller.getProfile, createReq({ user: { id: 'user-1' } }));
      expect(context.doctorRepository.findByUserId).toHaveBeenCalledWith('user-1');

      context = loadFreshController();
      context.doctorRepository.findBySpecialty.mockResolvedValue([doctor]);
      await invokeHandler(
        context.controller.getBySpecialty,
        createReq({ params: { specialtyId: 'sp-1' } })
      );
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), [doctor]);
    });

    test('creates doctors for existing users and validates direct create failures', async () => {
      // Cubre POST /doctors: validaciones, usuario inexistente, duplicado y creacion exitosa.
      let context = loadFreshController();
      const missingRequired = await invokeHandler(context.controller.create, createReq({
        body: { professional_id: 'MED-001' }
      }));
      expectNextError(missingRequired, 'user_id y specialty_id');

      context = loadFreshController();
      context.userRepository.findById.mockResolvedValue(null);
      const missingUser = await invokeHandler(context.controller.create, createReq({
        body: createDoctorCreateBody({ user_id: 'missing-user' })
      }));
      expect(context.userRepository.findById).toHaveBeenCalledWith('missing-user');
      expectNextError(missingUser, 'Usuario');

      context = loadFreshController();
      context.userRepository.findById.mockResolvedValue(createExistingUser());
      context.doctorRepository.findByUserId.mockResolvedValue(createDoctorRecord({ id: 'doc-existing' }));
      const duplicatedDoctor = await invokeHandler(context.controller.create, createReq({
        body: createDoctorCreateBody()
      }));
      expectNextError(duplicatedDoctor, 'Ya existe');

      context = loadFreshController();
      const body = createDoctorCreateBody();
      context.userRepository.findById.mockResolvedValue(createExistingUser());
      context.doctorRepository.findByUserId.mockResolvedValue(null);
      context.doctorRepository.create.mockResolvedValue(createDoctorRecord(body));
      await invokeHandler(context.controller.create, createReq({ body }));
      expect(context.doctorRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...body,
        active: true
      }));
      expect(context.createAuditLog).toHaveBeenCalled();
      expect(context.responseBuilderMock.created).toHaveBeenCalled();
    });

    test('validates createWithUser error branches before creating or promoting users', async () => {
      // Cubre errores tempranos: campos faltantes, cedula invalida, rol ausente y datos en conflicto.
      let context = loadFreshController();
      const missingRequired = await invokeHandler(context.controller.createWithUser, createReq({
        body: { cedula: '1723456789' }
      }));
      expectNextError(missingRequired, 'requeridos');

      context = loadFreshController();
      const invalidCedula = await invokeHandler(context.controller.createWithUser, createReq({
        body: createDoctorBody({ cedula: '123' })
      }));
      expectNextError(invalidCedula, '10');

      context = loadFreshController();
      context.fromMock.mockReturnValueOnce(createSuccessfulQuery(null));
      const missingRole = await invokeHandler(context.controller.createWithUser, createReq({
        body: createDoctorBody()
      }));
      expect(context.fromMock).toHaveBeenCalledWith('roles');
      expectNextError(missingRole, 'Rol de doctor');

      context = loadFreshController();
      context.fromMock.mockReturnValueOnce(createRoleQueryMock());
      context.userRepository.findByEmail.mockResolvedValue(createExistingUser({ id: 'user-email' }));
      context.userRepository.findByCedula.mockResolvedValue(createExistingUser({ id: 'user-cedula' }));
      const conflictingUserData = await invokeHandler(context.controller.createWithUser, createReq({
        body: createDoctorBody()
      }));
      expectNextError(conflictingUserData, 'Conflicto de datos');
    });

    test('handles createWithUser for new users and existing-user promotion flows', async () => {
      // Cubre creacion con cuenta nueva, respuesta de promocion requerida y promocion efectiva.
      let context = loadFreshController();
      const newUserBody = createDoctorBody({ email: 'doctor@example.com' });
      context.fromMock
        .mockReturnValueOnce(createRoleQueryMock())
        .mockReturnValueOnce(createSuccessfulQuery(createExistingUser({
          id: 'user-new',
          email: 'doctor@example.com',
          roles: undefined
        })));
      context.userRepository.findByEmail.mockResolvedValue(null);
      context.userRepository.findByCedula.mockResolvedValue(null);
      context.doctorRepository.create.mockResolvedValue(createDoctorRecord({
        id: 'doc-new',
        user_id: 'user-new'
      }));
      await invokeHandler(context.controller.createWithUser, createReq({ body: newUserBody }));
      expect(context.doctorRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-new',
        specialty_id: 'sp-1',
        professional_id: 'MED-001',
        active: true
      }));
      expect(context.responseBuilderMock.created).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ temporary_password: '1723456789MOR!' }),
        'Doctor creado exitosamente con cuenta de usuario'
      );

      context = loadFreshController();
      const existingUser = createExistingUser({ roles: { name: 'patient' } });
      context.fromMock.mockReturnValueOnce(createRoleQueryMock());
      context.userRepository.findByEmail.mockResolvedValue(existingUser);
      context.userRepository.findByCedula.mockResolvedValue(existingUser);
      context.doctorRepository.findByUserId.mockResolvedValue(null);
      await invokeHandler(context.controller.createWithUser, createReq({ body: createDoctorBody() }));
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ requires_promotion: true }),
        200,
        'Usuario existente encontrado'
      );

      context = loadFreshController();
      const updateUserQuery = createSuccessfulQuery(null);
      context.fromMock
        .mockReturnValueOnce(createRoleQueryMock())
        .mockReturnValueOnce(updateUserQuery);
      context.userRepository.findByEmail.mockResolvedValue(createExistingUser());
      context.userRepository.findByCedula.mockResolvedValue(createExistingUser());
      context.doctorRepository.findByUserId.mockResolvedValue(null);
      context.doctorRepository.create.mockResolvedValue(createDoctorRecord());
      await invokeHandler(context.controller.createWithUser, createReq({
        body: createDoctorBody({ promote_existing: true })
      }));
      expect(updateUserQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        role_id: 'role-doctor',
        is_active: true
      }));
      expect(context.doctorRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-1',
        specialty_id: 'sp-1',
        professional_id: 'MED-001'
      }));
      expect(context.responseBuilderMock.created).toHaveBeenCalled();
    });

    test('updates, deletes, and reactivates doctors with success and not-found branches', async () => {
      // Cubre PUT, DELETE y activacion: camino feliz y validacion de doctor inexistente.
      let context = loadFreshController();
      const updateBody = createDoctorUpdateBody();
      context.doctorRepository.findById.mockResolvedValue(createDoctorRecord({
        specialty_id: 'old-sp',
        professional_id: 'OLD'
      }));
      context.doctorRepository.update.mockResolvedValue(createDoctorRecord(updateBody));
      await invokeHandler(context.controller.update, createReq({
        params: { id: 'doc-1' },
        body: updateBody
      }));
      expect(context.doctorRepository.update).toHaveBeenCalledWith('doc-1', updateBody);
      expect(context.responseBuilderMock.success).toHaveBeenCalled();

      context = loadFreshController();
      context.doctorRepository.findById.mockResolvedValue(null);
      const missingUpdate = await invokeHandler(context.controller.update, createReq({
        params: { id: 'missing-doc' },
        body: updateBody
      }));
      expectNextError(missingUpdate, 'Doctor');

      context = loadFreshController();
      context.doctorRepository.findById.mockResolvedValue(createDoctorRecord());
      context.doctorRepository.softDelete.mockResolvedValue(true);
      await invokeHandler(context.controller.delete, createReq({ params: { id: 'doc-1' } }));
      expect(context.doctorRepository.softDelete).toHaveBeenCalledWith('doc-1');
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'doc-1' },
        200,
        'Doctor desactivado exitosamente'
      );

      context = loadFreshController();
      context.doctorRepository.findById.mockResolvedValue(null);
      const missingDelete = await invokeHandler(
        context.controller.delete,
        createReq({ params: { id: 'missing-doc' } })
      );
      expectNextError(missingDelete, 'Doctor');

      context = loadFreshController();
      const activated = createDoctorRecord({ active: true });
      context.doctorRepository.findById.mockResolvedValue(createDoctorRecord());
      context.doctorRepository.updateActiveStatus.mockResolvedValue(activated);
      await invokeHandler(context.controller.activate, createReq({ params: { id: 'doc-1' } }));
      expect(context.doctorRepository.updateActiveStatus).toHaveBeenCalledWith('doc-1', true);
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        activated,
        200,
        'Doctor activado exitosamente'
      );
    });

    test('resets doctor passwords and reports missing doctor, missing user, or update failures', async () => {
      // Cubre reset de password: generacion exitosa y las tres rutas de error principales.
      let context = loadFreshController();
      const updateQuery = createSuccessfulQuery(null);
      context.doctorRepository.findWithDetails.mockResolvedValue(createDoctorRecord());
      context.userRepository.findById.mockResolvedValue(createExistingUser());
      context.fromMock.mockReturnValueOnce(updateQuery);
      await invokeHandler(context.controller.resetPassword, createReq({ params: { id: 'doc-1' } }));
      expect(updateQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        password_hash: 'hashed-password',
        updated_at: expect.any(String)
      }));
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          doctor_id: 'doc-1',
          email: 'ana@example.com',
          temporary_password: '1723456789MOR!1234'
        }),
        200,
        expect.stringContaining('restablecida exitosamente')
      );

      context = loadFreshController();
      context.doctorRepository.findWithDetails.mockResolvedValue(null);
      const missingDoctor = await invokeHandler(
        context.controller.resetPassword,
        createReq({ params: { id: 'missing-doc' } })
      );
      expectNextError(missingDoctor, 'Doctor');

      context = loadFreshController();
      context.doctorRepository.findWithDetails.mockResolvedValue(createDoctorRecord({
        user_id: 'missing-user'
      }));
      context.userRepository.findById.mockResolvedValue(null);
      const missingUser = await invokeHandler(
        context.controller.resetPassword,
        createReq({ params: { id: 'doc-1' } })
      );
      expect(context.userRepository.findById).toHaveBeenCalledWith('missing-user');
      expectNextError(missingUser, 'Usuario');

      context = loadFreshController();
      context.doctorRepository.findWithDetails.mockResolvedValue(createDoctorRecord());
      context.userRepository.findById.mockResolvedValue(createExistingUser());
      context.fromMock.mockReturnValueOnce(createQueryMock({
        data: null,
        error: { message: 'update failed' }
      }));
      const failedUpdate = await invokeHandler(
        context.controller.resetPassword,
        createReq({ params: { id: 'doc-1' } })
      );
      expectNextError(failedUpdate, 'Error al restablecer');
    });

    test('updates own profile and returns doctor schedules or patients for doctor-scoped endpoints', async () => {
      // Cubre endpoints del doctor autenticado: perfil, horarios, pacientes y errores si no es doctor.
      let context = loadFreshController();
      context.doctorRepository.findByUserId.mockResolvedValue(createDoctorRecord());
      context.doctorRepository.update.mockResolvedValue(createDoctorRecord({ bio: 'Nueva bio' }));
      await invokeHandler(context.controller.updateProfile, createReq({
        user: { id: 'user-1' },
        body: {
          first_name: 'Ana',
          last_name: 'Mora',
          phone_number: '0999999999',
          bio: 'Nueva bio'
        }
      }));
      expect(context.userRepository.update).toHaveBeenCalledWith('user-1', {
        first_name: 'Ana',
        last_name: 'Mora',
        phone_number: '0999999999'
      });
      expect(context.doctorRepository.update).toHaveBeenCalledWith('doc-1', { bio: 'Nueva bio' });

      context = loadFreshController();
      context.doctorRepository.findByUserId.mockResolvedValue(null);
      const profileNotDoctor = await invokeHandler(context.controller.updateProfile, createReq({
        user: { id: 'user-1' },
        body: { bio: 'Nueva bio' }
      }));
      expectNextError(profileNotDoctor, 'Doctor');

      context = loadFreshController();
      const schedules = [{ id: 'sch-1', doctor_id: 'doc-1' }];
      context.scheduleRepository.findByDoctor.mockResolvedValue(schedules);
      await invokeHandler(context.controller.getSchedules, createReq({ params: { id: 'doc-1' } }));
      expect(context.scheduleRepository.findByDoctor).toHaveBeenCalledWith('doc-1');
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), schedules);

      context = loadFreshController();
      context.doctorRepository.findByUserId.mockResolvedValue(createDoctorRecord());
      context.scheduleRepository.findByDoctor.mockResolvedValue(schedules);
      await invokeHandler(context.controller.getMySchedules, createReq({ user: { id: 'user-1' } }));
      expect(context.scheduleRepository.findByDoctor).toHaveBeenCalledWith('doc-1');

      context = loadFreshController();
      context.doctorRepository.findByUserId.mockResolvedValue(null);
      const schedulesNotDoctor = await invokeHandler(
        context.controller.getMySchedules,
        createReq({ user: { id: 'user-1' } })
      );
      expectNextError(schedulesNotDoctor, 'Doctor');

      context = loadFreshController();
      const patients = [{ id: 'patient-1' }];
      context.doctorRepository.findByUserId.mockResolvedValue(createDoctorRecord());
      context.appointmentRepository.findUniquePatientsByDoctor.mockResolvedValue(patients);
      await invokeHandler(context.controller.getMyPatients, createReq({ user: { id: 'user-1' } }));
      expect(context.appointmentRepository.findUniquePatientsByDoctor).toHaveBeenCalledWith('doc-1');
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), patients);

      context = loadFreshController();
      context.doctorRepository.findByUserId.mockResolvedValue(null);
      const patientsNotDoctor = await invokeHandler(
        context.controller.getMyPatients,
        createReq({ user: { id: 'user-1' } })
      );
      expectNextError(patientsNotDoctor, 'Doctor');
    });
  });
});
