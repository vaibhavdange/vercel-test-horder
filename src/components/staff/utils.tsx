import { CheckCircle, XCircle, MinusCircle, FileText } from "lucide-react";

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'absent':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'half-shift':
      return <MinusCircle className="h-4 w-4 text-yellow-500" />;
    case 'leave':
      return <FileText className="h-4 w-4 text-blue-500" />;
    default:
      return <MinusCircle className="h-4 w-4 text-gray-500" />;
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-800';
    case 'absent':
      return 'bg-red-100 text-red-800';
    case 'half-shift':
      return 'bg-yellow-100 text-yellow-800';
    case 'leave':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatTime = (dateTime: string | null) => {
  if (!dateTime) return 'N/A';
  return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};
