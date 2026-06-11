import { apiPost } from './api';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const agentlessApi = {
    scanSubnet: async (subnet: string) => {
        return apiPost(`${BASE_URL}/v2/agentless/scan?subnet=${encodeURIComponent(subnet)}`);
    },
    
    pollEndpoint: async (ip: string, osType: string, credId: string) => {
        return apiPost(`${BASE_URL}/v2/agentless/poll/${encodeURIComponent(ip)}?os_type=${encodeURIComponent(osType)}&credentials_id=${encodeURIComponent(credId)}`);
    },
    
    enforcePolicy: async (ip: string, osType: string, policyData: any) => {
        return apiPost(`${BASE_URL}/v2/agentless/enforce/${encodeURIComponent(ip)}?os_type=${encodeURIComponent(osType)}`, policyData);
    },
    
    remediateThreat: async (ip: string, osType: string, action: string, target: string) => {
        return apiPost(`${BASE_URL}/v2/agentless/remediate/${encodeURIComponent(ip)}?os_type=${encodeURIComponent(osType)}&action=${encodeURIComponent(action)}&target=${encodeURIComponent(target)}`);
    },
    
    deployNativeSensors: async (ip: string, osType: string) => {
        return apiPost(`${BASE_URL}/v2/agentless/sensors/deploy/${encodeURIComponent(ip)}?os_type=${encodeURIComponent(osType)}`);
    }
};
