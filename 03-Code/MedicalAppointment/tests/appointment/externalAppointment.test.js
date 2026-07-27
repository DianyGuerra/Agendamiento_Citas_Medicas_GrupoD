const { createQueryMock, loadReminderService } = require('./helpers');

describe('Appointment module unit tests - External layer', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	describe('External layer - reminder.service', () => {
		test('getAppointmentsForReminder returns appointments in reminder window', async () => {
			const { service, fromMock } = loadReminderService();
			const query = createQueryMock({
				data: [{ id: 'apt-1' }, { id: 'apt-2' }],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const appointments = await service.getAppointmentsForReminder(24);

			expect(appointments).toHaveLength(2);
			expect(query.in).toHaveBeenCalledWith('status_id', expect.any(Array));
		});

		test('getAppointmentsForReminder throws when supabase returns an error', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: new Error('window query failed') }));

			await expect(service.getAppointmentsForReminder(24)).rejects.toThrow('window query failed');
		});

		test('getAppointmentsForReminder returns an empty array when there is no data', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: null }));

			const appointments = await service.getAppointmentsForReminder();

			expect(appointments).toEqual([]);
		});

		test('sendReminder skips when patient email is missing', async () => {
			const { service, emailMock } = loadReminderService();

			const result = await service.sendReminder(
				{
					id: 'apt-1',
					scheduled_start: '2026-08-01T08:00:00.000Z',
					patient: { first_name: 'Ana', last_name: 'Perez' }
				},
				24
			);

			expect(result).toEqual({ success: false, reason: 'no_email' });
			expect(emailMock.sendAppointmentReminder).not.toHaveBeenCalled();
		});

		test('sendReminder sends email and logs reminder in DB', async () => {
			const { service, fromMock, emailMock } = loadReminderService();
			const insertQuery = createQueryMock({ data: [{ id: 'r1' }], error: null });

			fromMock.mockReturnValueOnce(insertQuery);
			emailMock.sendAppointmentReminder.mockResolvedValue();

			const result = await service.sendReminder(
				{
					id: 'apt-44',
					scheduled_start: '2026-08-01T08:00:00.000Z',
					patient: {
						email: 'ana@example.com',
						first_name: 'Ana',
						last_name: 'Perez'
					},
					doctors: {
						users: { first_name: 'Luis', last_name: 'Mora' },
						specialties: { name: 'Pediatria' }
					},
					consultation_rooms: { name: 'Sala C', room_number: '12' }
				},
				2
			);

			expect(result).toEqual({ success: true, appointmentId: 'apt-44' });
			expect(emailMock.sendAppointmentReminder).toHaveBeenCalledTimes(1);
			expect(fromMock).toHaveBeenCalledWith('reminders');
		});

		test('sendReminder falls back to defaults when doctor, room and patient names are missing', async () => {
			const { service, fromMock, emailMock } = loadReminderService();
			const insertQuery = createQueryMock({ data: [{ id: 'r2' }], error: null });

			fromMock.mockReturnValueOnce(insertQuery);
			emailMock.sendAppointmentReminder.mockResolvedValue();

			const result = await service.sendReminder(
				{
					id: 'apt-55',
					scheduled_start: '2026-08-01T08:00:00.000Z',
					patient: { email: 'sin-nombre@example.com' }
				},
				24
			);

			expect(result).toEqual({ success: true, appointmentId: 'apt-55' });
			expect(emailMock.sendAppointmentReminder).toHaveBeenCalledWith(expect.objectContaining({
				patientName: '',
				doctorName: 'Doctor',
				specialty: 'Medicina General',
				room: null
			}));
		});

		test('sendReminder builds room info when only the room name is present', async () => {
			const { service, fromMock, emailMock } = loadReminderService();
			const insertQuery = createQueryMock({ data: [{ id: 'r3' }], error: null });

			fromMock.mockReturnValueOnce(insertQuery);
			emailMock.sendAppointmentReminder.mockResolvedValue();

			await service.sendReminder(
				{
					id: 'apt-66',
					scheduled_start: '2026-08-01T08:00:00.000Z',
					patient: { email: 'ana@example.com', first_name: 'Ana', last_name: 'Perez' },
					consultation_rooms: { name: 'Sala D' }
				},
				24
			);

			expect(emailMock.sendAppointmentReminder).toHaveBeenCalledWith(expect.objectContaining({
				room: 'Sala D'
			}));
		});

		test('sendReminder builds room info when only the room number is present', async () => {
			const { service, fromMock, emailMock } = loadReminderService();
			const insertQuery = createQueryMock({ data: [{ id: 'r4' }], error: null });

			fromMock.mockReturnValueOnce(insertQuery);
			emailMock.sendAppointmentReminder.mockResolvedValue();

			await service.sendReminder(
				{
					id: 'apt-77',
					scheduled_start: '2026-08-01T08:00:00.000Z',
					patient: { email: 'ana@example.com', first_name: 'Ana', last_name: 'Perez' },
					consultation_rooms: { room_number: '303' }
				},
				24
			);

			expect(emailMock.sendAppointmentReminder).toHaveBeenCalledWith(expect.objectContaining({
				room: '303'
			}));
		});

		test('processReminders counts processed and sent reminders', async () => {
			const { service } = loadReminderService();

			jest.spyOn(service, 'getAppointmentsForReminder')
				.mockResolvedValueOnce([{ id: 'a1' }])
				.mockResolvedValueOnce([{ id: 'a2' }]);
			jest.spyOn(service, '_checkReminderSent')
				.mockResolvedValueOnce(false)
				.mockResolvedValueOnce(true);
			jest.spyOn(service, 'sendReminder').mockResolvedValue({ success: true });

			const result = await service.processReminders([24, 2]);

			expect(result.processed).toBe(2);
			expect(result.sent).toBe(1);
			expect(result.errors).toEqual([]);
		});

		test('_checkReminderSent returns true when at least one reminder exists', async () => {
			const { service, fromMock } = loadReminderService();
			const query = createQueryMock({ data: [{ id: 'r-1' }], error: null });

			fromMock.mockReturnValueOnce(query);

			const exists = await service._checkReminderSent('apt-1', 24);

			expect(exists).toBe(true);
		});

		test('_checkReminderSent returns false when no reminder exists in the window', async () => {
			const { service, fromMock } = loadReminderService();
			const query = createQueryMock({ data: [], error: null });

			fromMock.mockReturnValueOnce(query);

			const exists = await service._checkReminderSent('apt-1', 24);

			expect(exists).toBe(false);
		});

		test('processReminders records a per-appointment error when sending a reminder fails', async () => {
			const { service } = loadReminderService();

			jest.spyOn(service, 'getAppointmentsForReminder').mockResolvedValue([{ id: 'a1' }]);
			jest.spyOn(service, '_checkReminderSent').mockResolvedValue(false);
			jest.spyOn(service, 'sendReminder').mockRejectedValue(new Error('email provider down'));

			const result = await service.processReminders([24]);

			expect(result.processed).toBe(1);
			expect(result.sent).toBe(0);
			expect(result.errors).toEqual([
				{ appointmentId: 'a1', error: 'email provider down' }
			]);
		});

		test('processReminders records an hours-level error when fetching appointments fails', async () => {
			const { service } = loadReminderService();

			jest.spyOn(service, 'getAppointmentsForReminder').mockRejectedValue(new Error('db unreachable'));

			const result = await service.processReminders([2]);

			expect(result.processed).toBe(0);
			expect(result.sent).toBe(0);
			expect(result.errors).toEqual([
				{ hours: 2, error: 'db unreachable' }
			]);
		});

		test('processReminders uses default reminder hours when none are provided', async () => {
			const { service } = loadReminderService();

			const spy = jest.spyOn(service, 'getAppointmentsForReminder').mockResolvedValue([]);

			await service.processReminders();

			expect(spy).toHaveBeenNthCalledWith(1, 24);
			expect(spy).toHaveBeenNthCalledWith(2, 2);
		});

		test('createReminder inserts a pending reminder and returns the created row', async () => {
			const { service, fromMock } = loadReminderService();
			const query = createQueryMock({ data: { id: 'rem-1', send_status: 'pending' }, error: null });

			fromMock.mockReturnValueOnce(query);

			const result = await service.createReminder({
				appointment_id: 'apt-1',
				scheduled_send_time: '2026-08-01T08:00:00.000Z',
				recipient_email: 'ana@example.com',
				message_content: 'Recordatorio'
			});

			expect(fromMock).toHaveBeenCalledWith('reminders');
			expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
				appointment_id: 'apt-1',
				reminder_type: 'email',
				send_status: 'pending',
				recipient_email: 'ana@example.com',
				message_content: 'Recordatorio',
				retry_count: 0
			}));
			expect(result).toEqual({ id: 'rem-1', send_status: 'pending' });
		});

		test('createReminder honors an explicit reminder_type', async () => {
			const { service, fromMock } = loadReminderService();
			const query = createQueryMock({ data: { id: 'rem-2' }, error: null });

			fromMock.mockReturnValueOnce(query);

			await service.createReminder({
				appointment_id: 'apt-2',
				reminder_type: 'sms',
				scheduled_send_time: '2026-08-01T08:00:00.000Z',
				recipient_phone: '0999999999'
			});

			expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({
				reminder_type: 'sms',
				recipient_phone: '0999999999'
			}));
		});

		test('createReminder throws when supabase returns an error', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: new Error('insert failed') }));

			await expect(service.createReminder({ appointment_id: 'apt-1' })).rejects.toThrow('insert failed');
		});

		test('getReminderHistory returns reminders ordered by creation date', async () => {
			const { service, fromMock } = loadReminderService();
			const query = createQueryMock({ data: [{ id: 'rem-1' }, { id: 'rem-2' }], error: null });

			fromMock.mockReturnValueOnce(query);

			const history = await service.getReminderHistory('apt-1');

			expect(fromMock).toHaveBeenCalledWith('reminders');
			expect(query.eq).toHaveBeenCalledWith('appointment_id', 'apt-1');
			expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false });
			expect(history).toEqual([{ id: 'rem-1' }, { id: 'rem-2' }]);
		});

		test('getReminderHistory returns an empty array when there is no data', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: null }));

			const history = await service.getReminderHistory('apt-1');

			expect(history).toEqual([]);
		});

		test('getReminderHistory throws when supabase returns an error', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: new Error('select failed') }));

			await expect(service.getReminderHistory('apt-1')).rejects.toThrow('select failed');
		});

		test('cancelReminders cancels pending reminders and reports the count', async () => {
			const { service, fromMock } = loadReminderService();
			const query = createQueryMock({ data: [{ id: 'rem-1' }, { id: 'rem-2' }], error: null });

			fromMock.mockReturnValueOnce(query);

			const result = await service.cancelReminders('apt-1');

			expect(fromMock).toHaveBeenCalledWith('reminders');
			expect(query.update).toHaveBeenCalledWith({ send_status: 'cancelled' });
			expect(query.eq).toHaveBeenNthCalledWith(1, 'appointment_id', 'apt-1');
			expect(query.eq).toHaveBeenNthCalledWith(2, 'send_status', 'pending');
			expect(result).toEqual({ cancelled: 2 });
		});

		test('cancelReminders returns zero when nothing was cancelled', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: null }));

			const result = await service.cancelReminders('apt-1');

			expect(result).toEqual({ cancelled: 0 });
		});

		test('cancelReminders throws when supabase returns an error', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ data: null, error: new Error('update failed') }));

			await expect(service.cancelReminders('apt-1')).rejects.toThrow('update failed');
		});

		test('getPendingCount returns the pending reminder count', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ count: 7, error: null }));

			const count = await service.getPendingCount();

			expect(count).toBe(7);
		});

		test('getPendingCount defaults to zero when no count is returned', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ count: null, error: null }));

			const count = await service.getPendingCount();

			expect(count).toBe(0);
		});

		test('getPendingCount throws when supabase returns an error', async () => {
			const { service, fromMock } = loadReminderService();
			fromMock.mockReturnValueOnce(createQueryMock({ count: null, error: new Error('count failed') }));

			await expect(service.getPendingCount()).rejects.toThrow('count failed');
		});
	});
});
