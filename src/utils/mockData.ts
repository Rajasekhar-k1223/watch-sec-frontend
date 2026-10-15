export const generateMockStats = () => {
    return {
        total_agents: 1248,
        online_agents: 1196 + Math.floor(Math.random() * 20 - 10),
        offline_agents: 52,
        critical_events: 12 + Math.floor(Math.random() * 5),
        total_events: 1245 + Math.floor(Math.random() * 50),
        high_risk_agents: 156 + Math.floor(Math.random() * 10),
        avg_cpu: 42 + Math.floor(Math.random() * 15 - 7),
        inbound_mbps: 1.8 + Math.random() * 0.5,
        outbound_mbps: 1.4 + Math.random() * 0.5,
        top_threats: [
            { name: "Malware", val: 42 + Math.floor(Math.random() * 5 - 2), color: "bg-red-500" },
            { name: "Phishing", val: 24 + Math.floor(Math.random() * 5 - 2), color: "bg-blue-500" },
            { name: "Suspicious Activity", val: 18 + Math.floor(Math.random() * 5 - 2), color: "bg-amber-500" },
            { name: "Brute Force", val: 9 + Math.floor(Math.random() * 3 - 1), color: "bg-purple-500" },
            { name: "Data Exfiltration", val: 7 + Math.floor(Math.random() * 3 - 1), color: "bg-teal-500" }
        ].sort((a, b) => b.val - a.val),
        os_distribution: [
            { name: 'Windows', value: 58.2, color: '#3b82f6' },
            { name: 'Linux', value: 24.1, color: '#10b981' },
            { name: 'macOS', value: 12.6, color: '#f59e0b' },
            { name: 'Others', value: 5.1, color: '#94a3b8' }
        ],
        resources: {
            trend: Array.from({ length: 10 }).map((_, i) => ({
                time: new Date(Date.now() - (9 - i) * 60000).toISOString(),
                cpu: 40 + Math.sin(i) * 20 + Math.random() * 10,
                mem: 50 + Math.cos(i) * 15 + Math.random() * 5,
                disk: 30 + Math.random() * 5,
                network: 20 + Math.sin(i) * 10 + Math.random() * 15
            }))
        }
    };
};

export const generateMockAgents = () => {
    return [
        { Id: 1, Hostname: "WIN-SRV-01", IpAddress: "192.168.1.10", OsInfo: "Windows Server 2022", LocationLat: 40, LocationLng: -100, IsOnline: true },
        { Id: 2, Hostname: "LNX-DB-01", IpAddress: "10.0.0.5", OsInfo: "Ubuntu 22.04", LocationLat: 50, LocationLng: 10, IsOnline: true },
        { Id: 3, Hostname: "MAC-DEV-01", IpAddress: "172.16.0.100", OsInfo: "macOS 14.0", LocationLat: 35, LocationLng: 105, IsOnline: true },
        { Id: 4, Hostname: "WIN-DESK-01", IpAddress: "192.168.1.50", OsInfo: "Windows 11", LocationLat: -15, LocationLng: -60, IsOnline: true },
        { Id: 5, Hostname: "LNX-WEB-01", IpAddress: "10.0.0.10", OsInfo: "Debian 12", LocationLat: 5, LocationLng: 20, IsOnline: false },
        { Id: 6, Hostname: "AWS-EC2-01", IpAddress: "3.22.5.1", OsInfo: "Amazon Linux 2023", LocationLat: 39.0438, LocationLng: -77.4874, IsOnline: true },
        { Id: 7, Hostname: "AZURE-VM-01", IpAddress: "52.168.10.1", OsInfo: "Windows Server 2019", LocationLat: 47.6062, LocationLng: -122.3321, IsOnline: true }
    ];
};
