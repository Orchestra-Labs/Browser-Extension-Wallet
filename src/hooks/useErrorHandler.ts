import { useAtom } from 'jotai';
import { errorAtom, errorDialogAtom, ErrorType } from '../atoms/errorAtom';

export const useErrorHandler = () => {
  const [, setError] = useAtom(errorAtom);
  const [, setIsDialogOpen] = useAtom(errorDialogAtom);

  const showError = (type: ErrorType, message: string, details?: string) => {
    setError({ type, message, details });
    if (type === 'transaction') {
      setIsDialogOpen(true);
    }
  };

  return { showError };
};