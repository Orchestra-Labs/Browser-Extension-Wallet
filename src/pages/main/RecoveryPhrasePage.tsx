import React from 'react';
import { PageTitle, RecoveryPhraseGrid } from '@/components';
import { ROUTES } from '@/constants';
import { Button, Separator } from '@/ui-kit';
import { NavLink } from 'react-router-dom';
import { getSessionToken } from '@/helpers';

interface RecoveryPhrasePageProps {}

export const RecoveryPhrasePage: React.FC<RecoveryPhrasePageProps> = ({}) => {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    throw new Error("Session token doesn't exist");
  }
  const mnemonic = sessionToken.mnemonic.split(' ');

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <PageTitle title="Recovery Phrase" />

      <div className="flex flex-col justify-between flex-grow p-4 border border-neutral-2 rounded-lg overflow-y-auto">
        <h1 className="text-white text-h5 font-semibold">
          Below is your recovery phrase. Keep it safe and private.
        </h1>

        <RecoveryPhraseGrid mnemonic={mnemonic} lockWordCount />

        <div className="mt-2">
          <Separator variant="top" />

          <Button className="w-[85%]" variant="secondary" asChild>
            <NavLink to={ROUTES.APP.ROOT}>Back</NavLink>
          </Button>
        </div>
      </div>
    </div>
  );
};
