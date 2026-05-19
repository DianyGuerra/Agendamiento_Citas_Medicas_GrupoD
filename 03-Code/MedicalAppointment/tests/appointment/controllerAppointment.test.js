const { createQueryMock, loadAppointmentController, invokeHandler } = require('./helpers');

describe('Appointment module unit tests - CRUD controller', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
		jest.spyOn(console, 'log').mockImplementation(() => {});
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('Appointment controller - read flows', () => {
		test('getAll maps filters and pagination to repository calls', async () => {
			const { controller, appointmentRepository, responseBuilderMock, parsePaginationQuery, createPagination, AppointmentStatus } = loadAppointmentController();
			appointmentRepository.findAll.mockResolvedValue([{ id: 'apt-1' }]);
			appointmentRepository.count.mockResolvedValue(12);
			parsePaginationQuery.mockReturnValueOnce({ page: 2, limit: 5, offset: 5 });

			const req = {
				query: {
					status: 'confirmed',
					doctorId: 'doc-1',
					patientId: 'pat-1'
				}
			};

			await invokeHandler(controller.getAll, req, {});

			expect(parsePaginationQuery).toHaveBeenCalledWith(req.query);
			expect(appointmentRepository.findAll).toHaveBeenCalledWith({
				limit: 5,
				offset: 5,
				filters: {
					status_id: AppointmentStatus.CONFIRMED,
					doctor_id: 'doc-1',
					patient_user_id: 'pat-1'
				}
			});
			expect(appointmentRepository.count).toHaveBeenCalledWith({
				status_id: AppointmentStatus.CONFIRMED,
				doctor_id: 'doc-1',
				patient_user_id: 'pat-1'
			});
			expect(createPagination).toHaveBeenCalledWith(12, 2, 5);
			expect(responseBuilderMock.paginated).toHaveBeenCalledWith({}, [{ id: 'apt-1' }], {
				total: 12,
				page: 2,
				limit: 5,
				pages: 3
			});
		});

		test('getById loads appointments with and without cancelled records', async () => {
			const { controller, appointmentRepository, responseBuilderMock } = loadAppointmentController();
			appointmentRepository.findWithDetails.mockResolvedValue({ id: 'apt-1' });

			await invokeHandler(controller.getById, { params: { id: 'apt-1' }, query: {} }, {});
			await invokeHandler(controller.getById, { params: { id: 'apt-1' }, query: { includeCancelled: 'true' } }, {});

			expect(appointmentRepository.findWithDetails).toHaveBeenNthCalledWith(1, 'apt-1', false);
			expect(appointmentRepository.findWithDetails).toHaveBeenNthCalledWith(2, 'apt-1', true);
			expect(responseBuilderMock.success).toHaveBeenCalledTimes(2);
		});

		test('getUnbilled returns completed appointments without billings', async () => {
			const { controller, fromMock, responseBuilderMock } = loadAppointmentController();
			fromMock
				.mockReturnValueOnce(createQueryMock({
					data: [
						{ appointment_id: 'apt-1', status_code: 'completed' },
						{ appointment_id: 'apt-2', status_code: 'completed' }
					],
					error: null
				}))
				.mockReturnValueOnce(createQueryMock({
					data: [{ appointment_id: 'apt-2' }],
					error: null
				}));

			await invokeHandler(controller.getUnbilled, {}, {});

			expect(responseBuilderMock.success).toHaveBeenCalledWith({}, [{ appointment_id: 'apt-1', status_code: 'completed' }]);
		});

		test('getByPatient and getByPatientId flatten nested appointment data', async () => {
			const { controller, appointmentRepository, responseBuilderMock } = loadAppointmentController();
			appointmentRepository.findByPatient.mockResolvedValue([
				{
					id: 'apt-1',
					doctor_id: 'doc-1',
					doctors: {
						users: { first_name: 'Luis', last_name: 'Mora' },
						specialties: { name: 'Cardiologia' }
					},
					appointment_status: { code: 'confirmed', label: 'Confirmada' },
					consultation_rooms: { name: 'Sala A', room_number: '101' }
				}
			]);

			await invokeHandler(controller.getByPatient, { user: { id: 'pat-1' }, query: {} }, {});
			await invokeHandler(controller.getByPatientId, { params: { patientUserId: 'pat-2' }, query: {} }, {});

			expect(appointmentRepository.findByPatient).toHaveBeenNthCalledWith(1, 'pat-1', expect.objectContaining({
				upcoming: false,
				limit: 100,
				offset: 0
			}));
			expect(appointmentRepository.findByPatient).toHaveBeenNthCalledWith(2, 'pat-2', expect.objectContaining({
				upcoming: false,
				limit: 50,
				offset: 0
			}));
			expect(responseBuilderMock.success).toHaveBeenNthCalledWith(1, {}, [
				expect.objectContaining({
					doctor_first_name: 'Luis',
					doctor_last_name: 'Mora',
					specialty_name: 'Cardiologia',
					status_code: 'confirmed',
					location: 'Sala A - Sala 101'
				})
			]);
			expect(responseBuilderMock.success).toHaveBeenNthCalledWith(2, {}, [
				expect.objectContaining({
					doctor_first_name: 'Luis',
					doctor_last_name: 'Mora',
					specialty_name: 'Cardiologia',
					status_code: 'confirmed',
					location: 'Sala A'
				})
			]);
		});

		test('getByDoctor resolves the doctor user and returns appointments', async () => {
			const { controller, doctorRepository, appointmentRepository, responseBuilderMock } = loadAppointmentController();
			doctorRepository.findByUserId.mockResolvedValue({ id: 'doc-1' });
			appointmentRepository.findByDoctor.mockResolvedValue([{ id: 'apt-1' }]);

			await invokeHandler(controller.getByDoctor, { user: { id: 'user-doc-1' }, query: { date: '2026-05-20' } }, {});

			expect(doctorRepository.findByUserId).toHaveBeenCalledWith('user-doc-1');
			expect(appointmentRepository.findByDoctor).toHaveBeenCalledWith('doc-1', expect.objectContaining({
				date: '2026-05-20',
				limit: 20,
				offset: 0
			}));
			expect(responseBuilderMock.success).toHaveBeenCalledWith({}, [{ id: 'apt-1' }]);
		});
	});

	describe('Appointment controller - write flows', () => {
		test('create validates doctor, computes end time and triggers confirmation flow', async () => {
			const { controller, doctorRepository, appointmentRepository, responseBuilderMock, AppointmentStatus } = loadAppointmentController();
			doctorRepository.findById.mockResolvedValue({ id: 'doc-1', active: true });
			appointmentRepository.create.mockResolvedValue({ id: 'apt-100' });
			jest.spyOn(controller, '_sendConfirmationEmail').mockResolvedValue();

			const req = {
				user: { id: 'pat-1' },
				body: {
					doctor_id: 'doc-1',
					scheduled_start: '2026-07-10T11:00:00.000Z',
					reason: 'Control',
					duration_minutes: 45
				}
			};

			await invokeHandler(controller.create, req, {});

			expect(appointmentRepository.create).toHaveBeenCalledWith({
				patient_user_id: 'pat-1',
				doctor_id: 'doc-1',
				scheduled_start: '2026-07-10T11:00:00.000Z',
				scheduled_end: '2026-07-10T11:45:00.000Z',
				status_id: AppointmentStatus.SCHEDULED,
				reason: 'Control',
				created_by_user_id: 'pat-1'
			});
			expect(controller._sendConfirmationEmail).toHaveBeenCalledWith(
				'apt-100',
				'pat-1',
				'doc-1',
				expect.any(Date),
				'Control'
			);
			expect(responseBuilderMock.created).toHaveBeenCalledWith({}, { id: 'apt-100' }, 'Cita creada exitosamente');
		});

		test('update, partialUpdate, confirm and checkIn mutate appointment state', async () => {
			const { controller, appointmentRepository, doctorRepository, consultationRoomRepository, responseBuilderMock, createAuditLog, AppointmentStatus } = loadAppointmentController();
			appointmentRepository.findById.mockResolvedValue({
				id: 'apt-1',
				status_id: AppointmentStatus.SCHEDULED,
				reason: 'old',
				room_id: null,
				doctor_id: 'doc-1',
				consultation_room_id: null,
				checked_in_at: null
			});
			appointmentRepository.update.mockResolvedValue({ id: 'apt-1', reason: 'new', room_id: 'room-1', consultation_room_id: 'consult-1' });
			appointmentRepository.updateStatus.mockResolvedValue({ id: 'apt-1', status_id: AppointmentStatus.CONFIRMED });
			doctorRepository.findById.mockResolvedValue({ id: 'doc-2', active: true });
			consultationRoomRepository.findById.mockResolvedValue({ id: 'room-2', is_available: true });

			await invokeHandler(controller.update, {
				params: { id: 'apt-1' },
				user: { id: 'admin-1' },
				body: { reason: 'new', room_id: 'room-1', consultation_room_id: 'consult-1' }
			}, {});

			await invokeHandler(controller.partialUpdate, {
				params: { id: 'apt-1' },
				user: { id: 'admin-1' },
				body: { doctor_id: 'doc-2', consultation_room_id: 'room-2', room_id: 'room-9' }
			}, {});

			await invokeHandler(controller.confirm, {
				params: { id: 'apt-1' },
				user: { id: 'admin-1' }
			}, {});

			await invokeHandler(controller.checkIn, {
				params: { id: 'apt-1' },
				user: { id: 'admin-1' }
			}, {});

			expect(appointmentRepository.update).toHaveBeenNthCalledWith(1, 'apt-1', {
				reason: 'new',
				room_id: 'room-1',
				consultation_room_id: 'consult-1'
			});
			expect(appointmentRepository.update).toHaveBeenNthCalledWith(2, 'apt-1', {
				doctor_id: 'doc-2',
				consultation_room_id: 'room-2',
				room_id: 'room-9'
			});
			expect(appointmentRepository.update).toHaveBeenNthCalledWith(3, 'apt-1', {
				checked_in_at: expect.any(String)
			});
			expect(appointmentRepository.updateStatus).toHaveBeenCalledWith('apt-1', AppointmentStatus.CONFIRMED);
			expect(createAuditLog).toHaveBeenCalled();
			expect(responseBuilderMock.success).toHaveBeenCalledTimes(4);
			expect(doctorRepository.findById).toHaveBeenCalledWith('doc-2');
			expect(consultationRoomRepository.findById).toHaveBeenCalledWith('consult-1');
		});

		test('updateStatus can auto-generate billing for completed appointments', async () => {
			const { controller, appointmentRepository, fromMock, generateBillingRecord, responseBuilderMock, AppointmentStatus } = loadAppointmentController();
			appointmentRepository.findById.mockResolvedValue({ id: 'apt-1', status_id: AppointmentStatus.SCHEDULED });
			appointmentRepository.updateStatus.mockResolvedValue({ id: 'apt-1', status_id: AppointmentStatus.COMPLETED });
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: null }));
			generateBillingRecord.mockResolvedValue({ id: 'bill-1', invoice_number: 'INV-1' });

			await invokeHandler(controller.updateStatus, {
				params: { id: 'apt-1' },
				user: { id: 'doctor-1' },
				body: { status_id: AppointmentStatus.COMPLETED }
			}, {});

			expect(appointmentRepository.updateStatus).toHaveBeenCalledWith('apt-1', AppointmentStatus.COMPLETED);
			expect(generateBillingRecord).toHaveBeenCalledWith('apt-1');
			expect(responseBuilderMock.success).toHaveBeenCalledWith(
				{},
				expect.objectContaining({
					billing_generated: true,
					billing_id: 'bill-1'
				}),
				200,
				'Estado actualizado y factura generada'
			);
		});

		test('getUpcoming respects patient and doctor roles', async () => {
			const { controller, appointmentRepository, doctorRepository, responseBuilderMock, AppointmentStatus } = loadAppointmentController();
			appointmentRepository.findByPatient.mockResolvedValue([{ id: 'apt-patient' }]);
			appointmentRepository.findByDoctor.mockResolvedValue([{ id: 'apt-doctor' }]);
			doctorRepository.findByUserId.mockResolvedValue({ id: 'doc-1' });

			await invokeHandler(controller.getUpcoming, {
				user: { id: 'pat-1', role: 'patient' },
				query: { limit: '3', days: '10' }
			}, {});

			await invokeHandler(controller.getUpcoming, {
				user: { id: 'doc-user-1', role: 'doctor' },
				query: { limit: '4', days: '7' }
			}, {});

			expect(appointmentRepository.findByPatient).toHaveBeenCalledWith('pat-1', {
				upcoming: true,
				limit: 3
			});
			expect(doctorRepository.findByUserId).toHaveBeenCalledWith('doc-user-1');
			expect(appointmentRepository.findByDoctor).toHaveBeenCalledWith('doc-1', expect.objectContaining({
				status: AppointmentStatus.SCHEDULED,
				limit: 4
			}));
			expect(responseBuilderMock.success).toHaveBeenNthCalledWith(1, {}, [{ id: 'apt-patient' }]);
			expect(responseBuilderMock.success).toHaveBeenNthCalledWith(2, {}, [{ id: 'apt-doctor' }]);
		});

		test('cancel and delete soft delete appointments and send cancellation email', async () => {
			const { controller, appointmentRepository, responseBuilderMock, AppointmentStatus } = loadAppointmentController();
			appointmentRepository.findWithDetails
				.mockResolvedValueOnce({
					id: 'apt-1',
					status_id: AppointmentStatus.SCHEDULED,
					patient_user_id: 'pat-1',
					doctor_id: 'doc-1',
					scheduled_start: '2026-07-10T11:00:00.000Z'
				})
				.mockResolvedValueOnce({
					id: 'apt-2',
					status_id: AppointmentStatus.SCHEDULED,
					patient_user_id: 'pat-2',
					doctor_id: 'doc-2',
					scheduled_start: '2026-07-11T11:00:00.000Z'
				});
			appointmentRepository.softDelete.mockResolvedValue(true);
			jest.spyOn(controller, '_sendCancellationEmail').mockResolvedValue();

			await invokeHandler(controller.cancel, {
				params: { id: 'apt-1' },
				body: { reason: 'Cambio de horario' },
				user: { id: 'admin-1' }
			}, {});

			await invokeHandler(controller.delete, {
				params: { id: 'apt-2' },
				body: { reason: 'Cancelada por el usuario' },
				user: { id: 'pat-2' }
			}, {});

			expect(appointmentRepository.softDelete).toHaveBeenCalledTimes(2);
			expect(controller._sendCancellationEmail).toHaveBeenCalledTimes(2);
			expect(responseBuilderMock.success).toHaveBeenCalledTimes(2);
		});
	});

	describe('Appointment controller - private email helpers', () => {
		test('confirmation and cancellation emails are built from supabase data', async () => {
			const { controller, fromMock, emailServiceMock } = loadAppointmentController();

			fromMock
				.mockReturnValueOnce(createQueryMock({
					data: { email: 'ana@example.com', first_name: 'Ana', last_name: 'Perez' },
					error: null
				}))
				.mockReturnValueOnce(createQueryMock({
					data: {
						users: { first_name: 'Luis', last_name: 'Mora' },
						specialties: { name: 'Cardiologia' }
					},
					error: null
				}))
				.mockReturnValueOnce(createQueryMock({
					data: {
						consultation_rooms: { name: 'Sala A', room_number: '101' }
					},
					error: null
				}));

			await controller._sendConfirmationEmail(
				'apt-1',
				'pat-1',
				'doc-1',
				'2026-07-10T11:00:00.000Z',
				'Control'
			);

			expect(emailServiceMock.sendAppointmentConfirmation).toHaveBeenCalledWith(expect.objectContaining({
				patientEmail: 'ana@example.com',
				patientName: 'Ana Perez',
				doctorName: 'Luis Mora',
				specialty: 'Cardiologia',
				room: 'Sala A 101',
				reason: 'Control'
			}));

			fromMock
				.mockReturnValueOnce(createQueryMock({
					data: { email: 'juan@example.com', first_name: 'Juan', last_name: 'Lopez' },
					error: null
				}))
				.mockReturnValueOnce(createQueryMock({
					data: {
						users: { first_name: 'Luis', last_name: 'Mora' },
						specialties: { name: 'Cardiologia' }
					},
					error: null
				}));

			await controller._sendCancellationEmail(
				{
					patient_user_id: 'pat-2',
					doctor_id: 'doc-2',
					scheduled_start: '2026-07-11T11:00:00.000Z'
				},
				'Cancelada por el usuario'
			);

			expect(emailServiceMock.sendAppointmentCancellation).toHaveBeenCalledWith(expect.objectContaining({
				patientEmail: 'juan@example.com',
				patientName: 'Juan Lopez',
				doctorName: 'Luis Mora',
				specialty: 'Cardiologia',
				reason: 'Cancelada por el usuario'
			}));
		});
	});
});
