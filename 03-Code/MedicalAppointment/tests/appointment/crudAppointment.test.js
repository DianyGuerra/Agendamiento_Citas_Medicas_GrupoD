const { createQueryMock, loadAppointmentRepository, loadAppointmentRoutes } = require('./helpers');

describe('Appointment module unit tests - CRUD layer', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	describe('CRUD layer - appointment.repository', () => {
		test('updateStatus adds confirmed_at when status is CONFIRMED', async () => {
			const { repo, AppointmentStatus, updateMock } = loadAppointmentRepository();

			await repo.updateStatus('apt-1', AppointmentStatus.CONFIRMED);

			expect(updateMock).toHaveBeenCalledWith(
				'apt-1',
				expect.objectContaining({
					status_id: AppointmentStatus.CONFIRMED,
					confirmed_at: expect.any(String)
				})
			);
		});

		test('findWithDetails excludes cancelled appointments by default and loads patient details', async () => {
			const { repo, AppointmentStatus, fromMock } = loadAppointmentRepository();
			const appointmentQuery = createQueryMock({
				data: { id: 'apt-1', patient_user_id: 'pat-1' },
				error: null
			});
			const patientQuery = createQueryMock({
				data: { blood_type: 'O+', allergies: 'none' },
				error: null
			});

			fromMock.mockReturnValueOnce(appointmentQuery).mockReturnValueOnce(patientQuery);

			const result = await repo.findWithDetails('apt-1');

			expect(appointmentQuery.neq).toHaveBeenCalledWith('status_id', AppointmentStatus.CANCELLED);
			expect(result.patientDetails).toEqual({ blood_type: 'O+', allergies: 'none' });
		});

		test('findWithDetails does not apply cancelled filter when includeCancelled is true', async () => {
			const { repo, fromMock } = loadAppointmentRepository();
			const appointmentQuery = createQueryMock({
				data: { id: 'apt-2', patient_user_id: null },
				error: null
			});

			fromMock.mockReturnValueOnce(appointmentQuery);

			const result = await repo.findWithDetails('apt-2', true);

			expect(appointmentQuery.neq).not.toHaveBeenCalled();
			expect(result.id).toBe('apt-2');
		});

		test('countByStatusForDoctor aggregates status counts correctly', async () => {
			const { repo, fromMock } = loadAppointmentRepository();
			const query = createQueryMock({
				data: [
					{ appointment_status: { code: 'scheduled' } },
					{ appointment_status: { code: 'scheduled' } },
					{ appointment_status: { code: 'completed' } },
					{ appointment_status: { code: 'no_show' } }
				],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const counts = await repo.countByStatusForDoctor('doc-1');

			expect(counts).toEqual({
				scheduled: 2,
				confirmed: 0,
				completed: 1,
				cancelled: 0,
				no_show: 1
			});
		});

		test('findAll flattens appointment data for frontend', async () => {
			const { repo, fromMock } = loadAppointmentRepository();
			const query = createQueryMock({
				data: [
					{
						id: 'apt-1',
						scheduled_start: '2026-06-20T09:30:00.000Z',
						patient: { first_name: 'Ana', last_name: 'Perez', email: 'ana@example.com' },
						doctors: {
							id: 'doc-1',
							users: { first_name: 'Luis', last_name: 'Mora' },
							specialties: { id: 'sp-1', name: 'Cardiologia' }
						},
						appointment_status: { code: 'scheduled', label: 'Programada' },
						consultation_rooms: { name: 'Sala A', room_number: '101' },
						consultation_notes: [{ id: 'note-1', diagnosis: 'ok' }]
					}
				],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const rows = await repo.findAll({ filters: { doctor_id: 'doc-1' }, limit: 10, offset: 0 });

			expect(rows[0]).toEqual(
				expect.objectContaining({
					patient_name: 'Ana Perez',
					doctor_name: 'Luis Mora',
					specialty_name: 'Cardiologia',
					status_code: 'scheduled',
					room_name: 'Sala A'
				})
			);
		});
	});

	describe('CRUD layer - appointment.routes', () => {
		test('registers authentication and role guards for appointment endpoints', () => {
			const { router, requireRole, authMiddleware } = loadAppointmentRoutes();

			expect(router).toBeDefined();
			expect(authMiddleware).toHaveBeenCalledTimes(0);
			expect(requireRole).toHaveBeenCalledWith('admin');
			expect(requireRole).toHaveBeenCalledWith('patient');
			expect(requireRole).toHaveBeenCalledWith('doctor');
			expect(requireRole).toHaveBeenCalledWith(['doctor', 'admin']);
		});

		test('contains main CRUD and status routes', () => {
			const { router } = loadAppointmentRoutes();
			const routePaths = router.stack
				.filter((layer) => layer.route)
				.map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);

			expect(routePaths).toEqual(
				expect.arrayContaining([
					'get /',
					'get /:id',
					'post /',
					'put /:id',
					'patch /:id/status',
					'delete /:id'
				])
			);
		});
	});
});