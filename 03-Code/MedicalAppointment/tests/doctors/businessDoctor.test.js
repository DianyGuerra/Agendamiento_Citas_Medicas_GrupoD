const {
  createQueryMock,
  invokeHandler,
  loadAvailabilityService,
  loadAvailabilityController,
  loadAvailabilityRoutes
} = require('./helpers');

describe('Doctor module unit tests - Business layer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  //-----------------------------------------------------------------------------------------------------------------------------
  // 												Business layer - availability.service
  //-----------------------------------------------------------------------------------------------------------------------------

  describe('Business layer - availability.service', () => {
    test('getAvailableSlots rejects past dates', async () => {
      const { service } = loadAvailabilityService();

      await expect(
        service.getAvailableSlots('doc-1', '2000-01-01')
      ).rejects.toThrow('No se pueden consultar fechas pasadas');
    });

    test('getAvailableSlots returns empty list when doctor has vacation exception', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const exceptionQuery = createQueryMock({
        data: {
          id: 'exception-1',
          exception_type: 'vacation'
        },
        error: null
      });

      fromMock.mockReturnValueOnce(exceptionQuery);

      const slots = await service.getAvailableSlots('doc-1', '2099-01-05');

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(slots).toEqual([]);
    });

    test('getAvailableSlots generates slots and excludes booked time', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const noExceptionQuery = createQueryMock({
        data: null,
        error: { code: 'PGRST116' }
      });

      const scheduleQuery = createQueryMock({
        data: {
          start_time: '09:00',
          end_time: '11:00',
          break_start_time: '10:00',
          break_end_time: '10:30',
          is_working_day: true
        },
        error: null
      });

      const bookedQuery = createQueryMock({
        data: [
          {
            scheduled_start: '2099-01-05T09:30:00',
            appointment_status: { code: 'scheduled' }
          }
        ],
        error: null
      });

      fromMock
        .mockReturnValueOnce(noExceptionQuery)
        .mockReturnValueOnce(scheduleQuery)
        .mockReturnValueOnce(bookedQuery);

      const slots = await service.getAvailableSlots('doc-1', '2099-01-05');

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(fromMock).toHaveBeenCalledWith('doctor_schedules');
      expect(fromMock).toHaveBeenCalledWith('appointments');

      expect(slots).toEqual([
        { time: '09:00', available: true, duration: 30 },
        { time: '10:30', available: true, duration: 30 }
      ]);
    });

    test('isSlotAvailable returns true when requested time exists in available slots', async () => {
      const { service } = loadAvailabilityService();

      jest.spyOn(service, 'getAvailableSlots').mockResolvedValue([
        { time: '09:00', available: true, duration: 30 },
        { time: '09:30', available: true, duration: 30 }
      ]);

      const result = await service.isSlotAvailable('doc-1', '2099-01-05', '09:30');

      expect(result).toBe(true);
      expect(service.getAvailableSlots).toHaveBeenCalledWith('doc-1', '2099-01-05');
    });

    test('getWeeklyAvailability only includes days with available slots', async () => {
      const { service } = loadAvailabilityService();

      jest.spyOn(service, 'getAvailableSlots')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ time: '09:00' }])
        .mockResolvedValue([]);

      const availability = await service.getWeeklyAvailability('doc-1', '2099-01-05', 1);

      expect(Object.values(availability)).toEqual([[{ time: '09:00' }]]);
    });

    test('getNextAvailableSlot returns the first future day with availability', async () => {
      const { service } = loadAvailabilityService();

      jest.spyOn(service, 'getAvailableSlots')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ time: '09:00', available: true, duration: 30 }]);

      const result = await service.getNextAvailableSlot('doc-1', 2);

      expect(result).toEqual(
        expect.objectContaining({
          slot: { time: '09:00', available: true, duration: 30 }
        })
      );
    });

    test('_getBookedSlots returns formatted booked appointment times', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const bookedQuery = createQueryMock({
        data: [
          { scheduled_start: '2099-01-05T08:30:00' },
          { scheduled_start: null }
        ],
        error: null
      });

      fromMock.mockReturnValueOnce(bookedQuery);

      const booked = await service._getBookedSlots('doc-1', '2099-01-05');

      expect(booked).toEqual(['08:30']);
    });

    test('_getDayOfWeek returns numeric day of week', () => {
      const { service } = loadAvailabilityService();

      const day = service._getDayOfWeek('2099-01-05');

      expect(typeof day).toBe('number');
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    });

	    test('getAvailableSlots returns empty list when doctor has day_off exception', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const exceptionQuery = createQueryMock({
        data: {
          id: 'exception-1',
          exception_type: 'day_off'
        },
        error: null
      });

      fromMock.mockReturnValueOnce(exceptionQuery);

      const slots = await service.getAvailableSlots('doc-1', '2099-01-05');

      expect(slots).toEqual([]);
      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
    });

    test('getAvailableSlots uses custom exception hours when exception has start and end time', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const exceptionQuery = createQueryMock({
        data: {
          id: 'exception-1',
          exception_type: 'custom_hours',
          exception_start_time: '08:00',
          exception_end_time: '09:00'
        },
        error: null
      });

      const bookedQuery = createQueryMock({
        data: [],
        error: null
      });

      fromMock
        .mockReturnValueOnce(exceptionQuery)
        .mockReturnValueOnce(bookedQuery);

      const slots = await service.getAvailableSlots('doc-1', '2099-01-05');

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(fromMock).toHaveBeenCalledWith('appointments');
      expect(slots).toEqual([
        { time: '08:00', available: true, duration: 30 },
        { time: '08:30', available: true, duration: 30 }
      ]);
    });

    test('getAvailableSlots returns empty list when doctor has no regular schedule', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const noExceptionQuery = createQueryMock({
        data: null,
        error: { code: 'PGRST116' }
      });

      const noScheduleQuery = createQueryMock({
        data: null,
        error: { code: 'PGRST116' }
      });

      fromMock
        .mockReturnValueOnce(noExceptionQuery)
        .mockReturnValueOnce(noScheduleQuery);

      const slots = await service.getAvailableSlots('doc-1', '2099-01-05');

      expect(fromMock).toHaveBeenCalledWith('schedule_exceptions');
      expect(fromMock).toHaveBeenCalledWith('doctor_schedules');
      expect(slots).toEqual([]);
    });

    test('getAvailableSlots returns empty list when regular schedule is not a working day', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const noExceptionQuery = createQueryMock({
        data: null,
        error: { code: 'PGRST116' }
      });

      const scheduleQuery = createQueryMock({
        data: {
          start_time: '09:00',
          end_time: '12:00',
          is_working_day: false
        },
        error: null
      });

      fromMock
        .mockReturnValueOnce(noExceptionQuery)
        .mockReturnValueOnce(scheduleQuery);

      const slots = await service.getAvailableSlots('doc-1', '2099-01-05');

      expect(slots).toEqual([]);
    });

    test('_getException throws error when Supabase returns unexpected error', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const exceptionQuery = createQueryMock({
        data: null,
        error: { code: '500', message: 'exception query failed' }
      });

      fromMock.mockReturnValueOnce(exceptionQuery);

      await expect(
        service._getException('doc-1', '2099-01-05')
      ).rejects.toEqual({ code: '500', message: 'exception query failed' });
    });

    test('_getSchedule throws error when Supabase returns unexpected error', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const scheduleQuery = createQueryMock({
        data: null,
        error: { code: '500', message: 'schedule query failed' }
      });

      fromMock.mockReturnValueOnce(scheduleQuery);

      await expect(
        service._getSchedule('doc-1', 1)
      ).rejects.toEqual({ code: '500', message: 'schedule query failed' });
    });

    test('_getBookedSlots returns empty array when query fails', async () => {
      const { service, fromMock } = loadAvailabilityService();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const bookedQuery = createQueryMock({
        data: null,
        error: { message: 'booked slots failed' }
      });

      fromMock.mockReturnValueOnce(bookedQuery);

      const booked = await service._getBookedSlots('doc-1', '2099-01-05');

      expect(booked).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('getWeeklyAvailability skips dates that throw errors', async () => {
      const { service } = loadAvailabilityService();

      jest.spyOn(service, 'getAvailableSlots')
        .mockRejectedValueOnce(new Error('past date'))
        .mockResolvedValueOnce([{ time: '09:00' }])
        .mockResolvedValue([]);

      const availability = await service.getWeeklyAvailability('doc-1', '2099-01-05', 1);

      expect(Object.values(availability)).toEqual([[{ time: '09:00' }]]);
    });

    test('getNextAvailableSlot returns null when no available slots are found', async () => {
      const { service } = loadAvailabilityService();

      jest.spyOn(service, 'getAvailableSlots').mockResolvedValue([]);

      const result = await service.getNextAvailableSlot('doc-1', 3);

      expect(result).toBeNull();
      expect(service.getAvailableSlots).toHaveBeenCalledTimes(3);
    });
  });
  
  //-----------------------------------------------------------------------------------------------------------------------------
  // 												Business layer - availability.controller
  //-----------------------------------------------------------------------------------------------------------------------------

  describe('Business layer - availability.controller', () => {
    test('getSlots returns doctor slots summary', async () => {
      const {
        controller,
        availabilityService,
        responseBuilderMock
      } = loadAvailabilityController();

      availabilityService.getAvailableSlots.mockResolvedValue([
        { time: '09:00' },
        { time: '09:30' }
      ]);

      await invokeHandler(controller.getSlots, {
        params: {
          doctorId: 'doc-1',
          date: '2099-01-05'
        }
      });

      expect(availabilityService.getAvailableSlots).toHaveBeenCalledWith(
        'doc-1',
        '2099-01-05'
      );

      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          doctorId: 'doc-1',
          date: '2099-01-05',
          slots: [{ time: '09:00' }, { time: '09:30' }],
          totalSlots: 2
        }
      );
    });

    test('getSlots sends ValidationError when doctorId or date is missing', async () => {
      const { controller } = loadAvailabilityController();

      const next = await invokeHandler(controller.getSlots, {
        params: {
          doctorId: null,
          date: '2099-01-05'
        }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('doctorId y date');
    });

    test('getWeeklyAvailability returns weekly availability map', async () => {
      const {
        controller,
        availabilityService,
        responseBuilderMock
      } = loadAvailabilityController();

      availabilityService.getWeeklyAvailability.mockResolvedValue({
        '2099-01-05': [{ time: '09:00' }]
      });

      await invokeHandler(controller.getWeeklyAvailability, {
        params: { doctorId: 'doc-1' },
        query: { startDate: '2099-01-05', weeks: '2' }
      });

      expect(availabilityService.getWeeklyAvailability).toHaveBeenCalledWith(
        'doc-1',
        '2099-01-05',
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

      await invokeHandler(controller.getNextAvailable, {
        params: { doctorId: 'doc-1' },
        query: { daysAhead: '5' }
      });

      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          doctorId: 'doc-1',
          message: 'No hay disponibilidad en los próximos días',
          nextSlot: null
        }
      );
    });

    test('checkSlot validates required fields', async () => {
      const { controller } = loadAvailabilityController();

      const next = await invokeHandler(controller.checkSlot, {
        body: {
          doctorId: 'doc-1',
          date: '2099-01-05'
        }
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].message).toContain('doctorId, date y time');
    });

    test('checkSlot returns availability result', async () => {
      const {
        controller,
        availabilityService,
        responseBuilderMock
      } = loadAvailabilityController();

      availabilityService.isSlotAvailable.mockResolvedValue(true);

      await invokeHandler(controller.checkSlot, {
        body: {
          doctorId: 'doc-1',
          date: '2099-01-05',
          time: '09:00'
        }
      });

      expect(availabilityService.isSlotAvailable).toHaveBeenCalledWith(
        'doc-1',
        '2099-01-05',
        '09:00'
      );

      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          doctorId: 'doc-1',
          date: '2099-01-05',
          time: '09:00',
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

      availabilityService.getNextAvailableSlot.mockResolvedValue({
        date: '2099-01-05',
        slot: { time: '09:00', available: true, duration: 30 }
      });

      await invokeHandler(controller.getNextAvailable, {
        params: { doctorId: 'doc-1' },
        query: { daysAhead: '10' }
      });

      expect(availabilityService.getNextAvailableSlot).toHaveBeenCalledWith('doc-1', 10);
      expect(responseBuilderMock.success).toHaveBeenCalledWith(
        expect.anything(),
        {
          doctorId: 'doc-1',
          nextSlot: {
            date: '2099-01-05',
            slot: { time: '09:00', available: true, duration: 30 }
          }
        }
      );
    });
  });

  //-----------------------------------------------------------------------------------------------------------------------------
  // 												Business layer - availability.routes
  //-----------------------------------------------------------------------------------------------------------------------------

  describe('Business layer - availability.routes', () => {
    test('contains availability routes for doctor slots', () => {
      const { router } = loadAvailabilityRoutes();

      const routePaths = router.stack
        .filter((layer) => layer.route)
        .map((layer) => `${Object.keys(layer.route.methods)[0]} ${layer.route.path}`);

      expect(routePaths).toEqual(
        expect.arrayContaining([
          'get /doctor/:doctorId/date/:date',
          'get /doctor/:doctorId/weekly',
          'get /doctor/:doctorId/next',
          'post /check'
        ])
      );
    });
  });
});