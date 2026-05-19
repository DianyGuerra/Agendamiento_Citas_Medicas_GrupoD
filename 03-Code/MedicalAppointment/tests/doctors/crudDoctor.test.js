const {
  createQueryMock,
  invokeHandler,
  loadDoctorRepository,
  loadDoctorRoutes,
  loadDoctorController
} = require('./helpers');

describe('Doctor module unit tests - CRUD layer', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});


  //-----------------------------------------------------------------------------------------------------------------------------
  // 												CRUD layer - doctor.repository
  //-----------------------------------------------------------------------------------------------------------------------------
  describe('CRUD layer - doctor.repository', () => {
    test('findByUserId returns doctor profile with user and specialty data', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createQueryMock({
        data: {
          id: 'doc-1',
          user_id: 'user-1',
          users: { first_name: 'Ana', last_name: 'Mora' },
          specialties: { name: 'Cardiología' }
        },
        error: null
      });

      fromMock.mockReturnValueOnce(query);

      const doctor = await repo.findByUserId('user-1');

      expect(fromMock).toHaveBeenCalledWith('doctors');
      expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(doctor.id).toBe('doc-1');
    });

    test('findWithDetails returns null when doctor does not exist', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createQueryMock({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' }
      });

      fromMock.mockReturnValueOnce(query);

      const doctor = await repo.findWithDetails('missing-doc');

      expect(query.eq).toHaveBeenCalledWith('id', 'missing-doc');
      expect(doctor).toBeNull();
    });

    test('findBySpecialty filters active doctors and sorts by last name', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createQueryMock({
        data: [
          {
            id: 'doc-2',
            professional_id: 'MED-002',
            active: true,
            users: {
              first_name: 'Luis',
              last_name: 'Zambrano',
              email: 'luis@example.com',
              is_active: true
            },
            specialties: { id: 'sp-1', name: 'Pediatría', consultation_fee: 80 }
          },
          {
            id: 'doc-1',
            professional_id: 'MED-001',
            active: true,
            users: {
              first_name: 'Ana',
              last_name: 'Mora',
              email: 'ana@example.com',
              is_active: true
            },
            specialties: { id: 'sp-1', name: 'Pediatría', consultation_fee: 80 }
          }
        ],
        error: null
      });

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findBySpecialty('sp-1', { limit: 10, offset: 0 });

      expect(query.eq).toHaveBeenCalledWith('specialty_id', 'sp-1');
      expect(query.eq).toHaveBeenCalledWith('active', true);
      expect(query.eq).toHaveBeenCalledWith('users.is_active', true);
      expect(doctors[0].last_name).toBe('Mora');
      expect(doctors[1].last_name).toBe('Zambrano');
    });

    test('findAllWithDetails applies search filter and formats doctors', async () => {
      const { repo, fromMock } = loadDoctorRepository();
      const query = createQueryMock({
        data: [
          {
            id: 'doc-1',
            professional_id: 'MED-001',
            active: true,
            users: {
              first_name: 'Ana',
              last_name: 'Mora',
              email: 'ana@example.com',
              phone_number: '0999999999',
              cedula: '1723456789',
              is_active: true
            },
            specialties: {
              id: 'sp-1',
              name: 'Cardiología',
              consultation_fee: 120
            }
          },
          {
            id: 'doc-2',
            professional_id: 'MED-002',
            active: true,
            users: {
              first_name: 'Carlos',
              last_name: 'Paz',
              email: 'carlos@example.com',
              is_active: true
            },
            specialties: {
              id: 'sp-2',
              name: 'Dermatología',
              consultation_fee: 90
            }
          }
        ],
        error: null
      });

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
      expect(doctors[0]).toEqual(
        expect.objectContaining({
          id: 'doc-1',
          first_name: 'Ana',
          specialty_name: 'Cardiología',
          status: 'active'
        })
      );
    });

    test('softDelete deactivates doctor using active field', async () => {
      const { repo, updateMock } = loadDoctorRepository();

      const result = await repo.softDelete('doc-1');

      expect(updateMock).toHaveBeenCalledWith('doc-1', { active: false });
      expect(result).toBe(true);
    });

	    test('findByUserId throws database error when Supabase returns unexpected error', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      const query = createQueryMock({
        data: null,
        error: { code: '500', message: 'Database failed' }
      });

      fromMock.mockReturnValueOnce(query);

      await expect(repo.findByUserId('user-1')).rejects.toThrow('Database error: Database failed');
    });

    test('findWithDetails throws database error when Supabase returns unexpected error', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      const query = createQueryMock({
        data: null,
        error: { code: '500', message: 'Details failed' }
      });

      fromMock.mockReturnValueOnce(query);

      await expect(repo.findWithDetails('doc-1')).rejects.toThrow('Database error: Details failed');
    });

    test('findBySpecialty does not apply active filters when activeOnly is false', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      const query = createQueryMock({
        data: [
          {
            id: 'doc-1',
            active: false,
            users: {
              first_name: 'Ana',
              last_name: 'Mora',
              email: 'ana@example.com',
              is_active: false
            },
            specialties: {
              id: 'sp-1',
              name: 'Cardiología',
              consultation_fee: 120
            }
          }
        ],
        error: null
      });

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findBySpecialty('sp-1', {
        activeOnly: false
      });

      expect(query.eq).toHaveBeenCalledWith('specialty_id', 'sp-1');
      expect(query.eq).not.toHaveBeenCalledWith('active', true);
      expect(query.eq).not.toHaveBeenCalledWith('users.is_active', true);
      expect(query.limit).not.toHaveBeenCalled();
      expect(query.range).not.toHaveBeenCalled();
      expect(doctors[0]).toEqual(
        expect.objectContaining({
          id: 'doc-1',
          active: false,
          status: 'inactive',
          is_active: false
        })
      );
    });

    test('findBySpecialty throws database error when query fails', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      const query = createQueryMock({
        data: null,
        error: { message: 'Specialty query failed' }
      });

      fromMock.mockReturnValueOnce(query);

      await expect(repo.findBySpecialty('sp-1')).rejects.toThrow(
        'Database error: Specialty query failed'
      );
    });

    test('findBySpecialty sorts doctors even when last names are missing', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      const query = createQueryMock({
        data: [
          {
            id: 'doc-2',
            active: true,
            users: null,
            specialties: null
          },
          {
            id: 'doc-1',
            active: true,
            users: {
              first_name: 'Ana',
              last_name: 'Mora',
              email: 'ana@example.com',
              is_active: true
            },
            specialties: {
              id: 'sp-1',
              name: 'Medicina General'
            }
          }
        ],
        error: null
      });

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findBySpecialty('sp-1', { activeOnly: false });

      expect(doctors).toHaveLength(2);
      expect(doctors[0]).toEqual(
        expect.objectContaining({
          id: 'doc-2',
          first_name: undefined,
          specialty_name: undefined,
          status: 'active'
        })
      );
    });

    test('findAllWithDetails does not filter inactive doctors when activeOnly is false', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      const query = createQueryMock({
        data: [
          {
            id: 'doc-1',
            active: false,
            users: {
              first_name: 'Ana',
              last_name: 'Mora',
              email: 'ana@example.com',
              is_active: false
            },
            specialties: {
              name: 'Cardiología'
            }
          },
          {
            id: 'doc-2',
            active: true,
            users: {
              first_name: 'Luis',
              last_name: 'Paz',
              email: 'luis@example.com',
              is_active: true
            },
            specialties: {
              name: 'Pediatría'
            }
          }
        ],
        error: null
      });

      fromMock.mockReturnValueOnce(query);

      const doctors = await repo.findAllWithDetails({
        activeOnly: false
      });

      expect(query.eq).not.toHaveBeenCalledWith('active', true);
      expect(doctors).toHaveLength(2);
      expect(doctors[0].status).toBe('inactive');
      expect(doctors[1].status).toBe('active');
    });

    test('findAllWithDetails throws database error when query fails', async () => {
      const { repo, fromMock } = loadDoctorRepository();

      const query = createQueryMock({
        data: null,
        error: { message: 'Find all failed' }
      });

      fromMock.mockReturnValueOnce(query);

      await expect(repo.findAllWithDetails()).rejects.toThrow(
        'Database error: Find all failed'
      );
    });

    test('formatDoctorResponse handles missing nested user and specialty data', () => {
      const { repo } = loadDoctorRepository();

      const formatted = repo.formatDoctorResponse({
        id: 'doc-1',
        professional_id: 'MED-001',
        specialty_id: 'sp-1',
        user_id: 'user-1',
        users: null,
        specialties: null,
        bio: null,
        active: false,
        created_at: '2026-01-01',
        updated_at: '2026-01-02'
      });

      expect(formatted).toEqual(
        expect.objectContaining({
          id: 'doc-1',
          first_name: undefined,
          last_name: undefined,
          email: undefined,
          specialty_name: undefined,
          specialty: null,
          active: false,
          status: 'inactive'
        })
      );
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

  //-----------------------------------------------------------------------------------------------------------------------------
  // 												CRUD layer - doctor.routes
  //-----------------------------------------------------------------------------------------------------------------------------
  describe('CRUD layer - doctor.routes', () => {
    test('registers role guards for doctor endpoints', () => {
      const { requireRole } = loadDoctorRoutes();

      expect(requireRole).toHaveBeenCalledWith('doctor');
      expect(requireRole).toHaveBeenCalledWith('admin');
    });

    test('contains public, doctor and admin routes', () => {
      const { router } = loadDoctorRoutes();

      const routePaths = router.stack
        .filter((layer) => layer.route)
        .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);

      expect(routePaths).toEqual(
        expect.arrayContaining([
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
        ])
      );
    });
  });

  //-----------------------------------------------------------------------------------------------------------------------------
  // 												CRUD layer - doctor.controller
  //-----------------------------------------------------------------------------------------------------------------------------

  describe('CRUD layer - doctor.controller', () => {
	test('getAll delegates to findAllWithDetails and returns paginated response', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findAllWithDetails.mockResolvedValue([
        { id: 'doc-1' },
        { id: 'doc-2' }
      ]);

      await invokeHandler(controller.getAll, {
        query: { page: '1', limit: '10', search: 'ana' }
      });

      expect(doctorRepository.findAllWithDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0,
          search: 'ana',
          activeOnly: true
        })
      );
      expect(responseBuilderMock.paginated).toHaveBeenCalled();
    });

    test('getById sends NotFoundError when doctor does not exist', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findWithDetails.mockResolvedValue(null);

      const next = await invokeHandler(controller.getById, {
        params: { id: 'missing-doc' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Doctor');
    });

    test('getProfile returns current doctor profile', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue({ id: 'doc-1', user_id: 'user-1' });

      await invokeHandler(controller.getProfile, {
        user: { id: 'user-1' }
      });

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'doc-1' })
      );
    });

    test('create rejects missing required fields', async () => {
      const { controller } = loadDoctorController();

      const next = await invokeHandler(controller.create, {
        body: { professional_id: 'MED-001' },
        user: { id: 'admin-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('user_id y specialty_id');
    });

    test('create creates doctor for existing user', async () => {
      const {
        controller,
        userRepository,
        doctorRepository,
        responseBuilderMock,
        createAuditLog
      } = loadDoctorController();

      userRepository.findById.mockResolvedValue({ id: 'user-1' });
      doctorRepository.findByUserId.mockResolvedValue(null);
      doctorRepository.create.mockResolvedValue({
        id: 'doc-1',
        user_id: 'user-1',
        specialty_id: 'sp-1'
      });

      await invokeHandler(controller.create, {
        body: {
          user_id: 'user-1',
          specialty_id: 'sp-1',
          professional_id: 'MED-001',
          bio: 'Especialista'
        },
        user: { id: 'admin-1' }
      });

      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(doctorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          specialty_id: 'sp-1',
          active: true
        })
      );
      expect(createAuditLog).toHaveBeenCalled();
      expect(responseBuilderMock.created).toHaveBeenCalled();
    });

    test('createWithUser rejects invalid cedula', async () => {
      const { controller } = loadDoctorController();

      const next = await invokeHandler(controller.createWithUser, {
        body: {
          cedula: '123',
          first_name: 'Ana',
          last_name: 'Mora',
          email: 'ana@example.com',
          specialty_id: 'sp-1'
        },
        user: { id: 'admin-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('10 dígitos');
    });

    test('createWithUser creates new user and doctor with temporary password', async () => {
      const {
        controller,
        userRepository,
        doctorRepository,
        responseBuilderMock,
        fromMock
      } = loadDoctorController();

      const roleQuery = createQueryMock({
        data: { id: 'role-doctor' },
        error: null
      });

      const insertUserQuery = createQueryMock({
        data: {
          id: 'user-new',
          email: 'doctor@example.com',
          first_name: 'Ana',
          last_name: 'Mora'
        },
        error: null
      });

      fromMock
        .mockReturnValueOnce(roleQuery)
        .mockReturnValueOnce(insertUserQuery);

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByCedula.mockResolvedValue(null);
      doctorRepository.create.mockResolvedValue({
        id: 'doc-new',
        user_id: 'user-new',
        specialty_id: 'sp-1'
      });

      await invokeHandler(controller.createWithUser, {
        body: {
          cedula: '1723456789',
          first_name: 'Ana',
          last_name: 'Mora',
          email: 'doctor@example.com',
          phone_number: '0999999999',
          specialty_id: 'sp-1',
          license_number: 'MED-001'
        },
        user: { id: 'admin-1' }
      });

      expect(fromMock).toHaveBeenCalledWith('roles');
      expect(fromMock).toHaveBeenCalledWith('users');
      expect(doctorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-new',
          specialty_id: 'sp-1',
          professional_id: 'MED-001',
          active: true
        })
      );
      expect(responseBuilderMock.created).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          temporary_password: '1723456789MOR!'
        }),
        'Doctor creado exitosamente con cuenta de usuario'
      );
    });

    test('update modifies doctor data when doctor exists', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findById.mockResolvedValue({
        id: 'doc-1',
        specialty_id: 'old-sp',
        professional_id: 'OLD'
      });

      doctorRepository.update.mockResolvedValue({
        id: 'doc-1',
        specialty_id: 'sp-2',
        professional_id: 'MED-002'
      });

      await invokeHandler(controller.update, {
        params: { id: 'doc-1' },
        body: {
          specialty_id: 'sp-2',
          professional_id: 'MED-002',
          bio: 'Actualizado'
        },
        user: { id: 'admin-1' }
      });

      expect(doctorRepository.update).toHaveBeenCalledWith('doc-1', {
        specialty_id: 'sp-2',
        professional_id: 'MED-002',
        bio: 'Actualizado'
      });
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

      const updateQuery = createQueryMock({ data: null, error: null });

      doctorRepository.findWithDetails.mockResolvedValue({
        id: 'doc-1',
        user_id: 'user-1'
      });

      userRepository.findById.mockResolvedValue({
        id: 'user-1',
        cedula: '1723456789',
        first_name: 'Ana',
        last_name: 'Mora',
        email: 'ana@example.com'
      });

      fromMock.mockReturnValueOnce(updateQuery);

      await invokeHandler(controller.resetPassword, {
        params: { id: 'doc-1' },
        user: { id: 'admin-1' }
      });

      expect(fromMock).toHaveBeenCalledWith('users');
      expect(updateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          password_hash: 'hashed-password',
          updated_at: expect.any(String)
        })
      );
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          doctor_id: 'doc-1',
          email: 'ana@example.com',
          temporary_password: '1723456789MOR!1234'
        }),
        200,
        'Contraseña restablecida exitosamente'
      );
    });

    test('updateProfile updates user fields and doctor bio', async () => {
      const {
        controller,
        doctorRepository,
        userRepository,
        responseBuilderMock
      } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue({ id: 'doc-1' });
      doctorRepository.update.mockResolvedValue({ id: 'doc-1', bio: 'Nueva bio' });

      await invokeHandler(controller.updateProfile, {
        user: { id: 'user-1' },
        body: {
          first_name: 'Ana',
          last_name: 'Mora',
          phone_number: '0999999999',
          bio: 'Nueva bio'
        }
      });

      expect(userRepository.update).toHaveBeenCalledWith('user-1', {
        first_name: 'Ana',
        last_name: 'Mora',
        phone_number: '0999999999'
      });
      expect(doctorRepository.update).toHaveBeenCalledWith('doc-1', {
        bio: 'Nueva bio'
      });
      expect(responseBuilderMock.success).toHaveBeenCalled();
    });

    test('delete performs soft delete when doctor exists', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findById.mockResolvedValue({ id: 'doc-1' });
      doctorRepository.softDelete.mockResolvedValue(true);

      await invokeHandler(controller.delete, {
        params: { id: 'doc-1' },
        user: { id: 'admin-1' }
      });

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

      doctorRepository.findByUserId.mockResolvedValue({ id: 'doc-1' });
      appointmentRepository.findUniquePatientsByDoctor.mockResolvedValue([
        { id: 'patient-1' }
      ]);

      await invokeHandler(controller.getMyPatients, {
        user: { id: 'user-1' }
      });

      expect(appointmentRepository.findUniquePatientsByDoctor).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        [{ id: 'patient-1' }]
      );
    });

	    test('getAll delegates to findBySpecialty when specialty_id is provided', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findBySpecialty.mockResolvedValue([{ id: 'doc-1' }]);

      await invokeHandler(controller.getAll, {
        query: {
          page: '2',
          limit: '5',
          specialty_id: 'sp-1',
          active: 'false'
        }
      });

      expect(doctorRepository.findBySpecialty).toHaveBeenCalledWith('sp-1', {
        limit: 5,
        offset: 5,
        activeOnly: false
      });
      expect(responseBuilderMock.paginated).toHaveBeenCalled();
    });

    test('getById returns doctor when it exists', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findWithDetails.mockResolvedValue({
        id: 'doc-1',
        user_id: 'user-1'
      });

      await invokeHandler(controller.getById, {
        params: { id: 'doc-1' }
      });

      expect(doctorRepository.findWithDetails).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'doc-1' })
      );
    });

    test('getBySpecialty returns doctors for a specialty', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findBySpecialty.mockResolvedValue([
        { id: 'doc-1', specialty_id: 'sp-1' }
      ]);

      await invokeHandler(controller.getBySpecialty, {
        params: { specialtyId: 'sp-1' }
      });

      expect(doctorRepository.findBySpecialty).toHaveBeenCalledWith('sp-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        [{ id: 'doc-1', specialty_id: 'sp-1' }]
      );
    });

    test('create sends NotFoundError when user does not exist', async () => {
      const { controller, userRepository } = loadDoctorController();

      userRepository.findById.mockResolvedValue(null);

      const next = await invokeHandler(controller.create, {
        body: {
          user_id: 'missing-user',
          specialty_id: 'sp-1'
        },
        user: { id: 'admin-1' }
      });

      expect(userRepository.findById).toHaveBeenCalledWith('missing-user');
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Usuario');
    });

    test('create rejects when doctor already exists for user', async () => {
      const { controller, userRepository, doctorRepository } = loadDoctorController();

      userRepository.findById.mockResolvedValue({ id: 'user-1' });
      doctorRepository.findByUserId.mockResolvedValue({ id: 'doc-existing' });

      const next = await invokeHandler(controller.create, {
        body: {
          user_id: 'user-1',
          specialty_id: 'sp-1'
        },
        user: { id: 'admin-1' }
      });

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Ya existe');
    });

    test('createWithUser rejects missing required fields', async () => {
      const { controller } = loadDoctorController();

      const next = await invokeHandler(controller.createWithUser, {
        body: {
          cedula: '1723456789'
        },
        user: { id: 'admin-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Cédula');
    });

    test('createWithUser rejects when doctor role does not exist', async () => {
      const { controller, fromMock } = loadDoctorController();

      const roleQuery = createQueryMock({
        data: null,
        error: null
      });

      fromMock.mockReturnValueOnce(roleQuery);

      const next = await invokeHandler(controller.createWithUser, {
        body: {
          cedula: '1723456789',
          first_name: 'Ana',
          last_name: 'Mora',
          email: 'ana@example.com',
          specialty_id: 'sp-1'
        },
        user: { id: 'admin-1' }
      });

      expect(fromMock).toHaveBeenCalledWith('roles');
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Rol de doctor');
    });

    test('createWithUser rejects when email and cedula belong to different users', async () => {
      const { controller, userRepository, fromMock } = loadDoctorController();

      const roleQuery = createQueryMock({
        data: { id: 'role-doctor' },
        error: null
      });

      fromMock.mockReturnValueOnce(roleQuery);

      userRepository.findByEmail.mockResolvedValue({
        id: 'user-email',
        email: 'ana@example.com'
      });
      userRepository.findByCedula.mockResolvedValue({
        id: 'user-cedula',
        cedula: '1723456789'
      });

      const next = await invokeHandler(controller.createWithUser, {
        body: {
          cedula: '1723456789',
          first_name: 'Ana',
          last_name: 'Mora',
          email: 'ana@example.com',
          specialty_id: 'sp-1'
        },
        user: { id: 'admin-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Conflicto de datos');
    });

    test('createWithUser returns promotion required when existing user is not doctor', async () => {
      const {
        controller,
        userRepository,
        doctorRepository,
        responseBuilderMock,
        fromMock
      } = loadDoctorController();

      const roleQuery = createQueryMock({
        data: { id: 'role-doctor' },
        error: null
      });

      fromMock.mockReturnValueOnce(roleQuery);

      const existingUser = {
        id: 'user-1',
        email: 'ana@example.com',
        first_name: 'Ana',
        last_name: 'Mora',
        roles: { name: 'patient' }
      };

      userRepository.findByEmail.mockResolvedValue(existingUser);
      userRepository.findByCedula.mockResolvedValue(existingUser);
      doctorRepository.findByUserId.mockResolvedValue(null);

      await invokeHandler(controller.createWithUser, {
        body: {
          cedula: '1723456789',
          first_name: 'Ana',
          last_name: 'Mora',
          email: 'ana@example.com',
          specialty_id: 'sp-1'
        },
        user: { id: 'admin-1' }
      });

      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          requires_promotion: true
        }),
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

      const roleQuery = createQueryMock({
        data: { id: 'role-doctor' },
        error: null
      });

      const updateUserQuery = createQueryMock({
        data: null,
        error: null
      });

      fromMock
        .mockReturnValueOnce(roleQuery)
        .mockReturnValueOnce(updateUserQuery);

      const existingUser = {
        id: 'user-1',
        email: 'ana@example.com',
        first_name: 'Ana',
        last_name: 'Mora',
        cedula: '1723456789',
        phone_number: '0999999999'
      };

      userRepository.findByEmail.mockResolvedValue(existingUser);
      userRepository.findByCedula.mockResolvedValue(existingUser);
      doctorRepository.findByUserId.mockResolvedValue(null);
      doctorRepository.create.mockResolvedValue({
        id: 'doc-1',
        user_id: 'user-1',
        specialty_id: 'sp-1'
      });

      await invokeHandler(controller.createWithUser, {
        body: {
          cedula: '1723456789',
          first_name: 'Ana',
          last_name: 'Mora',
          email: 'ana@example.com',
          phone_number: '0999999999',
          specialty_id: 'sp-1',
          license_number: 'MED-001',
          promote_existing: true
        },
        user: { id: 'admin-1' }
      });

      expect(updateUserQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          role_id: 'role-doctor',
          is_active: true
        })
      );
      expect(doctorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          specialty_id: 'sp-1',
          professional_id: 'MED-001'
        })
      );
      expect(responseBuilderMock.created).toHaveBeenCalled();
    });

    test('update sends NotFoundError when doctor does not exist', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findById.mockResolvedValue(null);

      const next = await invokeHandler(controller.update, {
        params: { id: 'missing-doc' },
        body: {
          specialty_id: 'sp-1',
          professional_id: 'MED-001'
        },
        user: { id: 'admin-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Doctor');
    });

    test('resetPassword sends NotFoundError when doctor does not exist', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findWithDetails.mockResolvedValue(null);

      const next = await invokeHandler(controller.resetPassword, {
        params: { id: 'missing-doc' },
        user: { id: 'admin-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Doctor');
    });

    test('resetPassword sends NotFoundError when associated user does not exist', async () => {
      const { controller, doctorRepository, userRepository } = loadDoctorController();

      doctorRepository.findWithDetails.mockResolvedValue({
        id: 'doc-1',
        user_id: 'missing-user'
      });
      userRepository.findById.mockResolvedValue(null);

      const next = await invokeHandler(controller.resetPassword, {
        params: { id: 'doc-1' },
        user: { id: 'admin-1' }
      });

      expect(userRepository.findById).toHaveBeenCalledWith('missing-user');
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Usuario');
    });

    test('resetPassword sends ValidationError when password update fails', async () => {
      const {
        controller,
        doctorRepository,
        userRepository,
        fromMock
      } = loadDoctorController();

      const updateQuery = createQueryMock({
        data: null,
        error: { message: 'update failed' }
      });

      doctorRepository.findWithDetails.mockResolvedValue({
        id: 'doc-1',
        user_id: 'user-1'
      });

      userRepository.findById.mockResolvedValue({
        id: 'user-1',
        cedula: '1723456789',
        first_name: 'Ana',
        last_name: 'Mora',
        email: 'ana@example.com'
      });

      fromMock.mockReturnValueOnce(updateQuery);

      const next = await invokeHandler(controller.resetPassword, {
        params: { id: 'doc-1' },
        user: { id: 'admin-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Error al restablecer');
    });

    test('updateProfile sends NotFoundError when current user is not doctor', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue(null);

      const next = await invokeHandler(controller.updateProfile, {
        user: { id: 'user-1' },
        body: {
          bio: 'Nueva bio'
        }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Doctor');
    });

    test('delete sends NotFoundError when doctor does not exist', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findById.mockResolvedValue(null);

      const next = await invokeHandler(controller.delete, {
        params: { id: 'missing-doc' },
        user: { id: 'admin-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Doctor');
    });

    test('activate reactivates doctor when it exists', async () => {
      const { controller, doctorRepository, responseBuilderMock } = loadDoctorController();

      doctorRepository.findById.mockResolvedValue({ id: 'doc-1' });
      doctorRepository.updateActiveStatus.mockResolvedValue({
        id: 'doc-1',
        active: true
      });

      await invokeHandler(controller.activate, {
        params: { id: 'doc-1' },
        user: { id: 'admin-1' }
      });

      expect(doctorRepository.updateActiveStatus).toHaveBeenCalledWith('doc-1', true);
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'doc-1', active: true },
        200,
        'Doctor activado exitosamente'
      );
    });

    test('getSchedules returns schedules by doctor id', async () => {
      const { controller, scheduleRepository, responseBuilderMock } = loadDoctorController();

      scheduleRepository.findByDoctor.mockResolvedValue([
        { id: 'sch-1', doctor_id: 'doc-1' }
      ]);

      await invokeHandler(controller.getSchedules, {
        params: { id: 'doc-1' }
      });

      expect(scheduleRepository.findByDoctor).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        [{ id: 'sch-1', doctor_id: 'doc-1' }]
      );
    });

    test('getMySchedules returns schedules for current doctor', async () => {
      const {
        controller,
        doctorRepository,
        scheduleRepository,
        responseBuilderMock
      } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue({ id: 'doc-1' });
      scheduleRepository.findByDoctor.mockResolvedValue([
        { id: 'sch-1', doctor_id: 'doc-1' }
      ]);

      await invokeHandler(controller.getMySchedules, {
        user: { id: 'user-1' }
      });

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(scheduleRepository.findByDoctor).toHaveBeenCalledWith('doc-1');
      expect(responseBuilderMock.success).toHaveBeenCalled();
    });

    test('getMySchedules sends NotFoundError when current user is not doctor', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue(null);

      const next = await invokeHandler(controller.getMySchedules, {
        user: { id: 'user-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Doctor');
    });

    test('getMyPatients sends NotFoundError when current user is not doctor', async () => {
      const { controller, doctorRepository } = loadDoctorController();

      doctorRepository.findByUserId.mockResolvedValue(null);

      const next = await invokeHandler(controller.getMyPatients, {
        user: { id: 'user-1' }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('Doctor');
    });
  });
});