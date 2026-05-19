const createQueryMock = (result = { data: [], error: null, count: 0 }) => {
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
  query.maybeSingle = jest.fn(async () => result);
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);

  return query;
};

const invokeHandler = async (handler, req = {}, res = {}) => {
  const next = jest.fn();
  await handler(req, res, next);
  return next;
};

const createAsyncHandlerMock = () => (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};

const loadDoctorRepository = () => {
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

	jest.dontMock('../../backend/crud-api/repositories/doctor.repository');

    state.repo = require('../../backend/crud-api/repositories/doctor.repository');
    state.fromMock = fromMock;
    state.updateMock = updateMock;
  });

  return state;
};

const loadDoctorRoutes = () => {
  const state = {};

  jest.isolateModules(() => {
    const authMiddleware = jest.fn((req, res, next) => next());
    const requireRole = jest.fn(() => (req, res, next) => next());

    const controller = {
      getAll: jest.fn(),
      getBySpecialty: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      getMyPatients: jest.fn(),
      create: jest.fn(),
      createWithUser: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      resetPassword: jest.fn(),
      delete: jest.fn()
    };

    jest.doMock('../../backend/crud-api/controllers/doctor.controller', () => controller);
    jest.doMock('../../backend/shared/middleware/auth.middleware', () => ({
      authMiddleware,
      requireRole
    }));

	jest.dontMock('../../backend/crud-api/routes/doctor.routes');

    state.router = require('../../backend/crud-api/routes/doctor.routes');
    state.requireRole = requireRole;
    state.authMiddleware = authMiddleware;
  });

  return state;
};

const loadDoctorController = () => {
  const state = {};

  jest.isolateModules(() => {
    const doctorRepository = {
      findAllWithDetails: jest.fn(),
      findBySpecialty: jest.fn(),
      findWithDetails: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      updateActiveStatus: jest.fn()
    };

    const userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByCedula: jest.fn(),
      update: jest.fn()
    };

    const scheduleRepository = {
      findByDoctor: jest.fn()
    };

    const appointmentRepository = {
      findUniquePatientsByDoctor: jest.fn()
    };

    const responseBuilderMock = {
      success: jest.fn(),
      created: jest.fn(),
      paginated: jest.fn()
    };

    const fromMock = jest.fn();
    const createAuditLog = jest.fn();

    jest.doMock('../../backend/crud-api/repositories/doctor.repository', () => doctorRepository);
    jest.doMock('../../backend/crud-api/repositories/user.repository', () => userRepository);
    jest.doMock('../../backend/crud-api/repositories/schedule.repository', () => scheduleRepository);
    jest.doMock('../../backend/crud-api/repositories/appointment.repository', () => appointmentRepository);

    jest.doMock('../../backend/shared/utils/responseBuilder.utils', () => responseBuilderMock);
    jest.doMock('../../backend/shared/middleware/errorHandler.middleware', () => ({
      asyncHandler: createAsyncHandlerMock()
    }));

    jest.doMock('../../backend/shared/config/database.config', () => ({
      supabase: { from: fromMock }
    }));

    jest.doMock('../../backend/shared/utils/audit.utils', () => ({
      createAuditLog,
      AuditActions: {
        DOCTOR_CREATED: 'DOCTOR_CREATED',
        DOCTOR_UPDATED: 'DOCTOR_UPDATED'
      }
    }));

	jest.doMock('bcrypt', () => ({
		hash: jest.fn(async () => 'hashed-password')
	}), { virtual: true });

    jest.doMock('node:crypto', () => ({
      randomInt: jest.fn(() => 1234)
    }));

	jest.dontMock('../../backend/crud-api/controllers/doctor.controller');

    state.controller = require('../../backend/crud-api/controllers/doctor.controller');
    state.doctorRepository = doctorRepository;
    state.userRepository = userRepository;
    state.scheduleRepository = scheduleRepository;
    state.appointmentRepository = appointmentRepository;
    state.responseBuilderMock = responseBuilderMock;
    state.fromMock = fromMock;
    state.createAuditLog = createAuditLog;
  });

  return state;
};

const loadAvailabilityService = () => {
  const state = {};

  jest.isolateModules(() => {
    const fromMock = jest.fn();

    jest.doMock('../../backend/shared/config/database.config', () => ({
      supabase: { from: fromMock }
    }));

    state.service = require('../../backend/business-api/services/availability.service');
    state.fromMock = fromMock;
  });

  return state;
};

const loadAvailabilityController = () => {
  const state = {};

  jest.isolateModules(() => {
    const availabilityService = {
      getAvailableSlots: jest.fn(),
      getWeeklyAvailability: jest.fn(),
      getNextAvailableSlot: jest.fn(),
      isSlotAvailable: jest.fn()
    };

    const responseBuilderMock = {
      success: jest.fn()
    };

    jest.doMock('../../backend/business-api/services/availability.service', () => availabilityService);
    jest.doMock('../../backend/shared/utils/responseBuilder.utils', () => responseBuilderMock);
    jest.doMock('../../backend/shared/middleware/errorHandler.middleware', () => ({
      asyncHandler: createAsyncHandlerMock()
    }));

    state.controller = require('../../backend/business-api/controllers/availability.controller');
    state.availabilityService = availabilityService;
    state.responseBuilderMock = responseBuilderMock;
  });

  return state;
};

