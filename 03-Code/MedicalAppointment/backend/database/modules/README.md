# Database Modules

This folder groups database tables by domain to keep schema references modular.

- `core.tables.json`: users, roles, patient and doctor identity data.
- `appointment.tables.json`: appointment lifecycle, schedules and waiting list.
- `clinical.tables.json`: medical records, notes, prescriptions and labs.
- `billing.tables.json`: invoices, items, services and insurance.
- `quality.tables.json`: ratings, surveys and metrics.
- `integration.tables.json`: reminders, notifications, audit and QR access logs.

`index.js` exports:

- `groupedTables`: table names by domain
- `allTables`: flat list with all table names