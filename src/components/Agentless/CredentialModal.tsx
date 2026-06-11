import { useState } from 'react';

interface CredentialModalProps {
  onClose: () => void;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({ onClose }) => {
  const [osType, setOsType] = useState('linux');
  const [password, setPassword] = useState('');
  
  const handleSave = () => {
    // Simulated save to vault
    alert('Credentials encrypted and saved securely to vault.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-emerald-500/30 p-6 rounded-lg w-full max-w-md shadow-2xl shadow-emerald-900/20">
        <h2 className="text-xl font-bold text-emerald-400 mb-4 font-mono">Secure Credential Vault</h2>
        <p className="text-xs text-gray-400 mb-4 font-mono">
          Enter endpoint credentials for Agentless access. All data is protected via AES-GCM envelope encryption.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-emerald-500 mb-1">Target OS</label>
            <select 
              value={osType} 
              onChange={(e) => setOsType(e.target.value)}
              className="w-full bg-gray-800 border border-emerald-500/50 rounded p-2 text-white font-mono focus:outline-none focus:border-emerald-400"
            >
              <option value="linux">Linux (SSH Key / Password)</option>
              <option value="windows">Windows (WinRM Password)</option>
            </select>
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
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded font-mono hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 text-white rounded font-mono hover:bg-emerald-500 transition shadow-[0_0_10px_rgba(16,185,129,0.4)]"
            >
              Encrypt & Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
