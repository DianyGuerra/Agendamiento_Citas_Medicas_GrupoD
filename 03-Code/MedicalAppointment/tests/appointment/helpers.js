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
		'order',
		'range',
		'limit',
		'update',
		'insert'
	];

	chainMethods.forEach((method) => {
		query[method] = jest.fn(() => query);
	});

	query.single = jest.fn(async () => result);
	query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);

	return query;
};

const loadAppointmentRepository = () => {
	const state = {};

	jest.isolateModules(() => {
		const fromMock = jest.fn();
		const updateMock = jest.fn(async (id, data) => ({ id, ...data }));

		jest.doMock('../../backend/shared/repositories/BaseRepository', () => {
			return class MockBaseRepository {
				constructor(tableName) {
					this.tableName = tableName;
					this.db = { from: fromMock };
				}

				async update(id, data) {
					return updateMock(id, data);
				}
			};
		});

		state.repo = require('../../backend/crud-api/repositories/appointment.repository');
		state.AppointmentStatus = require('../../backend/shared/constants/app.constants').AppointmentStatus;
		state.fromMock = fromMock;
		state.updateMock = updateMock;
	});

	return state;
};

const loadSchedulingService = () => {
	const state = {};

	jest.isolateModules(() => {
		const fromMock = jest.fn();
		const availabilityMock = { isSlotAvailable: jest.fn() };
		const emailMock = {
			sendAppointmentConfirmation: jest.fn(),
			sendAppointmentCancellation: jest.fn(),
			sendAppointmentRescheduled: jest.fn()
		};

		jest.doMock('../../backend/shared/config/database.config', () => ({
			supabase: { from: fromMock }
		}));

		jest.doMock('../../backend/business-api/services/availability.service', () => availabilityMock);
		jest.doMock('../../backend/external-api/services/email.service', () => emailMock);

		state.service = require('../../backend/business-api/services/scheduling.service');
		state.availabilityMock = availabilityMock;
		state.emailMock = emailMock;
		state.fromMock = fromMock;
	});

	return state;
};

const loadReminderService = () => {
	const state = {};

	jest.isolateModules(() => {
		const fromMock = jest.fn();
		const emailMock = {
			sendAppointmentReminder: jest.fn()
		};

		jest.doMock('../../backend/shared/config/database.config', () => ({
			supabase: { from: fromMock }
		}));

		jest.doMock('../../backend/external-api/services/email.service', () => emailMock);

		state.service = require('../../backend/external-api/services/reminder.service');
		state.fromMock = fromMock;
		state.emailMock = emailMock;
	});

	return state;
};

const loadSchedulingController = () => {
	const state = {};

	jest.isolateModules(() => {
		const serviceMock = {
			scheduleAppointment: jest.fn(),
			rescheduleAppointment: jest.fn(),
			cancelAppointment: jest.fn(),
			confirmAppointment: jest.fn(),
			startConsultation: jest.fn(),
			completeConsultation: jest.fn(),
			markNoShow: jest.fn(),
			getDoctorStatistics: jest.fn(),
			confirmAppointmentPublic: jest.fn(),
			markPastAppointmentsAsNoShow: jest.fn()
		};

		const responseBuilderMock = {
			created: jest.fn(),
			success: jest.fn()
		};

		const asyncHandlerMock = (fn) => async (req, res, next) => {
			try {
				await fn(req, res, next);
			} catch (error) {
				next(error);
			}
		};

		jest.doMock('../../backend/business-api/services/scheduling.service', () => serviceMock);
		jest.doMock('../../backend/shared/utils/responseBuilder.utils', () => responseBuilderMock);
		jest.doMock('../../backend/shared/middleware/errorHandler.middleware', () => ({
			asyncHandler: asyncHandlerMock
		}));

		state.controller = require('../../backend/business-api/controllers/scheduling.controller');
		state.serviceMock = serviceMock;
		state.responseBuilderMock = responseBuilderMock;
	});

	return state;
};

const loadAppointmentRoutes = () => {
	const state = {};

	jest.isolateModules(() => {
		const authMiddleware = jest.fn((req, res, next) => next());
		const requireRole = jest.fn(() => (req, res, next) => next());

		const controller = {
			getAll: jest.fn(),
			getUnbilled: jest.fn(),
			getByPatient: jest.fn(),
			getByPatientId: jest.fn(),
			getByDoctor: jest.fn(),
			getById: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			partialUpdate: jest.fn(),
			updateStatus: jest.fn(),
			confirm: jest.fn(),
			checkIn: jest.fn(),
			cancel: jest.fn(),
			delete: jest.fn()
		};

		jest.doMock('../../backend/crud-api/controllers/appointment.controller', () => controller);
		jest.doMock('../../backend/shared/middleware/auth.middleware', () => ({
			authMiddleware,
			requireRole
		}));

		state.router = require('../../backend/crud-api/routes/appointment.routes');
		state.requireRole = requireRole;
		state.authMiddleware = authMiddleware;
	});

	return state;
};

