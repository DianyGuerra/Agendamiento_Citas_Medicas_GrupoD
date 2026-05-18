const createQueryMock = (result) => {
	const query = {};
	const resolvedResult = result === undefined ? { data: [], error: null, count: 0 } : result;

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

	query.single = jest.fn(async () => resolvedResult);
	query.then = (resolve, reject) => Promise.resolve(resolvedResult).then(resolve, reject);

	return query;
};

const loadPatientRepository = () => {
	const state = {};

	jest.isolateModules(() => {
		const fromMock = jest.fn();

		jest.doMock('../../backend/shared/repositories/BaseRepository', () => {
			return function MockBaseRepository(tableName) {
				this.tableName = tableName;
				this.db = { from: fromMock };
			};
		});

		state.repo = require('../../backend/crud-api/repositories/patient.repository');
		state.fromMock = fromMock;
	});

	return state;
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
	loadPatientRoutes,
	loadValidationService,
	loadBillingCalculationService
};
