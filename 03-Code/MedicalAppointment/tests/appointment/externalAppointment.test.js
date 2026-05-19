const { createQueryMock, loadReminderService } = require('./helpers');

describe('Appointment module unit tests - External reminders', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	test('getAppointmentsForReminder returns appointments from supabase', async () => {
		const { service, fromMock } = loadReminderService();
		const sample = [{ id: 'apt-1', scheduled_start: '2026-05-20T10:00:00.000Z', patient: { email: 'a@e.com' } }];
		fromMock.mockReturnValueOnce(createQueryMock({ data: sample, error: null }));

		const rows = await service.getAppointmentsForReminder(24);
		expect(rows).toEqual(sample);
	});

	test('sendReminder sends email and inserts reminder record', async () => {
		const { service, fromMock, emailMock } = loadReminderService();

		const appointment = {
			id: 'apt-1',
			scheduled_start: '2026-05-20T10:00:00.000Z',
			patient: { email: 'p@example.com', first_name: 'P', last_name: 'Q' },
			doctors: { users: { first_name: 'Doc', last_name: 'Tor' }, specialties: { name: 'Cardio' } },
			consultation_rooms: { name: 'Sala A', room_number: '101' }
		};

		// First call to supabase (insert) - return success
		fromMock.mockReturnValueOnce(createQueryMock({ data: { id: 'rem-1' }, error: null }));

		const res = await service.sendReminder(appointment, 24);

		expect(emailMock.sendAppointmentReminder).toHaveBeenCalledWith(expect.objectContaining({
			patientEmail: 'p@example.com',
			patientName: 'P Q',
			doctorName: 'Doc Tor',
			specialty: 'Cardio',
			hoursUntil: 24
		}));

		expect(res).toEqual({ success: true, appointmentId: 'apt-1' });
	});

	test('processReminders iterates hours and sends reminders when not sent', async () => {
		const { service } = loadReminderService();
		const appointment = { id: 'apt-1' };

		jest.spyOn(service, 'getAppointmentsForReminder').mockResolvedValueOnce([appointment]);
		jest.spyOn(service, '_checkReminderSent').mockResolvedValue(false);
		jest.spyOn(service, 'sendReminder').mockResolvedValue({ success: true });

		const results = await service.processReminders([1]);

		expect(service.getAppointmentsForReminder).toHaveBeenCalledWith(1);
		expect(service._checkReminderSent).toHaveBeenCalledWith('apt-1', 1);
		expect(service.sendReminder).toHaveBeenCalledWith(appointment, 1);
		expect(results.sent).toBe(1);
	});

	test('createReminder, getReminderHistory, cancelReminders and getPendingCount work with supabase', async () => {
		const { service, fromMock } = loadReminderService();

		fromMock
			.mockReturnValueOnce(createQueryMock({ data: { id: 'rem-1' }, error: null })) // createReminder
			.mockReturnValueOnce(createQueryMock({ data: [{ id: 'rem-1' }], error: null })) // getReminderHistory
			.mockReturnValueOnce(createQueryMock({ data: [{ id: 'rem-1' }], error: null })) // cancelReminders
			.mockReturnValueOnce(createQueryMock({ count: 5, error: null })); // getPendingCount

		const created = await service.createReminder({ appointment_id: 'apt-1', recipient_email: 'a@e.com', scheduled_send_time: '2026-05-20T10:00:00.000Z' });
		expect(created).toEqual({ id: 'rem-1' });

		const history = await service.getReminderHistory('apt-1');
		expect(history).toEqual([{ id: 'rem-1' }]);

		const cancelled = await service.cancelReminders('apt-1');
		expect(cancelled).toEqual({ cancelled: 1 });

		const pending = await service.getPendingCount();
		expect(pending).toBe(5);
	});

	test('_checkReminderSent returns true when reminders exist', async () => {
		const { service, fromMock } = loadReminderService();
		fromMock.mockReturnValueOnce(createQueryMock({ data: [{ id: 'r1' }], error: null }));

		const sent = await service._checkReminderSent('apt-1', 24);
		expect(sent).toBe(true);
	});
});