const loadAppointmentController = () => {
	const state = {};

	jest.isolateModules(() => {
		const fromMock = jest.fn();
		const appointmentRepository = {
			findAll: jest.fn(),
			count: jest.fn(),
			findWithDetails: jest.fn(),
			findByPatient: jest.fn(),
			findByDoctor: jest.fn(),
			findById: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			updateStatus: jest.fn(),
			softDelete: jest.fn()
		};

		const doctorRepository = {
			findById: jest.fn(),
			findByUserId: jest.fn()
		};

		const consultationRoomRepository = {
			findById: jest.fn()
		};

		const responseBuilderMock = {
			paginated: jest.fn(),
			success: jest.fn(),
			created: jest.fn()
		};

		const parsePaginationQuery = jest.fn(() => ({ page: 1, limit: 10, offset: 0 }));
		const createPagination = jest.fn((total, page, limit) => ({
			total,
			page,
			limit,
			pages: Math.max(1, Math.ceil(total / limit))
		}));

		const asyncHandlerMock = (fn) => async (req, res, next) => {
			try {
				await fn(req, res, next);
			} catch (error) {
				next(error);
			}
		};

		const createAuditLog = jest.fn();
		const emailServiceMock = {
			sendAppointmentConfirmation: jest.fn(),
			sendAppointmentCancellation: jest.fn()
		};

		const generateBillingRecord = jest.fn();
		const BillingCalculationService = jest.fn().mockImplementation(() => ({
			generateBillingRecord
		}));

		jest.doMock('../../backend/crud-api/repositories/appointment.repository', () => appointmentRepository);
		jest.doMock('../../backend/crud-api/repositories/doctor.repository', () => doctorRepository);
		jest.doMock('../../backend/crud-api/repositories/consultationRoom.repository', () => consultationRoomRepository);
		jest.doMock('../../backend/shared/utils/responseBuilder.utils', () => responseBuilderMock);
		jest.doMock('../../backend/shared/utils/helpers.utils', () => ({
			parsePaginationQuery,
			createPagination
		}));
		jest.doMock('../../backend/shared/middleware/errorHandler.middleware', () => ({
			asyncHandler: asyncHandlerMock
		}));
		jest.doMock('../../backend/shared/utils/audit.utils', () => ({
			createAuditLog,
			AuditActions: {
				APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
				APPOINTMENT_UPDATED: 'APPOINTMENT_UPDATED',
				APPOINTMENT_STATUS_CHANGED: 'APPOINTMENT_STATUS_CHANGED',
				APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED'
			}
		}));
		jest.doMock('../../backend/external-api/services/email.service', () => emailServiceMock);
		jest.doMock('../../backend/shared/config/database.config', () => ({
			supabase: { from: fromMock }
		}));
		jest.doMock('../../backend/business-api/services/billingCalculation.service', () => BillingCalculationService);

		state.controller = require('../../backend/crud-api/controllers/appointment.controller');
		state.appointmentRepository = appointmentRepository;
		state.doctorRepository = doctorRepository;
		state.consultationRoomRepository = consultationRoomRepository;
		state.responseBuilderMock = responseBuilderMock;
		state.parsePaginationQuery = parsePaginationQuery;
		state.createPagination = createPagination;
		state.createAuditLog = createAuditLog;
		state.fromMock = fromMock;
		state.emailServiceMock = emailServiceMock;
		state.generateBillingRecord = generateBillingRecord;
		state.BillingCalculationService = BillingCalculationService;
		state.AppointmentStatus = require('../../backend/shared/constants/app.constants').AppointmentStatus;
	});

	return state;
};

const invokeHandler = async (handler, req, res = {}) => {
	const next = jest.fn();
	await handler(req, res, next);
	return next;
};

module.exports = {
	createQueryMock,
	loadAppointmentRepository,
	loadSchedulingService,
	loadReminderService,
	loadSchedulingController,
	loadAppointmentController,
	loadAppointmentRoutes,
	invokeHandler
};