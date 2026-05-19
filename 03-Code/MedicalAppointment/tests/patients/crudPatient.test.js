const { createQueryMock, loadPatientRepository, loadPatientRoutes } = require('./helpers');

describe('Patient module unit tests - CRUD layer', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	describe('CRUD layer - patient.repository', () => {
		test('findByUserId returns null when no patient exists', async () => {
			const { repo, fromMock } = loadPatientRepository();
			const query = createQueryMock({ data: null, error: { code: 'PGRST116', message: 'No rows returned' } });

			fromMock.mockReturnValueOnce(query);

			const patient = await repo.findByUserId('user-1');

			expect(fromMock).toHaveBeenCalledWith('patients');
			expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
			expect(patient).toBeNull();
		});

		test('findWithUserDetails returns flattened patient profile', async () => {
			const { repo, fromMock } = loadPatientRepository();
			const query = createQueryMock({
				data: {
					id: 'user-1',
					email: 'ana@example.com',
					first_name: 'Ana',
					last_name: 'Perez',
					patients: {
						id: 'pat-1',
						user_id: 'user-1',
						blood_type: 'O+'
					},
					roles: [{ name: 'patient' }]
				},
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const result = await repo.findWithUserDetails('user-1');

			expect(fromMock).toHaveBeenCalledWith('users');
			expect(query.eq).toHaveBeenCalledWith('id', 'user-1');
			expect(result).toEqual(expect.objectContaining({
				id: 'pat-1',
				user_id: 'user-1',
				email: 'ana@example.com',
				first_name: 'Ana',
				last_name: 'Perez',
				blood_type: 'O+'
			}));
			expect(result.patients).toBeUndefined();
		});

		test('updateByUserId updates patient record and returns updated data', async () => {
			const { repo, fromMock } = loadPatientRepository();
			const query = createQueryMock({ data: { id: 'pat-1', user_id: 'user-1', address: 'Calle 123' }, error: null });

			fromMock.mockReturnValueOnce(query);

			const updated = await repo.updateByUserId('user-1', { address: 'Avenida 456' });

			expect(fromMock).toHaveBeenCalledWith('patients');
			expect(query.update).toHaveBeenCalledWith(expect.objectContaining({
				address: 'Avenida 456',
				updated_at: expect.any(String)
			}));
			expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
			expect(updated).toEqual(expect.objectContaining({ user_id: 'user-1' }));
		});

		test('findAllWithUserInfo applies search, pagination, and flattens patient records', async () => {
			const { repo, fromMock } = loadPatientRepository();
			const query = createQueryMock({
				data: [
					{
						id: 'user-1',
						email: 'ana@example.com',
						first_name: 'Ana',
						last_name: 'Perez',
						patients: {
							id: 'pat-1',
							date_of_birth: '1990-01-01',
							insurance_plan: 'Básico'
						},
						roles: [{ name: 'patient' }]
					}
				],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const rows = await repo.findAllWithUserInfo({ limit: 10, offset: 0, search: 'ana' });

			expect(fromMock).toHaveBeenCalledWith('users');
			expect(query.or).toHaveBeenCalled();
			expect(query.limit).toHaveBeenCalledWith(10);
			expect(query.range).not.toHaveBeenCalled();
			expect(rows[0]).toEqual(expect.objectContaining({
				id: 'pat-1',
				first_name: 'Ana',
				last_name: 'Perez',
				date_of_birth: '1990-01-01',
				insurance_plan: 'Básico'
			}));
			expect(rows[0].patients).toBeUndefined();
		});

		test('getStats returns total, active and inactive patient counts', async () => {
			const { repo, fromMock } = loadPatientRepository();
			const query = createQueryMock({
				data: [
					{ id: 'user-1', is_active: true, roles: [{ name: 'patient' }] },
					{ id: 'user-2', is_active: false, roles: [{ name: 'patient' }] }
				],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const stats = await repo.getStats();

			expect(fromMock).toHaveBeenCalledWith('users');
			expect(stats).toEqual({ total: 2, active: 1, inactive: 1 });
		});
	});

	describe('CRUD layer - patient.routes', () => {
		test('registers authentication and role guards for patient endpoints', () => {
			const { requireRole, authMiddleware } = loadPatientRoutes();

			expect(authMiddleware).toHaveBeenCalledTimes(0);
			expect(requireRole).toHaveBeenCalledWith('admin');
			expect(requireRole).toHaveBeenCalledWith(['admin', 'doctor']);
			expect(requireRole).toHaveBeenCalledWith('patient');
		});

		test('contains patient CRUD and profile routes', () => {
			const { router } = loadPatientRoutes();
			const routePaths = router.stack
				.filter((layer) => layer.route)
				.map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);

			expect(routePaths).toEqual(
				expect.arrayContaining([
					'get /stats',
					'get /',
					'get /me',
					'post /with-user',
					'get /user/:userId',
					'get /:id',
					'put /me',
					'put /:id',
					'delete /:id'
				])
			);
		});
	});
});
