const core = require('./core.tables.json');
const appointment = require('./appointment.tables.json');
const clinical = require('./clinical.tables.json');
const billing = require('./billing.tables.json');
const quality = require('./quality.tables.json');
const integration = require('./integration.tables.json');

const groupedTables = {
  core,
  appointment,
  clinical,
  billing,
  quality,
  integration
};

const allTables = Object.values(groupedTables).flat();

module.exports = {
  groupedTables,
  allTables
};