import { useNavigate } from 'react-router-dom';
import { removeSessionToken, resetNodeErrorCounts } from '@/helpers';
import { ROUTES } from '@/constants';

export const useLogout = () => {
  const navigate = useNavigate();

  const logout = () => {
    // Clear necessary data
    resetNodeErrorCounts();
    removeSessionToken();
    removeSessionToken();

    // Use React Router's navigate instead of window.location.href
    navigate(ROUTES.AUTH.ROOT);
  };

  return logout;
};
