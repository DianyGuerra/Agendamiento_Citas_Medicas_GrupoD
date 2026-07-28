import { setup } from './medical_flows.js';
import medicalFlows from './medical_flows.js';

export const options = {
    stages: [
    { duration: '10s', target: 650 }, // ⚡ Impacto: de 0 a 850 usuarios en 10 segundos
    { duration: '1m', target: 650 },  // Sostiene el pico máximo por 1 minuto
    { duration: '10s', target: 0 },   // Cae inmediatamente a 0 para ver la recuperación
  ],
  thresholds: {
    http_req_duration: ['p(95)<1200'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
  },
};

export { setup };
export default medicalFlows;
