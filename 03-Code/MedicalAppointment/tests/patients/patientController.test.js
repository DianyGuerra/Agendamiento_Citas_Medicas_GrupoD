const { createQueryMock, loadPatientController, invokeHandler } = require('./helpers');

describe('Patient controller unit tests', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	test('getById returns patient data when found', async () => {
		const { controller, patientRepository, responseBuilder } = loadPatientController();
		patientRepository.findWithUserDetails.mockResolvedValue({ id: 'pat-1', name: 'Ana' });

		const req = { params: { id: 'pat-1' } };
		await controller.getById(req, {});

		expect(patientRepository.findWithUserDetails).toHaveBeenCalledWith('pat-1');
		expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { id: 'pat-1', name: 'Ana' });
	});

	test('getById forwards NotFoundError when patient is missing', async () => {
		const { controller, patientRepository } = loadPatientController();
		patientRepository.findWithUserDetails.mockResolvedValue(null);

		const req = { params: { id: 'unknown' } };
		const { next } = await invokeHandler(controller.getById, req, {});

		expect(next).toHaveBeenCalledTimes(1);
		expect(next.mock.calls[0][0].message).toContain('Paciente');
	});

	test('getByUserId returns null successfully when no patient profile exists', async () => {
		const { controller, patientRepository, responseBuilder } = loadPatientController();
		patientRepository.findWithUserDetails.mockResolvedValue(null);

		const req = { params: { userId: 'user-1' } };
		await controller.getByUserId(req, {});

		expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), null);
	});

	test('getByUserId returns patient data when found', async () => {
		const { controller, patientRepository, responseBuilder } = loadPatientController();
		patientRepository.findWithUserDetails.mockResolvedValue({ id: 'pat-1', user_id: 'user-1' });

		const req = { params: { userId: 'user-1' } };
		await controller.getByUserId(req, {});

		expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { id: 'pat-1', user_id: 'user-1' });
	});

	test('getProfile creates patient record when missing and returns profile', async () => {
		const { controller, patientRepository, responseBuilder } = loadPatientController();
		patientRepository.findWithUserDetails
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: 'pat-1', user_id: 'user-1' });
		patientRepository.createForUser.mockResolvedValue({ id: 'pat-1' });

		const req = { user: { id: 'user-1' } };
		await controller.getProfile(req, {});

		expect(patientRepository.createForUser).toHaveBeenCalledWith('user-1');
		expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { id: 'pat-1', user_id: 'user-1' });
	});

	test('getProfile returns existing profile without creating a new one', async () => {
		const { controller, patientRepository, responseBuilder } = loadPatientController();
		patientRepository.findWithUserDetails.mockResolvedValue({ id: 'pat-1', user_id: 'user-1' });

		const req = { user: { id: 'user-1' } };
		await controller.getProfile(req, {});

		expect(patientRepository.createForUser).not.toHaveBeenCalled();
		expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { id: 'pat-1', user_id: 'user-1' });
	});

	test('updateProfile updates both user and patient data', async () => {
		const { controller, patientRepository, userRepository, responseBuilder } = loadPatientController();
		patientRepository.findByUserId.mockResolvedValue({ id: 'pat-1', user_id: 'user-1' });
		patientRepository.findWithUserDetails.mockResolvedValue({ id: 'pat-1', user_id: 'user-1', first_name: 'Ana', address: 'Calle 123' });

		const req = {
			user: { id: 'user-1' },
			body: {
				first_name: 'Ana',
				address: 'Calle Falsa 123',
				province: 'Bogota',
				landline: '1234567'
			}
		};

		await controller.updateProfile(req, {});

		expect(userRepository.update).toHaveBeenCalledWith('user-1', expect.objectContaining({ first_name: 'Ana' }));
		expect(patientRepository.updateByUserId).toHaveBeenCalledWith('user-1', expect.objectContaining({ address: 'Calle Falsa 123', state: 'Bogota', home_phone: '1234567' }));
		expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { id: 'pat-1', user_id: 'user-1', first_name: 'Ana', address: 'Calle 123' }, 200, 'Perfil actualizado exitosamente');
	});

	test('updateProfile creates patient record when none exists yet and normalizes empty strings to null', async () => {
		const { controller, patientRepository, userRepository } = loadPatientController();
		patientRepository.findByUserId.mockResolvedValue(null);
		patientRepository.findWithUserDetails.mockResolvedValue({ id: 'pat-1', user_id: 'user-1' });

		const req = {
			user: { id: 'user-1' },
			body: {
				address: '',
				chronic_conditions: 'Diabetes'
			}
		};

		await controller.updateProfile(req, {});

		expect(userRepository.update).not.toHaveBeenCalled();
		expect(patientRepository.createForUser).toHaveBeenCalledWith('user-1', expect.objectContaining({
			address: null,
			medical_conditions: 'Diabetes'
		}));
		expect(patientRepository.updateByUserId).not.toHaveBeenCalled();
	});

	test('updateProfile skips both updates when body has no recognized fields', async () => {
		const { controller, patientRepository, userRepository } = loadPatientController();
		patientRepository.findWithUserDetails.mockResolvedValue({ id: 'pat-1', user_id: 'user-1' });

		const req = { user: { id: 'user-1' }, body: { unknown_field: 'value' } };

		await controller.updateProfile(req, {});

		expect(userRepository.update).not.toHaveBeenCalled();
		expect(patientRepository.findByUserId).not.toHaveBeenCalled();
		expect(patientRepository.createForUser).not.toHaveBeenCalled();
		expect(patientRepository.updateByUserId).not.toHaveBeenCalled();
	});

	test('getStats returns patient statistics successfully', async () => {
		const { controller, patientRepository, responseBuilder } = loadPatientController();
		patientRepository.getStats.mockResolvedValue({ total: 5, active: 4, inactive: 1 });

		const req = {};
		await controller.getStats(req, {});

		expect(patientRepository.getStats).toHaveBeenCalled();
		expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { total: 5, active: 4, inactive: 1 });
	});

	test('getAll returns paginated patients applying search from query', async () => {
		const { controller, patientRepository, responseBuilder } = loadPatientController();
		patientRepository.findAllWithUserInfo.mockResolvedValue([{ id: 'pat-1' }, { id: 'pat-2' }]);

		const req = { query: { page: '1', limit: '10', search: 'ana' } };
		await controller.getAll(req, {});

		expect(patientRepository.findAllWithUserInfo).toHaveBeenCalledWith({ limit: 10, offset: 0, search: 'ana' });
		expect(responseBuilder.paginated).toHaveBeenCalledWith(
			expect.any(Object),
			[{ id: 'pat-1' }, { id: 'pat-2' }],
			expect.objectContaining({ total: 2, page: 1, limit: 10 })
		);
	});

	describe('create', () => {
		test('creates a new patient record for an existing user', async () => {
			const { controller, patientRepository, userRepository, responseBuilder } = loadPatientController();
			userRepository.findById.mockResolvedValue({ id: 'user-1' });
			patientRepository.findByUserId.mockResolvedValue(null);
			patientRepository.createForUser.mockResolvedValue({ id: 'pat-1', user_id: 'user-1' });

			const req = { body: { user_id: 'user-1', blood_type: 'O+' } };
			await controller.create(req, {});

			expect(patientRepository.createForUser).toHaveBeenCalledWith('user-1', { blood_type: 'O+' });
			expect(responseBuilder.created).toHaveBeenCalledWith(expect.any(Object), { id: 'pat-1', user_id: 'user-1' }, 'Paciente creado exitosamente');
		});

		test('rejects when the target user does not exist', async () => {
			const { controller, userRepository } = loadPatientController();
			userRepository.findById.mockResolvedValue(null);

			const req = { body: { user_id: 'missing-user' } };
			const { next } = await invokeHandler(controller.create, req, {});

			expect(next.mock.calls[0][0].message).toContain('Usuario');
		});

		test('rejects when a patient record already exists for the user', async () => {
			const { controller, userRepository, patientRepository } = loadPatientController();
			userRepository.findById.mockResolvedValue({ id: 'user-1' });
			patientRepository.findByUserId.mockResolvedValue({ id: 'pat-1' });

			const req = { body: { user_id: 'user-1' } };
			const { next } = await invokeHandler(controller.create, req, {});

			expect(next.mock.calls[0][0].message).toContain('Ya existe un registro de paciente');
		});
	});

	describe('update', () => {
		test('updates an existing patient by user id', async () => {
			const { controller, patientRepository, responseBuilder } = loadPatientController();
			patientRepository.findByUserId.mockResolvedValue({ id: 'pat-1', user_id: 'user-1' });
			patientRepository.updateByUserId.mockResolvedValue({ id: 'pat-1', blood_type: 'A+' });

			const req = { params: { id: 'user-1' }, body: { blood_type: 'A+' } };
			await controller.update(req, {});

			expect(patientRepository.updateByUserId).toHaveBeenCalledWith('user-1', { blood_type: 'A+' });
			expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { id: 'pat-1', blood_type: 'A+' }, 200, 'Paciente actualizado exitosamente');
		});

		test('rejects when the patient does not exist', async () => {
			const { controller, patientRepository } = loadPatientController();
			patientRepository.findByUserId.mockResolvedValue(null);

			const req = { params: { id: 'unknown' }, body: {} };
			const { next } = await invokeHandler(controller.update, req, {});

			expect(next.mock.calls[0][0].message).toContain('Paciente');
		});
	});

	describe('delete', () => {
		test('soft deletes an existing patient and writes an audit log', async () => {
			const { controller, patientRepository, userRepository, responseBuilder, createAuditLog } = loadPatientController();
			patientRepository.findByUserId.mockResolvedValue({ id: 'pat-1', user_id: 'user-1' });

			const req = { params: { id: 'user-1' }, user: { id: 'admin-1' } };
			await controller.delete(req, {});

			expect(userRepository.softDelete).toHaveBeenCalledWith('user-1');
			expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
				userId: 'admin-1',
				action: 'PATIENT_DELETED',
				recordId: 'pat-1'
			}));
			expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { id: 'user-1' }, 200, 'Paciente desactivado exitosamente');
		});

		test('rejects when the patient does not exist', async () => {
			const { controller, patientRepository } = loadPatientController();
			patientRepository.findByUserId.mockResolvedValue(null);

			const req = { params: { id: 'unknown' }, user: { id: 'admin-1' } };
			const { next } = await invokeHandler(controller.delete, req, {});

			expect(next.mock.calls[0][0].message).toContain('Paciente');
		});
	});

	describe('createWithUser', () => {
		const baseBody = {
			email: 'new@example.com',
			first_name: 'Nueva',
			last_name: 'Paciente',
			cedula: '1712345678'
		};

		test('rejects when required fields are missing', async () => {
			const { controller } = loadPatientController();

			const req = { body: { email: 'x@example.com' }, user: { id: 'admin-1' } };
			const { next } = await invokeHandler(controller.createWithUser, req, {});

			expect(next.mock.calls[0][0].message).toContain('requeridos');
		});

		test('rejects when the patient role cannot be found', async () => {
			const { controller, fromMock } = loadPatientController();
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: null }));

			const req = { body: baseBody, user: { id: 'admin-1' } };
			const { next } = await invokeHandler(controller.createWithUser, req, {});

			expect(next.mock.calls[0][0].message).toContain('rol de paciente');
		});

		test('rejects when email and cedula belong to different existing users', async () => {
			const { controller, fromMock } = loadPatientController();

			fromMock
				.mockReturnValueOnce(createQueryMock({ data: { id: 'role-1' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: { id: 'user-email' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: { id: 'user-cedula' }, error: null }));

			const req = { body: baseBody, user: { id: 'admin-1' } };
			const { next } = await invokeHandler(controller.createWithUser, req, {});

			expect(next.mock.calls[0][0].message).toContain('pertenecen a usuarios diferentes');
		});

		test('rejects when the matched existing user is already a patient', async () => {
			const { controller, fromMock, patientRepository } = loadPatientController();

			fromMock
				.mockReturnValueOnce(createQueryMock({ data: { id: 'role-1' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: { id: 'user-1', email: 'new@example.com', roles: { name: 'patient' } }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }));

			patientRepository.findByUserId.mockResolvedValue({ id: 'pat-existing' });

			const req = { body: baseBody, user: { id: 'admin-1' } };
			const { next } = await invokeHandler(controller.createWithUser, req, {});

			expect(next.mock.calls[0][0].message).toContain('ya está registrado como paciente');
		});

		test('returns a promotion prompt when the user exists and promote_existing is not set', async () => {
			const { controller, fromMock, patientRepository, responseBuilder } = loadPatientController();

			fromMock
				.mockReturnValueOnce(createQueryMock({ data: { id: 'role-1' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: { id: 'user-1', email: 'new@example.com', first_name: 'Old', last_name: 'Name', roles: { name: 'staff' } }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }));

			patientRepository.findByUserId.mockResolvedValue(null);

			const req = { body: baseBody, user: { id: 'admin-1' } };
			await controller.createWithUser(req, {});

			expect(responseBuilder.success).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					requires_promotion: true,
					existing_user: expect.objectContaining({ id: 'user-1', current_role: 'staff' })
				}),
				200,
				'Usuario existente encontrado'
			);
			expect(patientRepository.createForUser).not.toHaveBeenCalled();
		});

		test('matches an existing user by cedula only and defaults the role label when roles are missing', async () => {
			const { controller, fromMock, patientRepository, responseBuilder } = loadPatientController();

			fromMock
				.mockReturnValueOnce(createQueryMock({ data: { id: 'role-1' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: { id: 'user-1', email: 'new@example.com', first_name: 'Old', last_name: 'Name', roles: null }, error: null }));

			patientRepository.findByUserId.mockResolvedValue(null);

			const req = { body: baseBody, user: { id: 'admin-1' } };
			await controller.createWithUser(req, {});

			expect(responseBuilder.success).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					existing_user: expect.objectContaining({ id: 'user-1', current_role: 'unknown' })
				}),
				200,
				'Usuario existente encontrado'
			);
		});

		test('promotes an existing user to patient when promote_existing is true', async () => {
			const { controller, fromMock, patientRepository, responseBuilder, createAuditLog } = loadPatientController();

			fromMock
				.mockReturnValueOnce(createQueryMock({ data: { id: 'role-1' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: { id: 'user-1', email: 'new@example.com', first_name: 'Old', last_name: 'Name', roles: { name: 'staff' } }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }));

			patientRepository.findByUserId.mockResolvedValue(null);
			patientRepository.createForUser.mockResolvedValue({ id: 'pat-1' });

			const req = { body: { ...baseBody, promote_existing: true }, user: { id: 'admin-1' } };
			await controller.createWithUser(req, {});

			expect(patientRepository.createForUser).toHaveBeenCalledWith('user-1', expect.objectContaining({}));
			expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ recordId: 'pat-1' }));
			expect(responseBuilder.created).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({ id: 'pat-1', promoted: true }),
				'Paciente creado exitosamente'
			);
		});

		test('rejects promotion when updating the user role fails', async () => {
			const { controller, fromMock, patientRepository } = loadPatientController();

			fromMock
				.mockReturnValueOnce(createQueryMock({ data: { id: 'role-1' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: { id: 'user-1', email: 'new@example.com', roles: { name: 'staff' } }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: { message: 'update failed' } }));

			patientRepository.findByUserId.mockResolvedValue(null);

			const req = { body: { ...baseBody, promote_existing: true }, user: { id: 'admin-1' } };
			const { next } = await invokeHandler(controller.createWithUser, req, {});

			expect(next.mock.calls[0][0].message).toContain('Error al actualizar usuario');
		});

		test('creates a brand new user and patient record when no match exists', async () => {
			const { controller, fromMock, patientRepository, responseBuilder, createAuditLog } = loadPatientController();

			fromMock
				.mockReturnValueOnce(createQueryMock({ data: { id: 'role-1' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: { id: 'new-user-1', email: 'new@example.com', first_name: 'Nueva', last_name: 'Paciente' }, error: null }));

			patientRepository.createForUser.mockResolvedValue({ id: 'pat-new' });

			const req = { body: baseBody, user: { id: 'admin-1' } };
			await controller.createWithUser(req, {});

			expect(patientRepository.createForUser).toHaveBeenCalledWith('new-user-1', expect.any(Object));
			expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ recordId: 'pat-new' }));
			expect(responseBuilder.created).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({ id: 'pat-new', temporary_password: expect.any(String) }),
				'Paciente creado exitosamente'
			);
		}, 15000);

		test('rejects when creating the new user fails', async () => {
			const { controller, fromMock } = loadPatientController();

			fromMock
				.mockReturnValueOnce(createQueryMock({ data: { id: 'role-1' }, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: null }))
				.mockReturnValueOnce(createQueryMock({ data: null, error: { message: 'insert failed' } }));

			const req = { body: baseBody, user: { id: 'admin-1' } };
			const { next } = await invokeHandler(controller.createWithUser, req, {});

			expect(next.mock.calls[0][0].message).toContain('Error al crear usuario');
		}, 15000);
	});
});
