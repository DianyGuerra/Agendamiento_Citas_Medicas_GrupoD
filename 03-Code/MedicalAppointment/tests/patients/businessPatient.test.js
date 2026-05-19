const {
	createQueryMock,
	loadValidationService,
	loadBillingCalculationService
} = require('./helpers');

describe('Business layer unit tests - Patient-related business-api', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	describe('validation.service', () => {
		test('validateAppointmentBooking rejects appointments in the past', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: false,
				doctorConflict: false
			});

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: '2000-01-01T10:00:00.000Z'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'scheduled_start',
						message: expect.stringContaining('pasado')
					})
				])
			);
		});

		test('validatePatientProfile detects missing patient information', async () => {
			const { service, fromMock } = loadValidationService();
			const query = createQueryMock({
				data: {
					id: 'patient-1',
					first_name: 'Ana',
					last_name: 'Lopez',
					email: 'ana@example.com',
					phone: null,
					patients: null
				},
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const result = await service.validatePatientProfile('patient-1');

			expect(result.isComplete).toBe(false);
			expect(result.completenessPercentage).toBeLessThan(100);
			expect(result.missingFields).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'phone' }),
					expect.objectContaining({ field: 'patient_record' })
				])
			);
		});
	});

	describe('billingCalculation.service', () => {
		test('calculateBilling returns specialty pricing and insurance discount', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			const appointmentQuery = createQueryMock({
				data: {
					id: 'apt-1',
					patient_user_id: 'patient-1',
					doctors: {
						id: 'doctor-1',
						specialties: {
							name: 'Cardiologia',
							consultation_fee: '120.00'
						}
					},
					scheduled_start: '2026-08-01T09:00:00.000Z',
					scheduled_end: '2026-08-01T09:30:00.000Z'
				},
				error: null
			});

			const patientQuery = createQueryMock({
				data: {
					insurance_plan: 'Salud Plus',
					insurance_number: 'INS-123'
				},
				error: null
			});

			const providerQuery = createQueryMock({
				data: {
					id: 'ins-1'
				},
				error: null
			});

			const discountQuery = createQueryMock({
				data: {
					coverage_percentage: '20'
				},
				error: null
			});

			fromMock.mockReturnValueOnce(appointmentQuery);
			fromMock.mockReturnValueOnce(patientQuery);
			fromMock.mockReturnValueOnce(providerQuery);
			fromMock.mockReturnValueOnce(discountQuery);

			const result = await service.calculateBilling('apt-1');

			expect(result.hasInsurance).toBe(true);
			expect(result.breakdown.baseAmount).toBe(120);
			expect(result.breakdown.subtotal).toBe(120);
			expect(result.breakdown.insuranceDiscountPercentage).toBe(20);
			expect(result.breakdown.totalAmount).toBe(96);
		});

		test('getPatientBillings maps billing rows for patient view', async () => {
			const { service, fromMock } = loadBillingCalculationService();
			const query = createQueryMock({
				data: [
					{
						id: 'bill-1',
						total_amount: '150.00',
						status: 'pending',
						appointments: {
							doctors: {
								users: { first_name: 'Juan', last_name: 'Perez' },
								specialties: { name: 'Dermatologia' }
							}
						}
					}
				],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const rows = await service.getPatientBillings('patient-1');

			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({
				id: 'bill-1',
				amount: '150.00',
				status_code: 'pending',
				status_label: 'Pending',
				doctor_first_name: 'Juan',
				doctor_last_name: 'Perez',
				specialty_name: 'Dermatologia'
			});
		});
	});
});
