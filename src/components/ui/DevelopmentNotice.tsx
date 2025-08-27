import { AlertTriangle } from 'lucide-react';

export default function DevelopmentNotice() {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-800 mb-1">
              Under Development
            </h3>
            <p className="text-sm text-amber-700">
              This page is currently under development and may not work correctly. 
              Please report any issues you encounter during testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
