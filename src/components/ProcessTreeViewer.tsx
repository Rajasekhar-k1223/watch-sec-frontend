import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ShieldAlert, Cpu } from 'lucide-react';

interface ProcessNode {
  id: number;
  pid: number;
  ppid: number | null;
  name: string;
  cmdline: string;
  is_malicious: boolean;
  tactic: string | null;
  children: ProcessNode[];
}

const TreeNode: React.FC<{ node: ProcessNode, defaultExpanded?: boolean }> = ({ node, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div className="ml-4 mt-2">
      <div 
        className={`flex items-start p-2 rounded border ${node.is_malicious ? 'border-red-500 bg-red-900 bg-opacity-20' : 'border-gray-800 bg-[#1a1a1a]'} hover:bg-[#2a2a2a] transition-colors`}
      >
        <div 
          className="mt-1 mr-2 cursor-pointer text-gray-400" 
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {hasChildren ? (expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <span className="w-4 h-4 inline-block"></span>}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-gray-500" />
            <span className={`font-bold ${node.is_malicious ? 'text-red-400' : 'text-blue-400'}`}>{node.name}</span>
            <span className="text-xs text-gray-500 font-mono">PID: {node.pid}</span>
            
            {node.is_malicious && (
              <span className="flex items-center text-xs bg-red-500 bg-opacity-20 text-red-500 px-2 py-0.5 rounded ml-2 font-bold">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Malicious
              </span>
            )}
            
            {node.tactic && (
              <span className="text-xs border border-orange-500 text-orange-400 px-2 py-0.5 rounded ml-2">
                {node.tactic}
              </span>
            )}
          </div>
          
          <div className="mt-1 text-xs text-gray-400 font-mono break-all bg-[#0a0a0a] p-1 rounded border border-gray-800 inline-block">
            {node.cmdline}
          </div>
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div className="border-l border-gray-700 ml-3 pl-3">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProcessTreeViewer() {
  const [treeData, setTreeData] = useState<ProcessNode | null>(null);

  useEffect(() => {
    // Mocking the API response for /api/v2/lineage/tree/{agent_id}/{root_pid}
    const mockData: ProcessNode = {
      id: 1, pid: 400, ppid: 100, name: "explorer.exe", cmdline: "C:\\Windows\\explorer.exe", is_malicious: false, tactic: null, children: [
        {
          id: 2, pid: 1500, ppid: 400, name: "winword.exe", cmdline: "\"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE\" /n \"C:\\Users\\Admin\\Downloads\\invoice.docx\"", is_malicious: false, tactic: "Initial Access", children: [
            {
              id: 3, pid: 2100, ppid: 1500, name: "cmd.exe", cmdline: "cmd.exe /c powershell.exe -w hidden -enc JABz...", is_malicious: true, tactic: "Execution", children: [
                {
                  id: 4, pid: 3304, ppid: 2100, name: "powershell.exe", cmdline: "powershell.exe -w hidden -enc JABz...", is_malicious: true, tactic: "Defense Evasion", children: []
                }
              ]
            }
          ]
        }
      ]
    };
    
    setTreeData(mockData);
  }, []);

  return (
    <div className="p-4 bg-[#0a0a0a] text-white rounded-lg border border-gray-800">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        Process Execution Lineage
      </h2>
      
      <div className="bg-[#111] p-4 rounded border border-gray-800 overflow-x-auto">
        {treeData ? <TreeNode node={treeData} /> : <p className="text-gray-500">Loading tree...</p>}
      </div>
    </div>
  );
}
