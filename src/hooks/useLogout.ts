import { useNavigate } from 'react-router-dom';
import { removeSessionData, resetNodeErrorCounts } from '@/helpers';
import { ROUTES } from '@/constants';

export const useLogout = () => {
  const navigate = useNavigate();

  const logout = () => {
    // Clear necessary data
    resetNodeErrorCounts();
    removeSessionData();
    removeSessionData();

    // Use React Router's navigate instead of window.location.href
    navigate(ROUTES.AUTH.ROOT);
  };

  return logout;
};
