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
	});
});
