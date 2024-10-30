import { AlertCircle } from 'lucide-react';

export const ValidationError: React.FC<{ message: string }> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="flex items-center gap-2 mt-1 text-error text-sm">
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
};