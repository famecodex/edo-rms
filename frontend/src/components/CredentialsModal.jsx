import React, { useState } from 'react';

export default function CredentialsModal({ credentials, onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!credentials) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Student Account Created Successfully
        </h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800 mb-2">
              Please share these credentials securely with the student/guardian.
              The student should change their password upon first login.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  readOnly
                  value={credentials.email}
                  className="block w-full pr-10 bg-gray-50 border-gray-300 rounded-md focus:ring-edoBlue focus:border-edoBlue sm:text-sm"
                />
                <button
                  onClick={() => copyToClipboard(credentials.email)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center hover:text-edoBlue"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Initial Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showPassword ? "text" : "password"}
                  readOnly
                  value={credentials.initialPassword}
                  className="block w-full pr-20 bg-gray-50 border-gray-300 rounded-md focus:ring-edoBlue focus:border-edoBlue sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-2 hover:text-edoBlue"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(credentials.initialPassword)}
                    className="px-2 hover:text-edoBlue"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-edoBlue text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edoBlue"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}