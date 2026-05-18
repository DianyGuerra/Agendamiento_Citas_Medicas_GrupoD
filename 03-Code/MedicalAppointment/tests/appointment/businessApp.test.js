const {
	createQueryMock,
	loadSchedulingService,
	loadSchedulingController,
	invokeHandler
} = require('./helpers');

describe('Appointment module unit tests - Business layer', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	describe('Business layer - scheduling.service', () => {
		test('scheduleAppointment validates required fields', async () => {
			const { service } = loadSchedulingService();

			await expect(
				service.scheduleAppointment({ doctor_id: 'doc-1', scheduled_start: '2026-07-01T10:00:00.000Z' })
			).rejects.toThrow('Campos requeridos faltantes');
		});

		test('scheduleAppointment throws when slot is unavailable', async () => {
			const { service, availabilityMock } = loadSchedulingService();

			jest.spyOn(service, '_verifyDoctor').mockResolvedValue({ id: 'doc-1', active: true });
			availabilityMock.isSlotAvailable.mockResolvedValue(false);

			await expect(
				service.scheduleAppointment({
					patient_user_id: 'pat-1',
					doctor_id: 'doc-1',
					scheduled_start: '2026-07-01T10:00:00.000Z',
					reason: 'control'
				})
			).rejects.toThrow(/El horario seleccionado no est[aá] disponible/);
		});

		test('scheduleAppointment creates appointment and triggers confirmation flow', async () => {
			const { service, availabilityMock, fromMock } = loadSchedulingService();
			const insertQuery = createQueryMock({
				data: {
					id: 'apt-100',
					scheduled_start: '2026-07-10T11:00:00.000Z',
					reason: 'Revision',
					patient: { email: 'ana@example.com', first_name: 'Ana', last_name: 'Perez' },
					doctors: {
						users: { first_name: 'Luis', last_name: 'Mora' },
						specialties: { name: 'Medicina General' }
					},
					consultation_rooms: { name: 'Sala B', room_number: '202' }
				},
				error: null
			});

			fromMock.mockReturnValueOnce(insertQuery);
			jest.spyOn(service, '_verifyDoctor').mockResolvedValue({ id: 'doc-1', active: true });
			jest.spyOn(service, '_checkPatientConflict').mockResolvedValue();
			jest.spyOn(service, '_getStatusId').mockResolvedValue(1);
			jest.spyOn(service, '_sendConfirmationEmail').mockResolvedValue();
			availabilityMock.isSlotAvailable.mockResolvedValue(true);

			const appointment = await service.scheduleAppointment({
				patient_user_id: 'pat-1',
				doctor_id: 'doc-1',
				scheduled_start: '2026-07-10T11:00:00.000Z',
				reason: 'Revision'
			});

			expect(fromMock).toHaveBeenCalledWith('appointments');
			expect(appointment.id).toBe('apt-100');
			expect(service._sendConfirmationEmail).toHaveBeenCalled();
		});

		test('_getStatusId falls back to hardcoded IDs when status lookup fails', async () => {
			const { service, fromMock } = loadSchedulingService();
			const query = createQueryMock({ data: null, error: { message: 'lookup failed' } });

			fromMock.mockReturnValueOnce(query);

			const id = await service._getStatusId('confirmed');

			expect(id).toBe(2);
		});

		test('getAppointmentsByDateRange filters result by status code', async () => {
			const { service, fromMock } = loadSchedulingService();
			const query = createQueryMock({
				data: [
					{ id: 'apt-1', appointment_status: { code: 'scheduled' } },
					{ id: 'apt-2', appointment_status: { code: 'confirmed' } }
				],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const rows = await service.getAppointmentsByDateRange({ status: 'scheduled' });

			expect(rows).toHaveLength(1);
			expect(rows[0].id).toBe('apt-1');
		});

		test('markPastAppointmentsAsNoShow returns number of updated rows', async () => {
			const { service, fromMock } = loadSchedulingService();
			const query = createQueryMock({ data: [{ id: 'a1' }, { id: 'a2' }], error: null });

			jest.spyOn(service, '_getStatusId')
				.mockResolvedValueOnce(6)
				.mockResolvedValueOnce(1)
				.mockResolvedValueOnce(2);
			fromMock.mockReturnValueOnce(query);

			const updated = await service.markPastAppointmentsAsNoShow();

			expect(updated).toBe(2);
		});
	});

	describe('Business layer - scheduling.controller', () => {
		test('bookAppointment calls service with patient user from token', async () => {
			const { controller, serviceMock, responseBuilderMock } = loadSchedulingController();
			serviceMock.scheduleAppointment.mockResolvedValue({ id: 'apt-1' });

			const req = {
				user: { id: 'pat-1' },
				body: {
					doctor_id: 'doc-1',
					scheduled_start: '2026-08-20T09:00:00.000Z',
					reason: 'control'
				}
			};

			await invokeHandler(controller.bookAppointment, req, {});

			expect(serviceMock.scheduleAppointment).toHaveBeenCalledWith({
				patient_user_id: 'pat-1',
				doctor_id: 'doc-1',
				scheduled_start: '2026-08-20T09:00:00.000Z',
				reason: 'control'
			});
			expect(responseBuilderMock.created).toHaveBeenCalled();
		});

		test('rescheduleAppointment validates scheduled_start and sends error to next', async () => {
			const { controller } = loadSchedulingController();
			const req = {
				params: { appointmentId: 'apt-1' },
				body: {},
				user: { id: 'pat-1' }
			};

			const next = await invokeHandler(controller.rescheduleAppointment, req, {});

			expect(next).toHaveBeenCalledTimes(1);
			expect(next.mock.calls[0][0].message).toContain('scheduled_start');
		});

		test('rescheduleAppointment calls service and responds success', async () => {
			const { controller, serviceMock, responseBuilderMock } = loadSchedulingController();
			serviceMock.rescheduleAppointment.mockResolvedValue({ id: 'apt-1' });

			const req = {
				params: { appointmentId: 'apt-1' },
				body: { scheduled_start: '2026-08-21T10:00:00.000Z' },
				user: { id: 'pat-1' }
			};

			await invokeHandler(controller.rescheduleAppointment, req, {});

			expect(serviceMock.rescheduleAppointment).toHaveBeenCalledWith(
				'apt-1',
				{ scheduled_start: '2026-08-21T10:00:00.000Z' },
				'pat-1'
			);
			expect(responseBuilderMock.success).toHaveBeenCalled();
		});

		test('cancelAppointment and confirmAppointment delegate to service', async () => {
			const { controller, serviceMock, responseBuilderMock } = loadSchedulingController();
			serviceMock.cancelAppointment.mockResolvedValue({ message: 'cancelled' });
			serviceMock.confirmAppointment.mockResolvedValue({ message: 'confirmed' });

			await invokeHandler(
				controller.cancelAppointment,
				{ params: { appointmentId: 'apt-9' }, body: { reason: 'x' }, user: { id: 'pat-1' } },
				{}
			);
			await invokeHandler(controller.confirmAppointment, { params: { appointmentId: 'apt-9' } }, {});

			expect(serviceMock.cancelAppointment).toHaveBeenCalledWith('apt-9', 'x', 'pat-1');
			expect(serviceMock.confirmAppointment).toHaveBeenCalledWith('apt-9');
			expect(responseBuilderMock.success).toHaveBeenCalledTimes(2);
		});

		test('consultation lifecycle endpoints call service methods', async () => {
			const { controller, serviceMock } = loadSchedulingController();
			serviceMock.startConsultation.mockResolvedValue({ message: 'started' });
			serviceMock.completeConsultation.mockResolvedValue({ message: 'completed' });
			serviceMock.markNoShow.mockResolvedValue({ message: 'no_show' });

			await invokeHandler(
				controller.startConsultation,
				{ params: { appointmentId: 'apt-7' }, body: { roomId: 'room-1' } },
				{}
			);
			await invokeHandler(controller.completeConsultation, { params: { appointmentId: 'apt-7' } }, {});
			await invokeHandler(controller.markNoShow, { params: { appointmentId: 'apt-7' } }, {});

			expect(serviceMock.startConsultation).toHaveBeenCalledWith('apt-7', 'room-1');
			expect(serviceMock.completeConsultation).toHaveBeenCalledWith('apt-7');
			expect(serviceMock.markNoShow).toHaveBeenCalledWith('apt-7');
		});

		test('statistics, confirm-public and cleanup endpoints return success', async () => {
			const { controller, serviceMock, responseBuilderMock } = loadSchedulingController();
			serviceMock.getDoctorStatistics.mockResolvedValue({ total: 5 });
			serviceMock.confirmAppointmentPublic.mockResolvedValue({ message: 'ok' });
			serviceMock.markPastAppointmentsAsNoShow.mockResolvedValue(3);

			await invokeHandler(
				controller.getDoctorStatistics,
				{ params: { doctorId: 'doc-1' }, query: {} },
				{}
			);
			await invokeHandler(
				controller.confirmAppointmentPublic,
				{ params: { appointmentId: 'apt-1' }, query: { token: 't' } },
				{}
			);
			await invokeHandler(controller.cleanupPastAppointments, { params: {}, query: {} }, {});

			expect(serviceMock.getDoctorStatistics).toHaveBeenCalledWith('doc-1', expect.any(String), expect.any(String));
			expect(serviceMock.confirmAppointmentPublic).toHaveBeenCalledWith('apt-1', 't');
			expect(serviceMock.markPastAppointmentsAsNoShow).toHaveBeenCalledTimes(1);
			expect(responseBuilderMock.success).toHaveBeenCalledTimes(3);
		});
	});
});