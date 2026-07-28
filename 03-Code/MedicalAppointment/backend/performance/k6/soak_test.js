import { setup } from './medical_flows.js';
import medicalFlows from './medical_flows.js';
export const options = {
  stages: [
    { duration: '1m', target: 350 },  // Subida inicial rápida a una carga media
    { duration: '8m', target: 350 },  // ⏳ Mantiene los 350 VUs estables durante 6 minutos
    { duration: '1m', target: 0 },    // Cierre y liberación de recursos
  ],
  thresholds: {
    http_req_duration: ['p(95)<1200'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
  },
};

export { setup };
export default medicalFlows;
