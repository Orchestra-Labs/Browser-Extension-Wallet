import React from 'react';
import { Navigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { getSessionToken } from '@/helpers';

interface GuestGuardProps {
  children?: React.ReactNode;
}

export const GuestGuard = ({ children }: GuestGuardProps) => {
  console.log('guest guard');
  // TODO: save multiple access tokens for multiple accounts (log in via correct password).  burner account enabled
  // TODO: check if token is expired
  const token = getSessionToken();
  if (token) {
    return <Navigate to={ROUTES.APP.ROOT} />;
  }

  return children;
};
