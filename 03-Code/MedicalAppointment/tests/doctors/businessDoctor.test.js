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

const loadFreshAvailabilityService = () => {
  jest.resetModules();
  jest.clearAllMocks();
  return loadAvailabilityService();
};

const loadFreshAvailabilityController = () => {
  jest.resetModules();
  jest.clearAllMocks();
  return loadAvailabilityController();
};

describe('Doctor module unit tests - Business layer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  // ========================================================================
  // SERVICE: valida la logica de disponibilidad, horarios y consultas Supabase.
  // ========================================================================
  describe('Business layer - availability.service', () => {
    test('rejects invalid dates and returns empty slots when the doctor is unavailable', async () => {
      // Cubre fecha pasada, vacaciones, dia libre, falta de horario y dia no laborable.
      let context = loadFreshAvailabilityService();
      await expect(
        context.service.getAvailableSlots(DOCTOR_ID, '2000-01-01')
      ).rejects.toThrow('No se pueden consultar fechas pasadas');

      context = loadFreshAvailabilityService();
      context.fromMock.mockReturnValueOnce(createSuccessfulQuery(createScheduleException()));
      await expect(context.service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE)).resolves.toEqual([]);
      expect(context.fromMock).toHaveBeenCalledWith('schedule_exceptions');

      context = loadFreshAvailabilityService();
      context.fromMock.mockReturnValueOnce(createSuccessfulQuery(
        createScheduleException({ exception_type: 'day_off' })
      ));
      await expect(context.service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE)).resolves.toEqual([]);

      context = loadFreshAvailabilityService();
      context.fromMock
        .mockReturnValueOnce(createMissingRowQuery())
        .mockReturnValueOnce(createMissingRowQuery());
      await expect(context.service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE)).resolves.toEqual([]);
      expect(context.fromMock).toHaveBeenCalledWith('doctor_schedules');

      context = loadFreshAvailabilityService();
      context.fromMock
        .mockReturnValueOnce(createMissingRowQuery())
        .mockReturnValueOnce(createSuccessfulQuery(createSchedule({ is_working_day: false })));
      await expect(context.service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE)).resolves.toEqual([]);
    });

    test('generates available slots from regular schedules, exceptions, and slot lookups', async () => {
      // Cubre generacion de slots, exclusion de citas ocupadas, horario personalizado e isSlotAvailable.
      let context = loadFreshAvailabilityService();
      context.fromMock
        .mockReturnValueOnce(createMissingRowQuery())
        .mockReturnValueOnce(createSuccessfulQuery(createSchedule({
          break_start_time: '10:00',
          break_end_time: '10:30'
        })))
        .mockReturnValueOnce(createSuccessfulQuery([
          createBookedAppointment({ scheduled_start: `${FUTURE_DATE}T09:30:00` })
        ]));

      const regularSlots = await context.service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE);

      expect(context.fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(context.fromMock).toHaveBeenCalledWith('doctor_schedules');
      expect(context.fromMock).toHaveBeenCalledWith('appointments');
      expect(regularSlots).toEqual([
        createAvailabilitySlot({ time: '09:00' }),
        createAvailabilitySlot({ time: '10:30' })
      ]);

      context = loadFreshAvailabilityService();
      context.fromMock
        .mockReturnValueOnce(createSuccessfulQuery(createScheduleException({
          exception_type: 'custom_hours',
          exception_start_time: '08:00',
          exception_end_time: '09:00'
        })))
        .mockReturnValueOnce(createSuccessfulQuery([]));

      await expect(context.service.getAvailableSlots(DOCTOR_ID, FUTURE_DATE)).resolves.toEqual([
        createAvailabilitySlot({ time: '08:00' }),
        createAvailabilitySlot({ time: '08:30' })
      ]);

      context = loadFreshAvailabilityService();
      jest.spyOn(context.service, 'getAvailableSlots').mockResolvedValue([
        createAvailabilitySlot({ time: '09:00' }),
        createAvailabilitySlot({ time: '09:30' })
      ]);

      await expect(context.service.isSlotAvailable(DOCTOR_ID, FUTURE_DATE, '09:30')).resolves.toBe(true);
      expect(context.service.getAvailableSlots).toHaveBeenCalledWith(DOCTOR_ID, FUTURE_DATE);
    });

    test('builds weekly availability and finds next slots while handling empty days', async () => {
      // Cubre agenda semanal, fechas con error, proximo cupo disponible y ausencia total de cupos.
      let context = loadFreshAvailabilityService();
      const availableSlots = [createAvailabilitySlot({ time: '09:00' })];

      jest.spyOn(context.service, 'getAvailableSlots')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(availableSlots)
        .mockResolvedValue([]);

      const weeklyAvailability = await context.service.getWeeklyAvailability(DOCTOR_ID, FUTURE_DATE, 1);
      expect(Object.values(weeklyAvailability)).toEqual([availableSlots]);

      context = loadFreshAvailabilityService();
      jest.spyOn(context.service, 'getAvailableSlots')
        .mockRejectedValueOnce(new Error('past date'))
        .mockResolvedValueOnce(availableSlots)
        .mockResolvedValue([]);

      const weeklyWithSkippedErrors = await context.service.getWeeklyAvailability(DOCTOR_ID, FUTURE_DATE, 1);
      expect(Object.values(weeklyWithSkippedErrors)).toEqual([availableSlots]);

      context = loadFreshAvailabilityService();
      const slot = createAvailabilitySlot({ time: '09:00' });
      jest.spyOn(context.service, 'getAvailableSlots')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([slot]);

      await expect(context.service.getNextAvailableSlot(DOCTOR_ID, 2)).resolves.toEqual(
        expect.objectContaining({ slot })
      );

      context = loadFreshAvailabilityService();
      jest.spyOn(context.service, 'getAvailableSlots').mockResolvedValue([]);

      await expect(context.service.getNextAvailableSlot(DOCTOR_ID, 3)).resolves.toBeNull();
      expect(context.service.getAvailableSlots).toHaveBeenCalledTimes(3);
    });

    test('handles private helper queries, formatting, and Supabase errors', async () => {
      // Cubre helpers internos: citas ocupadas, dia de semana, errores de excepciones/horarios y fallos tolerados.
      let context = loadFreshAvailabilityService();
      context.fromMock.mockReturnValueOnce(createSuccessfulQuery([
        createBookedAppointment({ scheduled_start: `${FUTURE_DATE}T08:30:00` }),
        createBookedAppointment({ scheduled_start: null })
      ]));

      await expect(context.service._getBookedSlots(DOCTOR_ID, FUTURE_DATE)).resolves.toEqual(['08:30']);

      const day = context.service._getDayOfWeek(FUTURE_DATE);
      expect(typeof day).toBe('number');
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);

      context = loadFreshAvailabilityService();
      const exceptionError = { code: '500', message: 'exception query failed' };
      context.fromMock.mockReturnValueOnce(createSupabaseErrorQuery(exceptionError.message));
      await expect(context.service._getException(DOCTOR_ID, FUTURE_DATE)).rejects.toEqual(exceptionError);

      context = loadFreshAvailabilityService();
      const scheduleError = { code: '500', message: 'schedule query failed' };
      context.fromMock.mockReturnValueOnce(createSupabaseErrorQuery(scheduleError.message));
      await expect(context.service._getSchedule(DOCTOR_ID, 1)).rejects.toEqual(scheduleError);

      context = loadFreshAvailabilityService();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      context.fromMock.mockReturnValueOnce(createQueryMock({
        data: null,
        error: { message: 'booked slots failed' }
      }));

      await expect(context.service._getBookedSlots(DOCTOR_ID, FUTURE_DATE)).resolves.toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ========================================================================
  // CONTROLLER: valida entradas HTTP y delegacion al servicio de disponibilidad.
  // ========================================================================
  describe('Business layer - availability.controller', () => {
    test('returns slot summaries, weekly availability, and next-slot responses', async () => {
      // Cubre respuestas exitosas y el mensaje cuando no existe proximo cupo.
      let context = loadFreshAvailabilityController();
      const slots = [
        createAvailabilitySlot({ time: '09:00' }),
        createAvailabilitySlot({ time: '09:30' })
      ];
      context.availabilityService.getAvailableSlots.mockResolvedValue(slots);

      await invokeHandler(context.controller.getSlots, createReq({
        params: createAvailabilityParams()
      }));

      expect(context.availabilityService.getAvailableSlots).toHaveBeenCalledWith(DOCTOR_ID, FUTURE_DATE);
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          doctorId: DOCTOR_ID,
          date: FUTURE_DATE,
          slots,
          totalSlots: 2
        }
      );

      context = loadFreshAvailabilityController();
      const availability = { [FUTURE_DATE]: [createAvailabilitySlot({ time: '09:00' })] };
      context.availabilityService.getWeeklyAvailability.mockResolvedValue(availability);
      await invokeHandler(context.controller.getWeeklyAvailability, createReq({
        params: { doctorId: DOCTOR_ID },
        query: { startDate: FUTURE_DATE, weeks: '2' }
      }));
      expect(context.availabilityService.getWeeklyAvailability).toHaveBeenCalledWith(
        DOCTOR_ID,
        FUTURE_DATE,
        2
      );

      context = loadFreshAvailabilityController();
      context.availabilityService.getNextAvailableSlot.mockResolvedValue(null);
      await invokeHandler(context.controller.getNextAvailable, createReq({
        params: { doctorId: DOCTOR_ID },
        query: { daysAhead: '5' }
      }));
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          doctorId: DOCTOR_ID,
          message: expect.stringContaining('No hay disponibilidad'),
          nextSlot: null
        })
      );

      context = loadFreshAvailabilityController();
      const nextSlot = {
        date: FUTURE_DATE,
        slot: createAvailabilitySlot({ time: '09:00' })
      };
      context.availabilityService.getNextAvailableSlot.mockResolvedValue(nextSlot);
      await invokeHandler(context.controller.getNextAvailable, createReq({
        params: { doctorId: DOCTOR_ID },
        query: { daysAhead: '10' }
      }));
      expect(context.availabilityService.getNextAvailableSlot).toHaveBeenCalledWith(DOCTOR_ID, 10);
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        { doctorId: DOCTOR_ID, nextSlot }
      );
    });

    test('validates required request fields and checks a specific slot', async () => {
      // Cubre validaciones de getSlots/checkSlot y el resultado de disponibilidad puntual.
      let context = loadFreshAvailabilityController();
      const missingParams = await invokeHandler(context.controller.getSlots, createReq({
        params: createAvailabilityParams({ doctorId: null })
      }));
      expectNextError(missingParams, 'doctorId y date');

      context = loadFreshAvailabilityController();
      const missingCheckField = await invokeHandler(context.controller.checkSlot, createReq({
        body: createSlotCheckBody({ time: undefined })
      }));
      expectNextError(missingCheckField, 'doctorId, date y time');

      context = loadFreshAvailabilityController();
      const body = createSlotCheckBody();
      context.availabilityService.isSlotAvailable.mockResolvedValue(true);
      await invokeHandler(context.controller.checkSlot, createReq({ body }));
      expect(context.availabilityService.isSlotAvailable).toHaveBeenCalledWith(
        body.doctorId,
        body.date,
        body.time
      );
      expect(context.responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          ...body,
          isAvailable: true
        }
      );
    });
  });

  // ========================================================================
  // ROUTES: valida que Express exponga los endpoints del modulo business.
  // ========================================================================
  describe('Business layer - availability.routes', () => {
    test('contains availability routes for doctor slots', () => {
      // Confirma la superficie HTTP de disponibilidad usada por doctores/pacientes.
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
