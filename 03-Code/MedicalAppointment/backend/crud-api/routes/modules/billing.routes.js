const billingRoutes = require('../billing.routes');
const billingItemRoutes = require('../billingItem.routes');
const insuranceProviderRoutes = require('../insuranceProvider.routes');

module.exports = [
  { path: '/billings', router: billingRoutes },
  { path: '/billing-items', router: billingItemRoutes },
  { path: '/insurance-providers', router: insuranceProviderRoutes }
];