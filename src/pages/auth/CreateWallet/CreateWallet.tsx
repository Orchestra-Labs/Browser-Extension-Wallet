import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Secp256k1HdWallet } from '@cosmjs/amino';
import { CreatePasswordForm, RecoveryPhraseGrid, WalletSuccessScreen } from '@/components';
import { ROUTES } from '@/constants';
import { Button, Stepper } from '@/ui-kit';
import { createWallet, generateToken } from '@/helpers/wallet';
import { useAtom, useSetAtom } from 'jotai';
import {
  confirmPasswordAtom,
  mnemonic12State,
  mnemonic24State,
  mnemonicVerifiedState,
  passwordAtom,
  passwordsVerifiedAtom,
  use24WordsState,
} from '@/atoms';

const STEPS_LABELS = ['Create password', 'Recovery phrase', 'Verify phrase'];

export const CreateWallet = () => {
  const [mnemonic12, setMnemonic12] = useAtom(mnemonic12State);
  const [mnemonic24, setMnemonic24] = useAtom(mnemonic24State);
  const [use24Words, setUse24Words] = useAtom(use24WordsState);
  const [mnemonicVerified, setMnemonicVerified] = useAtom(mnemonicVerifiedState);

  const [password, setPassword] = useAtom(passwordAtom);
  const setConfirmPassword = useSetAtom(confirmPasswordAtom);
  const [passwordsVerified, setPasswordsVerified] = useAtom(passwordsVerifiedAtom);

  const [activeScreen, setActiveScreen] = useState(0);
  const [fullyVerified, setFullyVerified] = useState(false);

  // Proceed to next step
  const nextStep = () => setActiveScreen(current => (current < 3 ? current + 1 : current));
  const prevStep = () => setActiveScreen(current => (current > 0 ? current - 1 : current));

  useEffect(() => {
    clearState();
  }, []);

  useEffect(() => {
    // Ensure both passwords and mnemonic are fully validated before enabling the next button
    setFullyVerified(passwordsVerified && mnemonicVerified);
  }, [passwordsVerified, mnemonicVerified]);

  // Select random hidden indexes for verification step
  const getRandomIndexes = () => {
    const phraseLength = use24Words ? 24 : 12;
    const indexes = Array.from(Array(phraseLength).keys());
    const shuffled = indexes.sort(() => 0.5 - Math.random());
    const sortedRandomIndices = shuffled.slice(0, 3).sort((a, b) => a - b); // Sort numerically
    return sortedRandomIndices;
  };

  const [randomHiddenIndexes, setRandomHiddenIndexes] = useState(getRandomIndexes());

  // Generate the mnemonic phrases on component mount
  useEffect(() => {
    const generateMnemonics = async () => {
      const wallet12 = await Secp256k1HdWallet.generate(12);
      const wallet24 = await Secp256k1HdWallet.generate(24);
      setMnemonic12(wallet12.mnemonic.split(' '));
      setMnemonic24(wallet24.mnemonic.split(' '));
    };

    generateMnemonics();
  }, []);

  useEffect(() => {
    if (activeScreen !== 2) {
      setMnemonicVerified(false);
      // Reset verification words on change of screen
      setRandomHiddenIndexes(getRandomIndexes());
    }
  }, [activeScreen]);

  const getCurrentMnemonic = () => (use24Words ? mnemonic24 : mnemonic12);
  const getStringMnemonic = () => getCurrentMnemonic().join(' ');

  const clearState = () => {
    setMnemonic12(new Array(12).fill(''));
    setMnemonic24(new Array(24).fill(''));
    setUse24Words(false);
    setMnemonicVerified(false);

    setPassword('');
    setConfirmPassword('');
    setPasswordsVerified(false);
  };

  // Regenerate random indexes when use24Words is toggled
  useEffect(() => {
    setRandomHiddenIndexes(getRandomIndexes());
  }, [use24Words]);

  /* ******************************************************************************************* */
  /* Chris current TODO */
  // TODO: provide updates to user as staking, claim, and unstaking information changes (successes, errors, and changing gas fees)
  // TODO: provide updates to user as send information updates (errors and changing gas fees)
  /* ******************************************************************************************* */

  /* ******************************************************************************************* */
  /* David Current TODOs */
  // TODO: add search to other select dialogs
  // TODO: add search icon, add search capability
  // TODO: on select screen, tap to select, tap again to confirm selection/close
  // TODO: apply sorting function to wallet asset list
  // TODO: apply sorting function to validator list
  // TODO: add current/all buttons to holdings, but make them non-zero/all

  // TODO: add show/hide function to wallet asset list (select which assets to show.  add searchability to this)
  // TODO: add show/hide function to validator list (by activity, by chain)

  // TODO: add clear and max buttons to amount section
  // TODO: test validation of format of entered address for send field
  // TODO: make "clear" and "max" button placement and appearance more uniform (send and unstake sections)
  // TODO: format numbers on balance and asset value field to user locale.  start with US format, add others

  // TODO: remove "support" in favor of links to site and socials

  // TODO: show green or red border for passphrase box on full verify, clear on start of typing

  // TODO: change "options" to settings?
  // TODO: show donut chart with assets rather than singular value

  // TODO: emable selection in validator select dialog
  // TODO: add conclusionary action with selection in asset select dialog.  should picking close the dialog?

  // TODO: add onHover and onClick color changes to asset and validator tiles

  // TODO: apply regional formatting to regular display numbers
  /* ******************************************************************************************* */

  /* Current TODOs */
  // TODO: show errors to user (user displayable values)
  // TODO: clean up helper functions and hooks

  // TODO: add fields to let user know when sending over IBC
  // TODO: abstract wallet prefix and mnemonic decryption
  // TODO: ensure trim on completion of password entry (such as save to storage).  same on login.  to avoid copy/paste errors
  // TODO: add link to github repo for registry
  // TODO: abstract IBC needs
  // TODO: ensure pipeline to other registries is functional.  change here auto-PRs there

  // TODO: ensure logout after blur (click outside application to close).  to remove sensitive data after time period
  // TODO: prevent re-building auth every time wallet updates

  /* Inside wallet TODOs */
  // TODO: ensure new encrypted mnemonic overwrites old in case of same password and name (but let user know first)

  /* Wallet UI TODOs */
  // TODO: remove or enable connected services button <-- could be good for using firebase to transfer/remove settings data
  // TODO: remove or enable transaction history
  // TODO: remove or enable expand view
  // TODO: security tab enables/disables need to confirm transactions/re-entry of password on transactions (3 levels of security)
  // TODO: change options buttons
  // TODO: update transactions history button (need endpoint for this.  disable until ready)

  /* Less Critical Auth TODOs */
  // TODO: handle error printout for create/import wallet (in place of subtitle on verify screen?)
  // TODO: for default on text, ensure no focus and basic mouse onHover (no change)
  // TODO: test path and create error for no wallet exists and user attempts login
  // TODO: Add Manual RPC changes in-app (both selection in list and form entry.  one or both of these should be kept behind dev-mode toggle)

  /* Less Critical Wallet TODOs */
  // TODO: add QR code input to address on send screen (drag and drop/image selection)
  // TODO: create add wallet screen to allow management of multiple accounts
  // TODO: add save wallet screen for saving preferred received assets per wallet and wallet name/identifier (for those user sends to)
  // TODO: add qr code screen for transfer data (including account data).  or from google
  // TODO: add swipe to dismiss on dialog trays

  /* Nice to have TODOs */
  // TODO: add swipe to refresh on main page lists
  // TODO: add password complexity bar on entry
  // TODO: add toggle option for single-click transactions and another for force accepting/declining transactions
  // TODO: add toggle option for ultra-secure mode, using password auth for on every transaction like with hardware wallets.  in that mode, no session storage is used.
  // TODO: add click and drag to scroll for passphrase box and tilescroller
  // TODO: keep track of current page for case of re-open before timeout

  /* Nice to have Interchain-compatibility TODOs */
  // TODO: add manual IBC (for rare cases.  hide behind dev tool enabling?)
  // TODO: enable search function for wallet asset list by chain (on top of current functionality)
  // TODO: enable search function to validator list by chain (on top of current functionality)

  // Check everything is completed properly and pass to confirmation screen
  const handleCreateWallet = async () => {
    try {
      // Generate wallet from the mnemonic and create the token
      const { walletAddress } = await createWallet(getStringMnemonic(), password);
      generateToken(walletAddress);

      // Clear state and navigate to confirmation page after wallet creation
      clearState();
      nextStep();
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  return (
    <div className="mt-6 h-full">
      {activeScreen < STEPS_LABELS.length ? (
        <Stepper
          active={activeScreen}
          labels={STEPS_LABELS}
          progressBarClass="px-9"
          containerClass="h-full"
        >
          {/* Step 1: Create password */}
          <div className="w-full h-full pt-7 px-8 flex flex-col">
            <h1 className="text-white text-h3 font-semibold">{STEPS_LABELS[0]}</h1>
            <CreatePasswordForm />

            <div className="flex w-full justify-between gap-x-5 pb-2">
              <Button variant="secondary" className="w-full" asChild>
                <NavLink to={ROUTES.AUTH.NEW_WALLET.ROOT}>Back</NavLink>
              </Button>
              <Button className="w-full" onClick={nextStep} disabled={!passwordsVerified}>
                Next
              </Button>
            </div>
          </div>

          {/* Step 2: Display recovery phrase */}
          <div className="w-full h-full pt-7 flex flex-col">
            <h1 className="text-white text-h3 font-semibold">{STEPS_LABELS[1]}</h1>
            <p className="mt-2.5 text-base text-neutral-1">Backup your secret recovery phrase</p>
            <RecoveryPhraseGrid />
            <div className="flex w-full px-10 justify-between gap-x-5 pb-2 mt-4">
              <Button variant="secondary" className="w-full" onClick={prevStep}>
                Back
              </Button>
              <Button className="w-full" onClick={nextStep}>
                Next
              </Button>
            </div>
          </div>

          {/* Step 3: Verify recovery phrase */}
          <div className="w-full h-full pt-7 flex flex-col">
            <h1 className="text-white text-h3 font-semibold">{STEPS_LABELS[2]}</h1>
            <p className="mt-2.5 text-neutral-1 text-base">Confirm your secret recovery phrase</p>
            <RecoveryPhraseGrid isVerifyMode={true} hiddenIndices={randomHiddenIndexes} />
            <div className="flex w-full px-10 justify-between gap-x-5 pb-2">
              <Button variant="secondary" className="w-full" onClick={prevStep}>
                Back
              </Button>
              <Button className="w-full" onClick={handleCreateWallet} disabled={!fullyVerified}>
                Next
              </Button>
            </div>
          </div>
        </Stepper>
      ) : (
        // Wallet success screen outside the Stepper
        <WalletSuccessScreen caption="Your wallet was created successfully" />
      )}
    </div>
  );
};
