import React from 'react';
import { Hammer } from 'lucide-react';

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
      <div className="bg-blue-50 p-6 rounded-full mb-6">
        <Hammer className="w-16 h-16 text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Under Construction</h1>
      <p className="text-lg text-gray-600 max-w-lg">
        This module is currently being built by the engineering team. Check back soon for updates!
      </p>
    </div>
  );
}
