import { ReactNode } from 'react';

import { GoogleBusinessStatus } from '@/domains/google';

interface GoogleBusinessStatusTagProps {
  status: GoogleBusinessStatus;
}

const GoogleBusinessStatusTag = ({ status }: GoogleBusinessStatusTagProps): ReactNode => {
  if (status === GoogleBusinessStatus.ClosedTemporarily) {
    return (
      <span className="bg-yellow-400 text-gray-800 text-sm font-medium px-3 py-1 rounded-full inline-flex items-center">
        <span className="mr-2">&#128679;</span> {/* Warning Icon */}
        暫時關閉
      </span>
    );
  }

  if (status === GoogleBusinessStatus.ClosedPermanently) {
    return (
      <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full inline-flex items-center">
        <span className="mr-2">&#10060;</span> {/* Cross Icon */}
        永久歇業
      </span>
    );
  }

  return (
    <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full inline-flex items-center">
      <span className="mr-2">&#x1F4A1;</span> {/* Checkmark Icon */}
      營業中
    </span>
  );
};

export default GoogleBusinessStatusTag;
