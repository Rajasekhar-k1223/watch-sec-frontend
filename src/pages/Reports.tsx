import { FileText, Download, Calendar, Filter, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Reports() {
    const [reportType, setReportType] = useState('activity');
    const [dateRange, setDateRange] = useState('7d');

    const [reports, setReports] = useState<any[]>([]);
    const API_URL = import.meta.env.VITE_API_URL || "http://192.168.1.10:5140";

    useEffect(() => {
        fetch(`${API_URL}/api/reports`)
            .then(res => res.json())
            .then(data => setReports(data))
            .catch(err => console.error("Failed to fetch reports", err));
    }, []);

    const handleGenerate = async () => {
        try {
            const res = await fetch(`${API_URL}/api/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ type: reportType, range: dateRange })
            });

            if (res.ok) {
                // 1. Convert to Blob
                const blob = await res.blob();

                // 2. Create Download Link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                alert("Report generated and downloaded successfully!");
            } else {
                alert("Failed to generate report.");
            }
        } catch (e) {
            console.error(e);
            alert("Error generating report.");
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-blue-500" />
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Generate, view, and export detailed security and productivity reports.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <Download size={18} />
                        Export All
                    </button>
                </div>
            </div>

            {/* Generator Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Generate New Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                        >
                            <option value="activity">User Activity Summary</option>
                            <option value="dlp">DLP Violations</option>
                            <option value="web">Web Usage & Blocking</option>
                            <option value="productivity">Productivity Analysis</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Time Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleGenerate}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                            <Printer size={18} />
                            Generate Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Reports List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                    <h3 className="font-bold text-white">Recent Reports</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-900 text-gray-400 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4">Report Name</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Date Generated</th>
                            <th className="p-4">Size</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 text-gray-300">
                        {reports.map(report => (
                            <tr key={report.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium text-white flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <FileText size={18} />
                                    </div>
                                    {report.name}
                                </td>
                                <td className="p-4">
                                    <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs border border-gray-600">
                                        {report.type}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 flex items-center gap-2">
                                    <Calendar size={14} />
                                    {report.date}
                                </td>
                                <td className="p-4 text-gray-500">{report.size}</td>
                                <td className="p-4 text-right">
                                    <button className="text-blue-400 hover:text-blue-300 hover:underline text-xs font-bold">
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
