import React, { ComponentType } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { Copy, History } from '@/assets/icons';
import { LogoIcon } from '@/assets/icons';
import { ConnectedServicesDialog, OptionsDialog } from '@/components';
import { ROUTES } from '@/constants';
import { Button } from '@/ui-kit';

const avatarUrl = chrome?.runtime?.getURL('avatar.png');

const MainLayout: React.FC = () => (
  <div className="max-w-full bg-background-dark-grey h-full flex flex-col">
    <header className="bg-gradient-to-b from-[#202022] to-[#33334652] h-20 p-4 flex items-center">
      <NavLink className="flex max-h-12 mr-4" to={ROUTES.APP.ROOT}>
        <LogoIcon className="h-auto w-auto" />
      </NavLink>
      <div
        role="button"
        className="flex items-center py-1.5 px-2 rounded-full border border-neutral-2 h-8"
      >
        <img className="h-5 w-5" src={avatarUrl} alt="Avatar" />
        {/* TODO: change for Wallet Name display */}
        <span className="text-sm text-white ml-1.5">Au4...Z45U56x</span>
        <Copy width="14px" className="text-neutral-1 ml-1" />
      </div>
      <div className="flex-1" />
      <div className="flex gap-x-2.5">
        <ConnectedServicesDialog />
        <Button className="p-[7px]" variant="icon" size="rounded-default" asChild>
          <NavLink to={ROUTES.APP.TRANSACTIONS_HISTORY}>
            <History width="100%" height="100%" />
          </NavLink>
        </Button>
        <OptionsDialog />
      </div>
    </header>
    <Outlet />
  </div>
);

export default MainLayout as ComponentType;