const loadAvailabilityRoutes = () => {
  const state = {};

  jest.isolateModules(() => {
    const controller = {
      getSlots: jest.fn(),
      getWeeklyAvailability: jest.fn(),
      getNextAvailable: jest.fn(),
      checkSlot: jest.fn()
    };

    jest.doMock('../../backend/business-api/controllers/availability.controller', () => controller);
    jest.doMock('../../backend/shared/middleware/auth.middleware', () => ({
      optionalAuth: jest.fn((req, res, next) => next())
    }));

    state.router = require('../../backend/business-api/routes/availability.routes');
  });

  return state;
};

const createDoctorBody = (overrides = {}) => ({
  cedula: '1723456789',
  first_name: 'Ana',
  last_name: 'Mora',
  email: 'ana@example.com',
  phone_number: '0999999999',
  specialty_id: 'sp-1',
  license_number: 'MED-001',
  status: 'active',
  ...overrides
});

const createDoctorCreateBody = (overrides = {}) => ({
  user_id: 'user-1',
  specialty_id: 'sp-1',
  professional_id: 'MED-001',
  bio: 'Especialista',
  ...overrides
});

const createDoctorUpdateBody = (overrides = {}) => ({
  specialty_id: 'sp-2',
  professional_id: 'MED-002',
  bio: 'Actualizado',
  ...overrides
});

const createExistingUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'ana@example.com',
  first_name: 'Ana',
  last_name: 'Mora',
  cedula: '1723456789',
  phone_number: '0999999999',
  roles: { name: 'patient' },
  ...overrides
});

const createSpecialty = (overrides = {}) => ({
  id: 'sp-1',
  name: 'Cardiologia',
  description: 'Especialidad medica',
  consultation_fee: 120,
  ...overrides
});

const createDoctorRecord = (overrides = {}) => ({
  id: 'doc-1',
  user_id: 'user-1',
  specialty_id: 'sp-1',
  professional_id: 'MED-001',
  bio: 'Especialista',
  active: true,
  ...overrides
});

const createDoctorWithRelations = (overrides = {}) => {
  const {
    users = createExistingUser({ roles: undefined, is_active: true }),
    specialties = createSpecialty(),
    ...doctorOverrides
  } = overrides;

  return {
    ...createDoctorRecord({
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z'
    }),
    users,
    specialties,
    ...doctorOverrides
  };
};

const createAvailabilitySlot = (overrides = {}) => ({
  time: '09:00',
  available: true,
  duration: 30,
  ...overrides
});

const createSchedule = (overrides = {}) => ({
  start_time: '09:00',
  end_time: '11:00',
  break_start_time: null,
  break_end_time: null,
  is_working_day: true,
  ...overrides
});

const createScheduleException = (overrides = {}) => ({
  id: 'exception-1',
  exception_type: 'vacation',
  exception_start_time: null,
  exception_end_time: null,
  ...overrides
});

const createBookedAppointment = (overrides = {}) => ({
  scheduled_start: '2099-01-05T09:30:00',
  appointment_status: { code: 'scheduled' },
  ...overrides
});

const createAvailabilityParams = (overrides = {}) => ({
  doctorId: 'doc-1',
  date: '2099-01-05',
  ...overrides
});

const createSlotCheckBody = (overrides = {}) => ({
  doctorId: 'doc-1',
  date: '2099-01-05',
  time: '09:00',
  ...overrides
});

const createRoleQueryMock = () => createQueryMock({
  data: { id: 'role-doctor' },
  error: null
});

const createReq = ({ params = {}, query = {}, body = {}, user = { id: 'admin-1' } } = {}) => ({
  params,
  query,
  body,
  user
});

const expectNextError = (next, expectedMessage) => {
  expect(next).toHaveBeenCalledTimes(1);
  expect(next.mock.calls[0][0].message).toContain(expectedMessage);
};

module.exports = {
  createQueryMock,
  invokeHandler,
  loadDoctorRepository,
  loadDoctorRoutes,
  loadDoctorController,
  loadAvailabilityService,
  loadAvailabilityController,
  loadAvailabilityRoutes,
  createDoctorBody,
  createDoctorCreateBody,
  createDoctorUpdateBody,
  createExistingUser,
  createSpecialty,
  createDoctorRecord,
  createDoctorWithRelations,
  createAvailabilitySlot,
  createSchedule,
  createScheduleException,
  createBookedAppointment,
  createAvailabilityParams,
  createSlotCheckBody,
  createRoleQueryMock,
  createReq,
  expectNextError
};
