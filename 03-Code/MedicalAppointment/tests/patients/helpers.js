const createQueryMock = (result) => {
	result = result ?? { data: [], error: null, count: 0 };
	const query = {};

	const chainMethods = [
		'select',
		'eq',
		'neq',
		'gte',
		'lte',
		'lt',
		'in',
		'or',
		'ilike',
		'order',
		'range',
		'limit',
		'update',
		'insert',
		'delete'
	];

	chainMethods.forEach((method) => {
		query[method] = jest.fn(() => query);
	});

	query.single = jest.fn(async () => result);
	query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);

	return query;
};

const loadPatientRepository = () => {
	const state = {};

	jest.isolateModules(() => {
		const fromMock = jest.fn();

		const createMock = jest.fn(async (data) => ({ id: 'new-id', ...data }));

		jest.doMock('../../backend/shared/repositories/BaseRepository', () => {
			return class MockBaseRepository {
				constructor(tableName) {
					this.tableName = tableName;
					this.db = { from: fromMock };
				}

				async create(data) {
					return createMock(data);
				}
			};
		});

		state.repo = require('../../backend/crud-api/repositories/patient.repository');
		state.fromMock = fromMock;
		state.createMock = createMock;
	});

	return state;
};

const loadPatientController = () => {
	const state = {};

	jest.isolateModules(() => {
		const fromMock = jest.fn();

		const patientRepository = {
			findWithUserDetails: jest.fn(),
			findByUserId: jest.fn(),
			findAllWithUserInfo: jest.fn(),
			createForUser: jest.fn(),
			updateByUserId: jest.fn(),
			getStats: jest.fn()
		};

		const userRepository = {
			findById: jest.fn(),
			update: jest.fn(),
			softDelete: jest.fn()
		};

		const responseBuilder = {
			success: jest.fn((res, data, status, message) => ({ res, data, status, message })),
			paginated: jest.fn((res, data, pagination) => ({ res, data, pagination })),
			created: jest.fn((res, data, message) => ({ res, data, message }))
		};

		const asyncHandler = (fn) => async (req, res, next) => {
			try {
				await fn(req, res, next);
			} catch (error) {
				next(error);
			}
		};

		const createAuditLog = jest.fn();

		jest.doMock('../../backend/crud-api/repositories/patient.repository', () => patientRepository);
		jest.doMock('../../backend/crud-api/repositories/user.repository', () => userRepository);
		jest.doMock('../../backend/shared/utils/responseBuilder.utils', () => responseBuilder);
		jest.doMock('../../backend/shared/middleware/errorHandler.middleware', () => ({ asyncHandler }));
		jest.doMock('../../backend/shared/config/database.config', () => ({ supabase: { from: fromMock } }));
		jest.doMock('../../backend/shared/utils/audit.utils', () => ({
			createAuditLog,
			AuditActions: {
				PATIENT_CREATED: 'PATIENT_CREATED',
				PATIENT_UPDATED: 'PATIENT_UPDATED',
				PATIENT_DELETED: 'PATIENT_DELETED'
			}
		}));

		state.controller = require('../../backend/crud-api/controllers/patient.controller');
		state.patientRepository = patientRepository;
		state.userRepository = userRepository;
		state.responseBuilder = responseBuilder;
		state.fromMock = fromMock;
		state.createAuditLog = createAuditLog;
	});

	return state;
};

const invokeHandler = async (handler, req, res = {}) => {
	const next = jest.fn();
	await handler(req, res, next);
	return { next, res };
};

const loadPatientRoutes = () => {
	const state = {};

	jest.isolateModules(() => {
		const authMiddleware = jest.fn((req, res, next) => next());
		const requireRole = jest.fn(() => (req, res, next) => next());

		const controller = {
			getStats: jest.fn(),
			getAll: jest.fn(),
			getProfile: jest.fn(),
			getByUserId: jest.fn(),
			getById: jest.fn(),
			createWithUser: jest.fn(),
			updateProfile: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		};

		jest.doMock('../../backend/crud-api/controllers/patient.controller', () => controller);
		jest.doMock('../../backend/shared/middleware/auth.middleware', () => ({
			authMiddleware,
			requireRole
		}));

		state.router = require('../../backend/crud-api/routes/patient.routes');
		state.requireRole = requireRole;
		state.authMiddleware = authMiddleware;
	});

	return state;
};

const loadValidationService = () => {
	let module;
	const fromMock = jest.fn();

	jest.isolateModules(() => {
		jest.doMock('../../backend/shared/config/database.config', () => ({
			supabase: { from: fromMock }
		}));

		module = require('../../backend/business-api/services/validation.service');
	});

	return { service: module, fromMock };
};

const loadBillingCalculationService = () => {
	let module;
	const fromMock = jest.fn();

	jest.isolateModules(() => {
		jest.doMock('../../backend/shared/config/database.config', () => ({
			supabase: { from: fromMock }
		}));

		module = require('../../backend/business-api/services/billingCalculation.service');
	});

	return { service: module, fromMock };
};

module.exports = {
	createQueryMock,
	loadPatientRepository,
	loadPatientController,
	invokeHandler,
	loadPatientRoutes,
	loadValidationService,
	loadBillingCalculationService
};
