// Sovereign Air-Gapped Analytics Stub
// Prevents external SaaS telemetry egress in accordance with sovereign compliance requirements

export const Analytics = {
    init: () => {
        // Sovereign air-gapped mode: external telemetry disabled
    },

    identify: (_userId: string, _traits?: any) => {
        // Sovereign air-gapped mode
    },

    track: (_event: string, _props?: any) => {
        // Sovereign air-gapped mode
    },

    reset: () => {
        // Sovereign air-gapped mode
    }
};
