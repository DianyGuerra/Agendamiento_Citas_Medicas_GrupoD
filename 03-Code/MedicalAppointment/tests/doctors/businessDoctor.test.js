const {
  createQueryMock,
  invokeHandler,
  loadAvailabilityService,
  loadAvailabilityController,
  loadAvailabilityRoutes,
  createAvailabilitySlot,
  createSchedule,
  createScheduleException,
  createBookedAppointment,
  createAvailabilityParams,
  createSlotCheckBody,
  createReq,
  expectNextError
} = require('./helpers');

const DOCTOR_ID = 'doc-1';
const FUTURE_DATE = '2099-01-05';

const createSuccessfulQuery = (data) => createQueryMock({ data, error: null });
const createMissingRowQuery = () => createQueryMock({
  data: null,
  error: { code: 'PGRST116' }
});
const createSupabaseErrorQuery = (message, code = '500') => createQueryMock({
  data: null,
  error: { code, message }
});
const getRoutePaths = (router) => router.stack
  .filter((layer) => layer.route)
  .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);

describe('Doctor module unit tests - Business layer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Business layer - availability.service', () => {
    test('getAvailableSlots rejects past dates', async () => {
      const { service } = loadAvailabilityService();

      await expect(
        service.getAvailableSlots(DOCTOR_ID, '2000-01-01')
      ).rejects.toThrow('No se pueden consultar fechas pasadas');
    });

    test('getAvailableSlots returns empty list when doctor has vacation exception', async () => {
      const { service, fromMock } = loadAvailabilityService();

      fromMock.mockReturnValueOnce(createSuccessfulQuery(createScheduleException()));

      const slots = await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(slots).toEqual([]);
    });

    test('getAvailableSlots generates slots and excludes booked time', async () => {
      const { service, fromMock } = loadAvailabilityService();

      fromMock
        .mockReturnValueOnce(createMissingRowQuery())
        .mockReturnValueOnce(createSuccessfulQuery(createSchedule({
          break_start_time: '10:00',
          break_end_time: '10:30'
        })))
        .mockReturnValueOnce(createSuccessfulQuery([
          createBookedAppointment({ scheduled_start: `${FUTURE_DATE}T09:30:00` })
        ]));

      const slots = await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(fromMock).toHaveBeenCalledWith('doctor_schedules');
      expect(fromMock).toHaveBeenCalledWith('appointments');
      expect(slots).toEqual([
        createAvailabilitySlot({ time: '09:00' }),
        createAvailabilitySlot({ time: '10:30' })
      ]);
    });

    test('isSlotAvailable returns true when requested time exists in available slots', async () => {
      const { service } = loadAvailabilityService();

      jest.spyOn(service, 'getAvailableSlots').mockResolvedValue([
        createAvailabilitySlot({ time: '09:00' }),
        createAvailabilitySlot({ time: '09:30' })
      ]);

      const result = await service.isSlotAvailable(DOCTOR_ID, FUTURE_DATE, '09:30');

      expect(result).toBe(true);
      expect(service.getAvailableSlots).toHaveBeenCalledWith(DOCTOR_ID, FUTURE_DATE);
    });

    test('getWeeklyAvailability only includes days with available slots', async () => {
      const { service } = loadAvailabilityService();
      const availableSlots = [createAvailabilitySlot({ time: '09:00' })];

      jest.spyOn(service, 'getAvailableSlots')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(availableSlots)
        .mockResolvedValue([]);

      const availability = await service.getWeeklyAvailability(DOCTOR_ID, FUTURE_DATE, 1);

      expect(Object.values(availability)).toEqual([availableSlots]);
    });

    test('getNextAvailableSlot returns the first future day with availability', async () => {
      const { service } = loadAvailabilityService();
      const slot = createAvailabilitySlot({ time: '09:00' });

      jest.spyOn(service, 'getAvailableSlots')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([slot]);

      const result = await service.getNextAvailableSlot(DOCTOR_ID, 2);

      expect(result).toEqual(expect.objectContaining({ slot }));
    });

    test('_getBookedSlots returns formatted booked appointment times', async () => {
      const { service, fromMock } = loadAvailabilityService();

      fromMock.mockReturnValueOnce(createSuccessfulQuery([
        createBookedAppointment({ scheduled_start: `${FUTURE_DATE}T08:30:00` }),
        createBookedAppointment({ scheduled_start: null })
      ]));

      const booked = await service._getBookedSlots(DOCTOR_ID, FUTURE_DATE);

      expect(booked).toEqual(['08:30']);
    });

    test('_getDayOfWeek returns numeric day of week', () => {
      const { service } = loadAvailabilityService();

      const day = service._getDayOfWeek(FUTURE_DATE);

      expect(typeof day).toBe('number');
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    });

    test('getAvailableSlots returns empty list when doctor has day_off exception', async () => {
      const { service, fromMock } = loadAvailabilityService();

      fromMock.mockReturnValueOnce(createSuccessfulQuery(
        createScheduleException({ exception_type: 'day_off' })
      ));

      const slots = await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(slots).toEqual([]);
    });

    test('getAvailableSlots uses custom exception hours when exception has start and end time', async () => {
      const { service, fromMock } = loadAvailabilityService();

      fromMock
        .mockReturnValueOnce(createSuccessfulQuery(createScheduleException({
          exception_type: 'custom_hours',
          exception_start_time: '08:00',
          exception_end_time: '09:00'
        })))
        .mockReturnValueOnce(createSuccessfulQuery([]));

      const slots = await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(fromMock).toHaveBeenCalledWith('appointments');
      expect(slots).toEqual([
        createAvailabilitySlot({ time: '08:00' }),
        createAvailabilitySlot({ time: '08:30' })
      ]);
    });

    test('getAvailableSlots returns empty list when doctor has no regular schedule', async () => {
      const { service, fromMock } = loadAvailabilityService();

      fromMock
        .mockReturnValueOnce(createMissingRowQuery())
        .mockReturnValueOnce(createMissingRowQuery());

      const slots = await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(fromMock).toHaveBeenCalledWith('doctor_schedules');
      expect(slots).toEqual([]);
    });

    test('getAvailableSlots returns empty list when regular schedule is not a working day', async () => {
      const { service, fromMock } = loadAvailabilityService();

      fromMock
        .mockReturnValueOnce(createMissingRowQuery())
        .mockReturnValueOnce(createSuccessfulQuery(createSchedule({ is_working_day: false })));

      const slots = await service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(slots).toEqual([]);
    });

    test('_getException throws error when Supabase returns unexpected error', async () => {
      const { service, fromMock } = loadAvailabilityService();
      const error = { code: '500', message: 'exception query failed' };

      fromMock.mockReturnValueOnce(createSupabaseErrorQuery(error.message));

      await expect(service._getException(DOCTOR_ID, FUTURE_DATE)).rejects.toEqual(error);
    });

    test('_getSchedule throws error when Supabase returns unexpected error', async () => {
      const { service, fromMock } = loadAvailabilityService();
      const error = { code: '500', message: 'schedule query failed' };

      fromMock.mockReturnValueOnce(createSupabaseErrorQuery(error.message));

      await expect(service._getSchedule(DOCTOR_ID, 1)).rejects.toEqual(error);
    });

    test('_getBookedSlots returns empty array when query fails', async () => {
      const { service, fromMock } = loadAvailabilityService();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      fromMock.mockReturnValueOnce(createQueryMock({
        data: null,
        error: { message: 'booked slots failed' }
      }));

      const booked = await service._getBookedSlots(DOCTOR_ID, FUTURE_DATE);

      expect(booked).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('getWeeklyAvailability skips dates that throw errors', async () => {
      const { service } = loadAvailabilityService();
      const availableSlots = [createAvailabilitySlot({ time: '09:00' })];

      jest.spyOn(service, 'getAvailableSlots')
        .mockRejectedValueOnce(new Error('past date'))
        .mockResolvedValueOnce(availableSlots)
        .mockResolvedValue([]);

      const availability = await service.getWeeklyAvailability(DOCTOR_ID, FUTURE_DATE, 1);

      expect(Object.values(availability)).toEqual([availableSlots]);
    });

    test('getNextAvailableSlot returns null when no available slots are found', async () => {
      const { service } = loadAvailabilityService();

      jest.spyOn(service, 'getAvailableSlots').mockResolvedValue([]);

      const result = await service.getNextAvailableSlot(DOCTOR_ID, 3);

      expect(result).toBeNull();
      expect(service.getAvailableSlots).toHaveBeenCalledTimes(3);
    });
  });

  describe('Business layer - availability.controller', () => {
    test('getSlots returns doctor slots summary', async () => {
      const {
        controller,
        availabilityService,
        responseBuilderMock
      } = loadAvailabilityController();
      const slots = [
        createAvailabilitySlot({ time: '09:00' }),
        createAvailabilitySlot({ time: '09:30' })
      ];

      availabilityService.getAvailableSlots.mockResolvedValue(slots);

      await invokeHandler(controller.getSlots, createReq({
        params: createAvailabilityParams()
      }));

      expect(availabilityService.getAvailableSlots).toHaveBeenCalledWith(DOCTOR_ID, FUTURE_DATE);
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          doctorId: DOCTOR_ID,
          date: FUTURE_DATE,
          slots,
          totalSlots: 2
        }
      );
    });

    test('getSlots sends ValidationError when doctorId or date is missing', async () => {
      const { controller } = loadAvailabilityController();

      const next = await invokeHandler(controller.getSlots, createReq({
        params: createAvailabilityParams({ doctorId: null })
      }));

      expectNextError(next, 'doctorId y date');
    });

    test('getWeeklyAvailability returns weekly availability map', async () => {
      const {
        controller,
        availabilityService,
        responseBuilderMock
      } = loadAvailabilityController();
      const availability = {
        [FUTURE_DATE]: [createAvailabilitySlot({ time: '09:00' })]
      };

      availabilityService.getWeeklyAvailability.mockResolvedValue(availability);

      await invokeHandler(controller.getWeeklyAvailability, createReq({
        params: { doctorId: DOCTOR_ID },
        query: { startDate: FUTURE_DATE, weeks: '2' }
      }));

      expect(availabilityService.getWeeklyAvailability).toHaveBeenCalledWith(
        DOCTOR_ID,
        FUTURE_DATE,
        2
      );
      expect(responseBuilderMock.success).toHaveBeenCalled();
    });

    test('getNextAvailable returns message when no slot exists', async () => {
      const {
        controller,
        availabilityService,
        responseBuilderMock
      } = loadAvailabilityController();

      availabilityService.getNextAvailableSlot.mockResolvedValue(null);

      await invokeHandler(controller.getNextAvailable, createReq({
        params: { doctorId: DOCTOR_ID },
        query: { daysAhead: '5' }
      }));

      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          doctorId: DOCTOR_ID,
          message: expect.stringContaining('No hay disponibilidad'),
          nextSlot: null
        })
      );
    });

    test('checkSlot validates required fields', async () => {
      const { controller } = loadAvailabilityController();

      const next = await invokeHandler(controller.checkSlot, createReq({
        body: createSlotCheckBody({ time: undefined })
      }));

      expectNextError(next, 'doctorId, date y time');
    });

    test('checkSlot returns availability result', async () => {
      const {
        controller,
        availabilityService,
        responseBuilderMock
      } = loadAvailabilityController();
      const body = createSlotCheckBody();

      availabilityService.isSlotAvailable.mockResolvedValue(true);

      await invokeHandler(controller.checkSlot, createReq({ body }));

      expect(availabilityService.isSlotAvailable).toHaveBeenCalledWith(
        body.doctorId,
        body.date,
        body.time
      );
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          ...body,
          isAvailable: true
        }
      );
    });

    test('getNextAvailable returns next slot when availability exists', async () => {
      const {
        controller,
        availabilityService,
        responseBuilderMock
      } = loadAvailabilityController();
      const nextSlot = {
        date: FUTURE_DATE,
        slot: createAvailabilitySlot({ time: '09:00' })
      };

      availabilityService.getNextAvailableSlot.mockResolvedValue(nextSlot);

      await invokeHandler(controller.getNextAvailable, createReq({
        params: { doctorId: DOCTOR_ID },
        query: { daysAhead: '10' }
      }));

      expect(availabilityService.getNextAvailableSlot).toHaveBeenCalledWith(DOCTOR_ID, 10);
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          doctorId: DOCTOR_ID,
          nextSlot
        }
      );
    });
  });

  describe('Business layer - availability.routes', () => {
    test('contains availability routes for doctor slots', () => {
      const { router } = loadAvailabilityRoutes();

      expect(getRoutePaths(router)).toEqual(expect.arrayContaining([
        'get /doctor/:doctorId/date/:date',
        'get /doctor/:doctorId/weekly',
        'get /doctor/:doctorId/next',
        'post /check'
      ]));
    });
  });
});
