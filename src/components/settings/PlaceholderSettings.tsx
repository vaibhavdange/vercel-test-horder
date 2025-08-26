import { Settings } from 'lucide-react';

interface PlaceholderSettingsProps {
  title: string;
  description: string;
  className?: string;
}

export default function PlaceholderSettings({ title, description, className = '' }: PlaceholderSettingsProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <Settings className="h-8 w-8 text-gray-400" />
      </div>
      <h4 className="text-lg font-medium text-gray-900 mb-2">
        {title} Settings
      </h4>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
        <span>In Development</span>
      </div>
    </div>
  );
}
