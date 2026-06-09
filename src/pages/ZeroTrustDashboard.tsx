import { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ShieldAlert, ShieldCheck, Shield, ShieldQuestion } from 'lucide-react';

export default function ZeroTrustDashboard() {
  const [tenantRisk, setTenantRisk] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  useEffect(() => {
    // In a real app, this would be an API call to /api/v2/risk/tenant
    // We mock it for the UI demonstration
    const mockTenantData = [
      { agent_id: 'AGENT-XDR-1', total_score: 92, level: 'Critical', last_calculated: new Date().toISOString() },
      { agent_id: 'AGENT-XDR-2', total_score: 75, level: 'High', last_calculated: new Date().toISOString() },
      { agent_id: 'AGENT-XDR-3', total_score: 45, level: 'Medium', last_calculated: new Date().toISOString() },
      { agent_id: 'AGENT-XDR-4', total_score: 12, level: 'Low', last_calculated: new Date().toISOString() }
    ];
    setTenantRisk(mockTenantData);
    
    // Select first critical agent by default
    fetchAgentDetails('AGENT-XDR-1');
  }, []);

  const fetchAgentDetails = (agentId: string) => {
    // Mock /api/v2/risk/agent/{agentId}
    setSelectedAgent({
      agent_id: agentId,
      total_score: 92,
      level: 'Critical',
      vectors: [
        { subject: 'Threat Intel', A: 95, fullMark: 100 },
        { subject: 'Behavioral', A: 80, fullMark: 100 },
        { subject: 'Process', A: 85, fullMark: 100 },
        { subject: 'Network', A: 70, fullMark: 100 },
        { subject: 'User', A: 40, fullMark: 100 },
        { subject: 'Device', A: 20, fullMark: 100 }
      ],
      timeline: [
        { time: '10:00', score: 20 },
        { time: '11:00', score: 22 },
        { time: '12:00', score: 45 },
        { time: '13:00', score: 92 }, // Spike due to IOC match
      ]
    });
  };

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen text-white">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#00ff8e]">Zero Trust Engine</h1>
        <p className="text-gray-400">Dynamic Risk Assessment & Autonomous Defense</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Critical', 'High', 'Medium', 'Low'].map(level => (
           <div key={level} className="bg-[#1a1a1a] border-gray-800">
             <div className="flex flex-row items-center justify-between pb-2">
               <h3 className="text-sm font-medium">{level} Risk Devices</h3>
               {level === 'Critical' && <ShieldAlert className={getStatusColor(level)} />}
               {level === 'High' && <ShieldQuestion className={getStatusColor(level)} />}
               {level === 'Medium' && <Shield className={getStatusColor(level)} />}
               {level === 'Low' && <ShieldCheck className={getStatusColor(level)} />}
             </div>
             <div className="p-4">
               <div className="text-2xl font-bold">
                 {tenantRisk.filter(r => r.level === level).length}
               </div>
             </div>
           </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-[#1a1a1a] border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-lg font-bold">Fleet Risk Profile</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-4">
              {tenantRisk.map(agent => (
                <li key={agent.agent_id} 
                    className="flex justify-between items-center p-3 hover:bg-[#2a2a2a] rounded cursor-pointer transition-colors"
                    onClick={() => fetchAgentDetails(agent.agent_id)}>
                  <div>
                    <p className="font-medium">{agent.agent_id}</p>
                    <p className="text-xs text-gray-500">Score: {agent.total_score}/100</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-bold bg-opacity-20 ${
                    agent.level === 'Critical' ? 'bg-red-500 text-red-500' :
                    agent.level === 'High' ? 'bg-orange-500 text-orange-500' :
                    agent.level === 'Medium' ? 'bg-yellow-500 text-yellow-500' :
                    'bg-green-500 text-green-500'
                  }`}>
                    {agent.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {selectedAgent && (
          <div className="col-span-2 space-y-6">
            <div className="bg-[#1a1a1a] border-gray-800">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-bold">Multi-Vector Risk Analysis: {selectedAgent.agent_id}</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedAgent.vectors}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" stroke="#888" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Risk Score" dataKey="A" stroke="#00ff8e" fill="#00ff8e" fillOpacity={0.4} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-[#1a1a1a] border-gray-800">
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-bold">Risk Trajectory (24h)</h3>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedAgent.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis domain={[0, 100]} stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }} />
                    <Line type="monotone" dataKey="score" stroke="#d200ff" strokeWidth={2} dot={{ r: 4, fill: '#d200ff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
