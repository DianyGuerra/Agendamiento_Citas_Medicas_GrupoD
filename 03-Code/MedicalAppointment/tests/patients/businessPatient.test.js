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

		test('validateScheduleConfiguration rejects invalid schedule times', () => {
			const { service } = loadValidationService();

			const result = service.validateScheduleConfiguration({
				day_of_week: 'funday',
				start_time: '09:00',
				end_time: '08:00'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'day_of_week' }),
					expect.objectContaining({ field: 'end_time' })
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

		test('calculateBilling uses default pricing and no insurance when patient has no plan', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			const appointmentQuery = createQueryMock({
				data: {
					id: 'apt-2',
					patient_user_id: 'patient-2',
					doctors: {
						id: 'doctor-2',
						specialties: null
					},
					scheduled_start: '2026-08-01T09:00:00.000Z',
					scheduled_end: '2026-08-01T11:00:00.000Z'
				},
				error: null
			});

			const patientQuery = createQueryMock({
				data: {
					insurance_plan: null,
					insurance_number: null
				},
				error: null
			});

			fromMock.mockReturnValueOnce(appointmentQuery);
			fromMock.mockReturnValueOnce(patientQuery);

			const result = await service.calculateBilling('apt-2');

			expect(result.hasInsurance).toBe(false);
			expect(result.breakdown.baseAmount).toBe(50);
			expect(result.breakdown.durationMinutes).toBe(120);
			expect(result.breakdown.durationMultiplier).toBe(1.5);
			expect(result.breakdown.insuranceDiscountPercentage).toBe(0);
			expect(result.breakdown.totalAmount).toBe(75);
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

		test('getPatientBillings returns empty array when no billings exist', async () => {
			const { service, fromMock } = loadBillingCalculationService();
			const query = createQueryMock({
				data: [],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const rows = await service.getPatientBillings('patient-1');

			expect(rows).toHaveLength(0);
			expect(Array.isArray(rows)).toBe(true);
		});

		test('calculateBilling handles appointment with null doctor specialties', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			const appointmentQuery = createQueryMock({
				data: {
					id: 'apt-3',
					patient_user_id: 'patient-3',
					doctors: {
						id: 'doctor-3',
						specialties: null
					},
					scheduled_start: '2026-08-01T09:00:00.000Z',
					scheduled_end: '2026-08-01T09:30:00.000Z'
				},
				error: null
			});

			const patientQuery = createQueryMock({
				data: {
					insurance_plan: null,
					insurance_number: null
				},
				error: null
			});

			fromMock.mockReturnValueOnce(appointmentQuery);
			fromMock.mockReturnValueOnce(patientQuery);

			const result = await service.calculateBilling('apt-3');

			expect(result.hasInsurance).toBe(false);
			expect(result.breakdown.baseAmount).toBe(50);
		});

		test('generateBillingRecord creates billing record with invoice number', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			// First call for calculateBilling
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
				data: { id: 'ins-1' },
				error: null
			});

			const discountQuery = createQueryMock({
				data: { coverage_percentage: '20' },
				error: null
			});

			// Second call for getting appointment details
			const appointmentQuery2 = createQueryMock({
				data: {
					patient_user_id: 'patient-1',
					doctors: { id: 'doctor-1' }
				},
				error: null
			});

			// Third call for checking existing billing
			const existingBillingQuery = createQueryMock({
				data: null,
				error: null
			});

			// Fourth call for inserting new billing
			const insertBillingQuery = createQueryMock({
				data: {
					id: 'bill-1',
					appointment_id: 'apt-1',
					patient_user_id: 'patient-1',
					total_amount: '96',
					invoice_number: 'INV-20260801-1234'
				},
				error: null
			});

			fromMock
				.mockReturnValueOnce(appointmentQuery)
				.mockReturnValueOnce(patientQuery)
				.mockReturnValueOnce(providerQuery)
				.mockReturnValueOnce(discountQuery)
				.mockReturnValueOnce(appointmentQuery2)
				.mockReturnValueOnce(existingBillingQuery)
				.mockReturnValueOnce(insertBillingQuery);

			const result = await service.generateBillingRecord('apt-1');

			expect(result.id).toBe('bill-1');
			expect(result.appointment_id).toBe('apt-1');
			expect(result.total_amount).toBe('96');
		});

		test('processPayment updates billing status to paid', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			const billingQuery = createQueryMock({
				data: {
					id: 'bill-1',
					status: 'pending',
					total_amount: '100'
				},
				error: null
			});

			const updateQuery = createQueryMock({
				data: {
					id: 'bill-1',
					status: 'paid',
					payment_date: '2026-08-01T10:00:00Z',
					payment_method: 'credit_card'
				},
				error: null
			});

			fromMock.mockReturnValueOnce(billingQuery).mockReturnValueOnce(updateQuery);

			const result = await service.processPayment('bill-1', {
				payment_method: 'credit_card',
				transaction_reference: 'TXN-123'
			});

			expect(result.status).toBe('paid');
			expect(result.payment_method).toBe('credit_card');
		});

		test('processPayment rejects already paid billing', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			const billingQuery = createQueryMock({
				data: {
					id: 'bill-1',
					status: 'paid',
					total_amount: '100'
				},
				error: null
			});

			fromMock.mockReturnValueOnce(billingQuery);

			await expect(service.processPayment('bill-1', {
				payment_method: 'credit_card'
			})).rejects.toThrow('ya fue pagada');
		});

		test('applyInsuranceClaim updates billing with claim details', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			const billingQuery = createQueryMock({
				data: {
					id: 'bill-1',
					status: 'pending',
					total_amount: '100'
				},
				error: null
			});

			const updateQuery = createQueryMock({
				data: {
					id: 'bill-1',
					status: 'paid',
					notes: 'Insurance claim: CLM-001, Approved: $100'
				},
				error: null
			});

			fromMock.mockReturnValueOnce(billingQuery).mockReturnValueOnce(updateQuery);

			const result = await service.applyInsuranceClaim('bill-1', {
				claim_number: 'CLM-001',
				approved_amount: 100
			});

			expect(result.claimNumber).toBe('CLM-001');
			expect(result.approvedAmount).toBe(100);
			expect(result.patientResponsibility).toBe(0);
		});

		test('getBillingStatistics calculates totals and breakdown by status', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			const query = createQueryMock({
				data: [
					{ total_amount: '100', status: 'paid', created_at: '2026-08-01' },
					{ total_amount: '50', status: 'pending', created_at: '2026-08-02' },
					{ total_amount: '75', status: 'overdue', created_at: '2026-08-03' }
				],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const result = await service.getBillingStatistics({
				startDate: '2026-08-01',
				endDate: '2026-08-31'
			});

			expect(result.totalBillings).toBe(3);
			expect(result.totalRevenue).toBe(225);
			expect(result.paidAmount).toBe(100);
			expect(result.pendingAmount).toBe(50);
			expect(result.overdueAmount).toBe(75);
			expect(parseFloat(result.collectionRate)).toBeCloseTo(44.44, 2);
		});

		test('getBillingStatistics returns zero values for empty result', async () => {
			const { service, fromMock } = loadBillingCalculationService();

			const query = createQueryMock({
				data: [],
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const result = await service.getBillingStatistics();

			expect(result.totalBillings).toBe(0);
			expect(result.totalRevenue).toBe(0);
			expect(result.collectionRate).toBe(0);
		});
	});

	describe('validation.service - additional cases', () => {
		test('validateAppointmentBooking allows valid future appointment', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: false,
				doctorConflict: false
			});

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);
			futureDate.setHours(10, 0, 0, 0);

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: futureDate.toISOString()
			});

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test('validateAppointmentBooking detects patient conflict', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: true,
				doctorConflict: false
			});

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);
			futureDate.setHours(10, 0, 0, 0);

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: futureDate.toISOString()
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'scheduled_start',
						message: expect.stringContaining('Ya tienes una cita')
					})
				])
			);
		});

		test('validateAppointmentBooking detects doctor conflict', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: false,
				doctorConflict: true
			});

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);
			futureDate.setHours(10, 0, 0, 0);

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: futureDate.toISOString()
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'scheduled_start',
						message: expect.stringContaining('doctor ya tiene')
					})
				])
			);
		});

		test('validateAppointmentBooking detects inactive patient', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: false });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: false,
				doctorConflict: false
			});

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);
			futureDate.setHours(10, 0, 0, 0);

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: futureDate.toISOString()
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'patient_user_id',
						message: expect.stringContaining('no está activa')
					})
				])
			);
		});

		test('validateAppointmentBooking detects inactive doctor', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: false });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: false,
				doctorConflict: false
			});

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);
			futureDate.setHours(10, 0, 0, 0);

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: futureDate.toISOString()
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'doctor_id',
						message: expect.stringContaining('no está disponible')
					})
				])
			);
		});

		test('validateAppointmentBooking warns on weekend appointment', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: false,
				doctorConflict: false
			});

			const saturdayDate = new Date(2026, 4, 23, 10, 0, 0); // Saturday May 23, 2026

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: saturdayDate.toISOString()
			});

			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'scheduled_start',
						message: expect.stringContaining('fin de semana')
					})
				])
			);
		});

		test('validateAppointmentBooking rejects appointment outside business hours', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: false,
				doctorConflict: false
			});

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 5);
			futureDate.setHours(22, 30, 0, 0); // 10:30 PM - outside business hours

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: futureDate.toISOString()
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'scheduled_start',
						message: expect.stringContaining('horario de atención')
					})
				])
			);
		});

		test('validateAppointmentBooking rejects appointment too far in future', async () => {
			const { service } = loadValidationService();

			jest.spyOn(service, '_checkPatientStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkDoctorStatus').mockResolvedValue({ isActive: true });
			jest.spyOn(service, '_checkAppointmentConflicts').mockResolvedValue({
				patientConflict: false,
				doctorConflict: false
			});

			const farDate = new Date();
			farDate.setMonth(farDate.getMonth() + 12);
			farDate.setHours(10, 0, 0, 0);

			const result = await service.validateAppointmentBooking({
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1',
				scheduled_start: farDate.toISOString()
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'scheduled_start',
						message: expect.stringContaining('6 meses')
					})
				])
			);
		});

		test('validatePatientProfile returns complete profile when all fields present', async () => {
			const { service, fromMock } = loadValidationService();
			const query = createQueryMock({
				data: {
					id: 'patient-1',
					first_name: 'Ana',
					last_name: 'Lopez',
					email: 'ana@example.com',
					phone: '1234567890',
					patients: {
						id: 'pat-1',
						date_of_birth: '1990-01-01',
						gender: 'female',
						address: 'Calle 123',
						emergency_contact_name: 'Juan',
						blood_type: 'O+',
						insurance_provider_id: 'ins-1'
					}
				},
				error: null
			});

			fromMock.mockReturnValueOnce(query);

			const result = await service.validatePatientProfile('patient-1');

			expect(result.isComplete).toBe(true);
			expect(result.completenessPercentage).toBe(100);
		});

		test('validatePatientProfile throws error for non-existent user', async () => {
			const { service, fromMock } = loadValidationService();
			const query = createQueryMock({
				data: null,
				error: { message: 'User not found' }
			});

			fromMock.mockReturnValueOnce(query);

			await expect(service.validatePatientProfile('non-existent')).rejects.toThrow(
				'Usuario no encontrado'
			);
		});

		test('validateScheduleConfiguration accepts valid schedule', () => {
			const { service } = loadValidationService();

			const result = service.validateScheduleConfiguration({
				day_of_week: 1, // Monday
				start_time: '08:00',
				end_time: '17:00'
			});

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test('validateScheduleConfiguration rejects invalid day of week', () => {
			const { service } = loadValidationService();

			const result = service.validateScheduleConfiguration({
				day_of_week: 9,
				start_time: '08:00',
				end_time: '17:00'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'day_of_week' })
				])
			);
		});

		test('validateScheduleConfiguration rejects invalid time format', () => {
			const { service } = loadValidationService();

			const result = service.validateScheduleConfiguration({
				day_of_week: 1,
				start_time: 'invalid',
				end_time: '17:00'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'time' })
				])
			);
		});

		test('validateScheduleConfiguration rejects insufficient duration', () => {
			const { service } = loadValidationService();

			const result = service.validateScheduleConfiguration({
				day_of_week: 1,
				start_time: '08:00',
				end_time: '08:30'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'duration' })
				])
			);
		});

		test('validateScheduleConfiguration rejects schedule outside reasonable hours', () => {
			const { service } = loadValidationService();

			const result = service.validateScheduleConfiguration({
				day_of_week: 1,
				start_time: '04:00',
				end_time: '05:00'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: 'time' })
				])
			);
		});

		test('validateMedicalRecord accepts complete and valid data', () => {
			const { service } = loadValidationService();

			const result = service.validateMedicalRecord({
				blood_type: 'O+',
				allergies: 'Penicilina',
				chronic_conditions: 'Diabetes',
				current_medications: 'Metformina'
			});

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test('validateMedicalRecord rejects invalid blood type', () => {
			const { service } = loadValidationService();

			const result = service.validateMedicalRecord({
				blood_type: 'XX+'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'blood_type',
						message: expect.stringContaining('inválido')
					})
				])
			);
		});

		test('validateMedicalRecord warns for missing critical fields', () => {
			const { service } = loadValidationService();

			const result = service.validateMedicalRecord({
				blood_type: 'A+'
			});

			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: expect.stringMatching(/allergies|chronic_conditions|current_medications/)
					})
				])
			);
		});

		test('validateMedicalRecord rejects allergies string that is too long', () => {
			const { service } = loadValidationService();

			const result = service.validateMedicalRecord({
				allergies: 'a'.repeat(1001)
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'allergies',
						message: expect.stringContaining('demasiado larga')
					})
				])
			);
		});

		test('validatePrescription accepts valid prescription', () => {
			const { service } = loadValidationService();

			const result = service.validatePrescription({
				medications: [
					{ name: 'Ibuprofen', dosage: '500mg' },
					{ name: 'Amoxicillin', dosage: '250mg' }
				],
				duration_days: 7,
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1'
			});

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test('validatePrescription rejects missing medications', () => {
			const { service } = loadValidationService();

			const result = service.validatePrescription({
				medications: [],
				duration_days: 7,
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'medications',
						message: expect.stringContaining('al menos un medicamento')
					})
				])
			);
		});

		test('validatePrescription rejects medication without name', () => {
			const { service } = loadValidationService();

			const result = service.validatePrescription({
				medications: [
					{ dosage: '500mg' }
				],
				duration_days: 7,
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: expect.stringContaining('medications[0].name')
					})
				])
			);
		});

		test('validatePrescription rejects medication without dosage', () => {
			const { service } = loadValidationService();

			const result = service.validatePrescription({
				medications: [
					{ name: 'Ibuprofen' }
				],
				duration_days: 7,
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: expect.stringContaining('medications[0].dosage')
					})
				])
			);
		});

		test('validatePrescription rejects invalid duration', () => {
			const { service } = loadValidationService();

			const result = service.validatePrescription({
				medications: [
					{ name: 'Ibuprofen', dosage: '500mg' }
				],
				duration_days: 500,
				patient_user_id: 'patient-1',
				doctor_id: 'doctor-1'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'duration_days',
						message: expect.stringContaining('1 y 365')
					})
				])
			);
		});

		test('validatePrescription rejects missing patient', () => {
			const { service } = loadValidationService();

			const result = service.validatePrescription({
				medications: [
					{ name: 'Ibuprofen', dosage: '500mg' }
				],
				duration_days: 7,
				doctor_id: 'doctor-1'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'patient_user_id',
						message: expect.stringContaining('requerido')
					})
				])
			);
		});

		test('validatePrescription rejects missing doctor', () => {
			const { service } = loadValidationService();

			const result = service.validatePrescription({
				medications: [
					{ name: 'Ibuprofen', dosage: '500mg' }
				],
				duration_days: 7,
				patient_user_id: 'patient-1'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: 'doctor_id',
						message: expect.stringContaining('requerido')
					})
				])
			);
		});
	});
});
