# k6 performance tests for MedicalAppointment

Files:
- `medical_flows.js` — script that implements Patient, Doctor and Admin flows from the Postman collection.
- `soak_test.js` — soak test script for long-duration stability.
- `spike_test.js` — spike test script for sudden traffic bursts.

Usage examples (from repo root):

```bash
# install k6 from https://k6.io/
# run with environment variables: replace values as needed
k6 run \
  -e externalBaseUrl=http://localhost:3000 \
  -e crudBaseUrl=http://localhost:3001 \
  -e businessBaseUrl=http://localhost:3002 \
  -e patientEmail=patient@example.com \
  -e patientPassword=changeme \
  -e doctorEmail=doctor@example.com \
  -e doctorPassword=changeme \
  -e adminEmail=admin@example.com \
  -e adminPassword=changeme \
  -e TARGET_VUS=50 \
  -e WARMUP_DURATION=1m \
  -e LOAD_DURATION=10m \
  -e COOLDOWN_DURATION=1m \
  backend/performance/k6/medical_flows.js
```

Soak test example:

```bash
k6 run \
  -e externalBaseUrl=http://localhost:3000 \
  -e crudBaseUrl=http://localhost:3001 \
  -e businessBaseUrl=http://localhost:3002 \
  -e patientEmail=patient@example.com \
  -e patientPassword=changeme \
  -e doctorEmail=doctor@example.com \
  -e doctorPassword=changeme \
  -e adminEmail=admin@example.com \
  -e adminPassword=changeme \
  -e TARGET_VUS=100 \
  -e WARMUP_DURATION=2m \
  -e LOAD_DURATION=30m \
  -e COOLDOWN_DURATION=2m \
  backend/performance/k6/soak_test.js
```

Spike test example:

```bash
k6 run \
  -e externalBaseUrl=http://localhost:3000 \
  -e crudBaseUrl=http://localhost:3001 \
  -e businessBaseUrl=http://localhost:3002 \
  -e patientEmail=patient@example.com \
  -e patientPassword=changeme \
  -e doctorEmail=doctor@example.com \
  -e doctorPassword=changeme \
  -e adminEmail=admin@example.com \
  -e adminPassword=changeme \
  -e BASELINE_VUS=10 \
  -e PEAK_VUS=200 \
  backend/performance/k6/spike_test.js
```

Notes:
- Control which flows run using `-e FLOWS=patient,doctor,admin` (default runs all).
- You can provide `scheduledDate`, `scheduledTime` or `scheduledStart` to control booking time; otherwise script selects next day.
- Tune `TARGET_VUS`, durations, and `ITERATION_SLEEP_MS` to shape request pacing.
