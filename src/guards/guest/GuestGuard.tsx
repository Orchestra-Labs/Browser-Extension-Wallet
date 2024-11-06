import React from 'react';
import { Navigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { useAtomValue } from 'jotai';
import { isLoggedInAtom } from '@/atoms';

interface GuestGuardProps {
  children?: React.ReactNode;
}

export const GuestGuard = ({ children }: GuestGuardProps) => {
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  console.log('guest guard');
  if (isLoggedIn) {
    return <Navigate to={ROUTES.APP.ROOT} />;
  }

  return children;
};
