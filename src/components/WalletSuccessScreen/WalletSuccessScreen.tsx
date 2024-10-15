import React from 'react';
import { NavLink } from 'react-router-dom';
import { VerifySuccess } from '@/assets/icons';
import { Button } from '@/ui-kit';
import { ROUTES } from '@/constants';

interface WalletSuccessScreenProps {
  caption: string;
}

export const WalletSuccessScreen: React.FC<WalletSuccessScreenProps> = ({ caption }) => {
  return (
    <div className="w-full h-full pt-3 flex flex-col px-16">
      <div className="px-10 pb-2">
        <VerifySuccess width="100%" className="text-blue" />
      </div>
      <h1 className="text-white text-h3 font-semibold">Congratulations!</h1>
      <p className="mt-2.5 text-neutral-1 text-base">{caption}</p>
      <Button className="mt-8" asChild>
        <NavLink to={ROUTES.AUTH.ROOT}>Got it</NavLink>
      </Button>
    </div>
  );
};
