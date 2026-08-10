import { useState } from 'react';
import { API_URL } from '../../config';

interface CredentialModalProps {
  onClose: () => void;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({ onClose }) => {
  const [ip, setIp] = useState('');
  const [osType, setOsType] = useState('linux');
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (!ip) {
      import('react-hot-toast').then(t => t.default.error("Target IP is required"));
      return;
    }
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API_URL}/v2/agentless/credentials/${ip}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
              os_type: osType,
              username: username,
              password: password
          })
      });
      if (res.ok) {
        import('react-hot-toast').then(t => t.default.success("Credentials securely vaulted"));
        onClose();
      } else {
        import('react-hot-toast').then(t => t.default.error("Failed to vault credentials"));
      }
    } catch (e) {
      console.error(e);
      import('react-hot-toast').then(t => t.default.error("Error connecting to Vault API"));
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-emerald-500/30 p-6 rounded-lg w-full max-w-md shadow-2xl shadow-emerald-900/20">
        <h2 className="text-xl font-bold text-emerald-400 mb-4 font-mono">Secure Credential Vault</h2>
        <p className="text-xs text-gray-400 mb-4 font-mono">
          Enter endpoint credentials for Agentless access to {ip}. All data is protected via AES-GCM envelope encryption.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-emerald-500 mb-1">Target IP</label>
            <input 
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full bg-gray-800 border border-emerald-500/50 rounded p-2 text-white font-mono focus:outline-none focus:border-emerald-400"
              placeholder="e.g. 192.168.1.100"
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-emerald-500 mb-1">Target OS</label>
            <select 
              value={osType} 
              onChange={(e) => setOsType(e.target.value)}
              className="w-full bg-gray-800 border border-emerald-500/50 rounded p-2 text-white font-mono focus:outline-none focus:border-emerald-400"
            >
              <option value="linux">Linux (SSH)</option>
              <option value="windows">Windows (WinRM)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-mono text-emerald-500 mb-1">Username</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-emerald-500/50 rounded p-2 text-white font-mono focus:outline-none focus:border-emerald-400"
              placeholder="e.g., root, Administrator"
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-emerald-500 mb-1">Credentials / Key Data</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-emerald-500/50 rounded p-2 text-white font-mono focus:outline-none focus:border-emerald-400"
              placeholder="Enter SSH Key or Password..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded font-mono hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded font-mono hover:bg-emerald-500 transition shadow-[0_0_10px_rgba(16,185,129,0.4)] disabled:opacity-50"
            >
              {isSaving ? 'Encrypting...' : 'Encrypt & Store'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
