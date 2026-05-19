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

describe('Doctor module unit tests - CRUD layer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('CRUD layer - doctor.repository', () => {
    test('findByUserId returns doctor profile with user and specialty data', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createSuccessfulQuery(createDoctorWithRelations());

      fromMock.mockReturnValueOnce(query);

      const doctor = await repo.findByUserId('user-1');

      expect(fromMock).toHaveBeenCalledWith('doctors');
      expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(doctor).toEqual(expect.objectContaining({
        id: 'doc-1',
        user_id: 'user-1',
        users: expect.objectContaining({ first_name: 'Ana' }),
        specialties: expect.objectContaining({ name: 'Cardiologia' })
      }));
    });

    test('findWithDetails returns null when doctor does not exist', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createDatabaseErrorQuery('No rows returned', 'PGRST116');

      fromMock.mockReturnValueOnce(query);

      const doctor = await repo.findWithDetails('missing-doc');

      expect(query.eq).toHaveBeenCalledWith('id', 'missing-doc');
      expect(doctor).toBeNull();
    });

    test('findBySpecialty filters active doctors and sorts by last name', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createSuccessfulQuery([
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

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findBySpecialty('sp-1', { limit: 10, offset: 0 });

      expect(query.eq).toHaveBeenCalledWith('specialty_id', 'sp-1');
      expect(query.eq).toHaveBeenCalledWith('active', true);
      expect(query.eq).toHaveBeenCalledWith('users.is_active', true);
      expect(doctors.map((doctor) => doctor.last_name)).toEqual(['Mora', 'Zambrano']);
    });

    test('findAllWithDetails applies search filter and formats doctors', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createSuccessfulQuery([
        createDoctorWithRelations({
          users: createExistingUser({ is_active: true }),
          specialties: createSpecialty()
        }),
        createDoctorWithRelations({
          id: 'doc-2',
          user_id: 'user-2',
          professional_id: 'MED-002',
          specialty_id: 'sp-2',
          users: createExistingUser({
            id: 'user-2',
            first_name: 'Carlos',
            last_name: 'Paz',
            email: 'carlos@example.com',
            is_active: true
          }),
          specialties: createSpecialty({
            id: 'sp-2',
            name: 'Dermatologia',
            consultation_fee: 90
          })
        })
      ]);

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findAllWithDetails({
        limit: 10,
        offset: 0,
        activeOnly: true,
        search: 'ana'
      });

      expect(query.eq).toHaveBeenCalledWith('active', true);
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(doctors).toHaveLength(1);
      expect(doctors[0]).toEqual(expect.objectContaining({
        id: 'doc-1',
        first_name: 'Ana',
        specialty_name: 'Cardiologia',
        status: 'active'
      }));
    });

    test('softDelete deactivates doctor using active field', async () => {
      const { repo, updateMock } = loadDoctorRepository();

      const result = await repo.softDelete('doc-1');

      expect(updateMock).toHaveBeenCalledWith('doc-1', { active: false });
      expect(result).toBe(true);
    });

    test('findByUserId throws database error when Supabase returns unexpected error', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      fromMock.mockReturnValueOnce(createDatabaseErrorQuery('Database failed'));

      await expect(repo.findByUserId('user-1')).rejects.toThrow('Database error: Database failed');
    });

    test('findWithDetails throws database error when Supabase returns unexpected error', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      fromMock.mockReturnValueOnce(createDatabaseErrorQuery('Details failed'));

      await expect(repo.findWithDetails('doc-1')).rejects.toThrow('Database error: Details failed');
    });

    test('findBySpecialty does not apply active filters when activeOnly is false', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createSuccessfulQuery([
        createDoctorWithRelations({
          active: false,
          users: createExistingUser({ is_active: false }),
          specialties: createSpecialty()
        })
      ]);

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findBySpecialty('sp-1', { activeOnly: false });

      expect(query.eq).toHaveBeenCalledWith('specialty_id', 'sp-1');
      expect(query.eq).not.toHaveBeenCalledWith('active', true);
      expect(query.eq).not.toHaveBeenCalledWith('users.is_active', true);
      expect(query.limit).not.toHaveBeenCalled();
      expect(query.range).not.toHaveBeenCalled();
      expect(doctors[0]).toEqual(expect.objectContaining({
        id: 'doc-1',
        active: false,
        status: 'inactive',
        is_active: false
      }));
    });

    test('findBySpecialty throws database error when query fails', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      fromMock.mockReturnValueOnce(createDatabaseErrorQuery('Specialty query failed'));

      await expect(repo.findBySpecialty('sp-1')).rejects.toThrow(
        'Database error: Specialty query failed'
      );
    });

    test('findBySpecialty sorts doctors even when last names are missing', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createSuccessfulQuery([
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

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findBySpecialty('sp-1', { activeOnly: false });

      expect(doctors).toHaveLength(2);
      expect(doctors[0]).toEqual(expect.objectContaining({
        id: 'doc-2',
        first_name: undefined,
        specialty_name: undefined,
        status: 'active'
      }));
    });

    test('findAllWithDetails does not filter inactive doctors when activeOnly is false', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createSuccessfulQuery([
        createDoctorWithRelations({
          active: false,
          users: createExistingUser({ is_active: false }),
          specialties: createSpecialty()
        }),
        createDoctorWithRelations({
          id: 'doc-2',
          active: true,
          users: createExistingUser({
            id: 'user-2',
            first_name: 'Luis',
            last_name: 'Paz',
            email: 'luis@example.com',
            is_active: true
          }),
          specialties: createSpecialty({ name: 'Pediatria' })
        })
      ]);

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findAllWithDetails({ activeOnly: false });

      expect(query.eq).not.toHaveBeenCalledWith('active', true);
      expect(doctors).toHaveLength(2);
      expect(doctors[0].status).toBe('inactive');
      expect(doctors[1].status).toBe('active');
    });

    test('findAllWithDetails throws database error when query fails', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      fromMock.mockReturnValueOnce(createDatabaseErrorQuery('Find all failed'));

      await expect(repo.findAllWithDetails()).rejects.toThrow(
        'Database error: Find all failed'
      );
    });

    test('formatDoctorResponse handles missing nested user and specialty data', () => {
      const { repo } = loadDoctorRepository();

      const formatted = repo.formatDoctorResponse(createDoctorRecord({
        users: null,
        specialties: null,
        active: false,
        created_at: '2026-01-01',
        updated_at: '2026-01-02'
      }));

      expect(formatted).toEqual(expect.objectContaining({
        id: 'doc-1',
        first_name: undefined,
        last_name: undefined,
        email: undefined,
        specialty_name: undefined,
        specialty: null,
        active: false,
        status: 'inactive'
      }));
    });

    test('updateActiveStatus activates doctor using active field', async () => {
      const { repo, updateMock } = loadDoctorRepository();

      const updated = await repo.updateActiveStatus('doc-1', true);

      expect(updateMock).toHaveBeenCalledWith('doc-1', { active: true });
      expect(updated).toEqual({ id: 'doc-1', active: true });
    });

    test('hasSoftDelete returns false because doctor uses active field', () => {
      const { repo } = loadDoctorRepository();

      expect(repo.hasSoftDelete()).toBe(false);
    });
  });

  describe('CRUD layer - doctor.routes', () => {
    test('registers role guards for doctor endpoints', () => {
      const { requireRole } = loadDoctorRoutes();

      expect(requireRole).toHaveBeenCalledWith('doctor');
      expect(requireRole).toHaveBeenCalledWith('admin');
    });

    test('contains public, doctor and admin routes', () => {
      const { router } = loadDoctorRoutes();

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

  describe('CRUD layer - doctor.controller', () => {
    test('getAll delegates to findAllWithDetails and returns paginated response', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findAllWithDetails.mockResolvedValue([
        createDoctorRecord(),
        createDoctorRecord({ id: 'doc-2' })
      ]);

      await invokeHandler(controller.getAll, createReq({
        query: { page: '1', limit: '10', search: 'ana' }
      }));

      expect(doctorRepository.findAllWithDetails).toHaveBeenCalledWith(expect.objectContaining({
        limit: 10,
        offset: 0,
        search: 'ana',
        activeOnly: true
      }));
      expect(responseBuilderMock.paginated).toHaveBeenCalled();
    });

    test('getById sends NotFoundError when doctor does not exist', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findWithDetails.mockResolvedValue(null);

      const next = await invokeHandler(controller.getById, createReq({
        params: { id: 'missing-doc' }
      }));

      expectNextError(next, 'Doctor');
    });

    test('getProfile returns current doctor profile', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();
      const doctor = createDoctorRecord();

      doctorRepository.findByUserId.mockResolvedValue(doctor);

      await invokeHandler(controller.getProfile, createReq({
        user: { id: 'user-1' }
      }));

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), doctor);
    });

    test('create rejects missing required fields', async () => {
      const { controller } = loadDoctorController();

      const next = await invokeHandler(controller.create, createReq({
        body: { professional_id: 'MED-001' }
      }));

      expectNextError(next, 'user_id y specialty_id');
    });

    test('create creates doctor for existing user', async () => {
      const {
        controller,
        userRepository,
        doctorRepository,
        responseBuilderMock,
        createAuditLog
      } = loadDoctorController();
      const body = createDoctorCreateBody();
      const doctor = createDoctorRecord(body);

      userRepository.findById.mockResolvedValue(createExistingUser());
      doctorRepository.findByUserId.mockResolvedValue(null);
      doctorRepository.create.mockResolvedValue(doctor);

      await invokeHandler(controller.create, createReq({ body }));

      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(doctorRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...body,
        active: true
      }));
      expect(createAuditLog).toHaveBeenCalled();
      expect(responseBuilderMock.created).toHaveBeenCalled();
    });

    test('createWithUser rejects invalid cedula', async () => {
      const { controller } = loadDoctorController();

      const next = await invokeHandler(controller.createWithUser, createReq({
        body: createDoctorBody({ cedula: '123' })
      }));

      expectNextError(next, '10');
    });

    test('createWithUser creates new user and doctor with temporary password', async () => {
      const {
        controller,
        userRepository,
        doctorRepository,
        responseBuilderMock,
        fromMock
      } = loadDoctorController();
      const body = createDoctorBody({ email: 'doctor@example.com' });
      const newUser = createExistingUser({
        id: 'user-new',
        email: 'doctor@example.com',
        roles: undefined
      });

      fromMock
        .mockReturnValueOnce(createRoleQueryMock())
        .mockReturnValueOnce(createSuccessfulQuery(newUser));

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByCedula.mockResolvedValue(null);
      doctorRepository.create.mockResolvedValue(createDoctorRecord({
        id: 'doc-new',
        user_id: 'user-new'
      }));

      await invokeHandler(controller.createWithUser, createReq({ body }));

      expect(fromMock).toHaveBeenCalledWith('roles');
      expect(fromMock).toHaveBeenCalledWith('users');
      expect(doctorRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-new',
        specialty_id: 'sp-1',
        professional_id: 'MED-001',
        active: true
      }));
      expect(responseBuilderMock.created).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ temporary_password: '1723456789MOR!' }),
        'Doctor creado exitosamente con cuenta de usuario'
      );
    });

    test('update modifies doctor data when doctor exists', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();
      const body = createDoctorUpdateBody();

      doctorRepository.findById.mockResolvedValue(createDoctorRecord({
        specialty_id: 'old-sp',
        professional_id: 'OLD'
      }));
      doctorRepository.update.mockResolvedValue(createDoctorRecord(body));

      await invokeHandler(controller.update, createReq({
        params: { id: 'doc-1' },
        body
      }));

      expect(doctorRepository.update).toHaveBeenCalledWith('doc-1', body);
      expect(responseBuilderMock.success).toHaveBeenCalled();
    });

    test('resetPassword generates temporary password and updates user password', async () => {
      const {
        controller,
        doctorRepository,
        userRepository,
        responseBuilderMock,
        fromMock
      } = loadDoctorController();
      const updateQuery = createSuccessfulQuery(null);

      doctorRepository.findWithDetails.mockResolvedValue(createDoctorRecord());
      userRepository.findById.mockResolvedValue(createExistingUser());
      fromMock.mockReturnValueOnce(updateQuery);

      await invokeHandler(controller.resetPassword, createReq({
        params: { id: 'doc-1' }
      }));

      expect(fromMock).toHaveBeenCalledWith('users');
      expect(updateQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        password_hash: 'hashed-password',
        updated_at: expect.any(String)
      }));
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          doctor_id: 'doc-1',
          email: 'ana@example.com',
          temporary_password: '1723456789MOR!1234'
        }),
        200,
        expect.stringContaining('restablecida exitosamente')
      );
    });

    test('updateProfile updates user fields and doctor bio', async () => {
      const {
        controller,
        doctorRepository,
        userRepository,
        responseBuilderMock
      } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue(createDoctorRecord());
      doctorRepository.update.mockResolvedValue(createDoctorRecord({ bio: 'Nueva bio' }));

      await invokeHandler(controller.updateProfile, createReq({
        user: { id: 'user-1' },
        body: {
          first_name: 'Ana',
          last_name: 'Mora',
          phone_number: '0999999999',
          bio: 'Nueva bio'
        }
      }));

      expect(userRepository.update).toHaveBeenCalledWith('user-1', {
        first_name: 'Ana',
        last_name: 'Mora',
        phone_number: '0999999999'
      });
      expect(doctorRepository.update).toHaveBeenCalledWith('doc-1', { bio: 'Nueva bio' });
      expect(responseBuilderMock.success).toHaveBeenCalled();
    });

    test('delete performs soft delete when doctor exists', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findById.mockResolvedValue(createDoctorRecord());
      doctorRepository.softDelete.mockResolvedValue(true);

      await invokeHandler(controller.delete, createReq({
        params: { id: 'doc-1' }
      }));

      expect(doctorRepository.softDelete).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'doc-1' },
        200,
        'Doctor desactivado exitosamente'
      );
    });

    test('getMyPatients returns unique patients for current doctor', async () => {
      const {
        controller,
        doctorRepository,
        appointmentRepository,
        responseBuilderMock
      } = loadDoctorController();
      const patients = [{ id: 'patient-1' }];

      doctorRepository.findByUserId.mockResolvedValue(createDoctorRecord());
      appointmentRepository.findUniquePatientsByDoctor.mockResolvedValue(patients);

      await invokeHandler(controller.getMyPatients, createReq({
        user: { id: 'user-1' }
      }));

      expect(appointmentRepository.findUniquePatientsByDoctor).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), patients);
    });

    test('getAll delegates to findBySpecialty when specialty_id is provided', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findBySpecialty.mockResolvedValue([createDoctorRecord()]);

      await invokeHandler(controller.getAll, createReq({
        query: {
          page: '2',
          limit: '5',
          specialty_id: 'sp-1',
          active: 'false'
        }
      }));

      expect(doctorRepository.findBySpecialty).toHaveBeenCalledWith('sp-1', {
        limit: 5,
        offset: 5,
        activeOnly: false
      });
      expect(responseBuilderMock.paginated).toHaveBeenCalled();
    });

    test('getById returns doctor when it exists', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();
      const doctor = createDoctorRecord();

      doctorRepository.findWithDetails.mockResolvedValue(doctor);

      await invokeHandler(controller.getById, createReq({
        params: { id: 'doc-1' }
      }));

      expect(doctorRepository.findWithDetails).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), doctor);
    });

    test('getBySpecialty returns doctors for a specialty', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();
      const doctors = [createDoctorRecord()];

      doctorRepository.findBySpecialty.mockResolvedValue(doctors);

      await invokeHandler(controller.getBySpecialty, createReq({
        params: { specialtyId: 'sp-1' }
      }));

      expect(doctorRepository.findBySpecialty).toHaveBeenCalledWith('sp-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), doctors);
    });

    test('create sends NotFoundError when user does not exist', async () => {
      const { controller, userRepository } = loadDoctorController();

      userRepository.findById.mockResolvedValue(null);

      const next = await invokeHandler(controller.create, createReq({
        body: createDoctorCreateBody({ user_id: 'missing-user' })
      }));

      expect(userRepository.findById).toHaveBeenCalledWith('missing-user');
      expectNextError(next, 'Usuario');
    });

    test('create rejects when doctor already exists for user', async () => {
      const { controller, userRepository, doctorRepository } = loadDoctorController();

      userRepository.findById.mockResolvedValue(createExistingUser());
      doctorRepository.findByUserId.mockResolvedValue(createDoctorRecord({ id: 'doc-existing' }));

      const next = await invokeHandler(controller.create, createReq({
        body: createDoctorCreateBody()
      }));

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expectNextError(next, 'Ya existe');
    });

    test('createWithUser rejects missing required fields', async () => {
      const { controller } = loadDoctorController();

      const next = await invokeHandler(controller.createWithUser, createReq({
        body: { cedula: '1723456789' }
      }));

      expectNextError(next, 'requeridos');
    });

    test('createWithUser rejects when doctor role does not exist', async () => {
      const { controller, fromMock } = loadDoctorController();

      fromMock.mockReturnValueOnce(createSuccessfulQuery(null));

      const next = await invokeHandler(controller.createWithUser, createReq({
        body: createDoctorBody()
      }));

      expect(fromMock).toHaveBeenCalledWith('roles');
      expectNextError(next, 'Rol de doctor');
    });

    test('createWithUser rejects when email and cedula belong to different users', async () => {
      const { controller, userRepository, fromMock } = loadDoctorController();

      fromMock.mockReturnValueOnce(createRoleQueryMock());
      userRepository.findByEmail.mockResolvedValue(createExistingUser({ id: 'user-email' }));
      userRepository.findByCedula.mockResolvedValue(createExistingUser({ id: 'user-cedula' }));

      const next = await invokeHandler(controller.createWithUser, createReq({
        body: createDoctorBody()
      }));

      expectNextError(next, 'Conflicto de datos');
    });

    test('createWithUser returns promotion required when existing user is not doctor', async () => {
      const {
        controller,
        userRepository,
        doctorRepository,
        responseBuilderMock,
        fromMock
      } = loadDoctorController();
      const existingUser = createExistingUser({ roles: { name: 'patient' } });

      fromMock.mockReturnValueOnce(createRoleQueryMock());
      userRepository.findByEmail.mockResolvedValue(existingUser);
      userRepository.findByCedula.mockResolvedValue(existingUser);
      doctorRepository.findByUserId.mockResolvedValue(null);

      await invokeHandler(controller.createWithUser, createReq({
        body: createDoctorBody()
      }));

      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ requires_promotion: true }),
        200,
        'Usuario existente encontrado'
      );
    });

    test('createWithUser promotes existing user to doctor', async () => {
      const {
        controller,
        userRepository,
        doctorRepository,
        responseBuilderMock,
        fromMock
      } = loadDoctorController();
      const updateUserQuery = createSuccessfulQuery(null);
      const existingUser = createExistingUser();

      fromMock
        .mockReturnValueOnce(createRoleQueryMock())
        .mockReturnValueOnce(updateUserQuery);

      userRepository.findByEmail.mockResolvedValue(existingUser);
      userRepository.findByCedula.mockResolvedValue(existingUser);
      doctorRepository.findByUserId.mockResolvedValue(null);
      doctorRepository.create.mockResolvedValue(createDoctorRecord());

      await invokeHandler(controller.createWithUser, createReq({
        body: createDoctorBody({ promote_existing: true })
      }));

      expect(updateUserQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        role_id: 'role-doctor',
        is_active: true
      }));
      expect(doctorRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-1',
        specialty_id: 'sp-1',
        professional_id: 'MED-001'
      }));
      expect(responseBuilderMock.created).toHaveBeenCalled();
    });

    test('update sends NotFoundError when doctor does not exist', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findById.mockResolvedValue(null);

      const next = await invokeHandler(controller.update, createReq({
        params: { id: 'missing-doc' },
        body: createDoctorUpdateBody()
      }));

      expectNextError(next, 'Doctor');
    });

    test('resetPassword sends NotFoundError when doctor does not exist', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findWithDetails.mockResolvedValue(null);

      const next = await invokeHandler(controller.resetPassword, createReq({
        params: { id: 'missing-doc' }
      }));

      expectNextError(next, 'Doctor');
    });

    test('resetPassword sends NotFoundError when associated user does not exist', async () => {
      const { controller, doctorRepository, userRepository } = loadDoctorController();

      doctorRepository.findWithDetails.mockResolvedValue(createDoctorRecord({
        user_id: 'missing-user'
      }));
      userRepository.findById.mockResolvedValue(null);

      const next = await invokeHandler(controller.resetPassword, createReq({
        params: { id: 'doc-1' }
      }));

      expect(userRepository.findById).toHaveBeenCalledWith('missing-user');
      expectNextError(next, 'Usuario');
    });

    test('resetPassword sends ValidationError when password update fails', async () => {
      const {
        controller,
        doctorRepository,
        userRepository,
        fromMock
      } = loadDoctorController();

      doctorRepository.findWithDetails.mockResolvedValue(createDoctorRecord());
      userRepository.findById.mockResolvedValue(createExistingUser());
      fromMock.mockReturnValueOnce(createQueryMock({
        data: null,
        error: { message: 'update failed' }
      }));

      const next = await invokeHandler(controller.resetPassword, createReq({
        params: { id: 'doc-1' }
      }));

      expectNextError(next, 'Error al restablecer');
    });

    test('updateProfile sends NotFoundError when current user is not doctor', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue(null);

      const next = await invokeHandler(controller.updateProfile, createReq({
        user: { id: 'user-1' },
        body: { bio: 'Nueva bio' }
      }));

      expectNextError(next, 'Doctor');
    });

    test('delete sends NotFoundError when doctor does not exist', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findById.mockResolvedValue(null);

      const next = await invokeHandler(controller.delete, createReq({
        params: { id: 'missing-doc' }
      }));

      expectNextError(next, 'Doctor');
    });

    test('activate reactivates doctor when it exists', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();
      const updated = createDoctorRecord({ active: true });

      doctorRepository.findById.mockResolvedValue(createDoctorRecord());
      doctorRepository.updateActiveStatus.mockResolvedValue(updated);

      await invokeHandler(controller.activate, createReq({
        params: { id: 'doc-1' }
      }));

      expect(doctorRepository.updateActiveStatus).toHaveBeenCalledWith('doc-1', true);
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        updated,
        200,
        'Doctor activado exitosamente'
      );
    });

    test('getSchedules returns schedules by doctor id', async () => {
      const { controller, scheduleRepository, responseBuilderMock } = loadDoctorController();
      const schedules = [{ id: 'sch-1', doctor_id: 'doc-1' }];

      scheduleRepository.findByDoctor.mockResolvedValue(schedules);

      await invokeHandler(controller.getSchedules, createReq({
        params: { id: 'doc-1' }
      }));

      expect(scheduleRepository.findByDoctor).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(expect.anything(), schedules);
    });

    test('getMySchedules returns schedules for current doctor', async () => {
      const {
        controller,
        doctorRepository,
        scheduleRepository,
        responseBuilderMock
      } = loadDoctorController();
      const schedules = [{ id: 'sch-1', doctor_id: 'doc-1' }];

      doctorRepository.findByUserId.mockResolvedValue(createDoctorRecord());
      scheduleRepository.findByDoctor.mockResolvedValue(schedules);

      await invokeHandler(controller.getMySchedules, createReq({
        user: { id: 'user-1' }
      }));

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(scheduleRepository.findByDoctor).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalled();
    });

    test('getMySchedules sends NotFoundError when current user is not doctor', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue(null);

      const next = await invokeHandler(controller.getMySchedules, createReq({
        user: { id: 'user-1' }
      }));

      expectNextError(next, 'Doctor');
    });

    test('getMyPatients sends NotFoundError when current user is not doctor', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue(null);

      const next = await invokeHandler(controller.getMyPatients, createReq({
        user: { id: 'user-1' }
      }));

      expectNextError(next, 'Doctor');
    });
  });
});
