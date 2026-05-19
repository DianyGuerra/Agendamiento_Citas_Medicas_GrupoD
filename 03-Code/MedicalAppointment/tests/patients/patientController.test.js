const loadPatientController = () => {
	const state = {};

	jest.isolateModules(() => {
		const patientRepository = {
			findWithUserDetails: jest.fn(),
			findByUserId: jest.fn(),
			createForUser: jest.fn(),
			updateByUserId: jest.fn()
		};

		const userRepository = {
			update: jest.fn()
		};

		const responseBuilder = {
			success: jest.fn((res, data) => ({ res, data })),
			paginated: jest.fn((res, data, pagination) => ({ res, data, pagination })),
			created: jest.fn((res, data) => ({ res, data }))
		};

		const asyncHandler = (fn) => async (req, res, next) => {
			try {
				await fn(req, res, next);
			} catch (error) {
				next(error);
			}
		};

		jest.doMock('../../backend/crud-api/repositories/patient.repository', () => patientRepository);
		jest.doMock('../../backend/crud-api/repositories/user.repository', () => userRepository);
		jest.doMock('../../backend/shared/utils/responseBuilder.utils', () => responseBuilder);
		jest.doMock('../../backend/shared/middleware/errorHandler.middleware', () => ({ asyncHandler }));
		jest.doMock('../../backend/shared/config/database.config', () => ({ supabase: {} }));

		state.controller = require('../../backend/crud-api/controllers/patient.controller');
		state.patientRepository = patientRepository;
		state.userRepository = userRepository;
		state.responseBuilder = responseBuilder;
	});

	return state;
};

const invokeHandler = async (handler, req, res = {}) => {
	const next = jest.fn();
	await handler(req, res, next);
	return { next, res };
};

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

	test('getStats returns patient statistics successfully', async () => {
		const { controller, patientRepository, responseBuilder } = loadPatientController();
		patientRepository.getStats = jest.fn().mockResolvedValue({ total: 5, active: 4, inactive: 1 });

		const req = { };
		await controller.getStats(req, {});

		expect(patientRepository.getStats).toHaveBeenCalled();
		expect(responseBuilder.success).toHaveBeenCalledWith(expect.any(Object), { total: 5, active: 4, inactive: 1 });
	});
});
