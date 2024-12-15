import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Secp256k1HdWallet } from '@cosmjs/amino';
import { CreatePasswordForm, RecoveryPhraseGrid, WalletSuccessScreen } from '@/components';
import { ROUTES } from '@/constants';
import { Button, Stepper } from '@/ui-kit';
import { useAtom, useSetAtom } from 'jotai';
import {
  confirmPasswordAtom,
  isLoggedInAtom,
  mnemonic12State,
  mnemonic24State,
  mnemonicVerifiedState,
  passwordAtom,
  passwordsVerifiedAtom,
  use24WordsState,
} from '@/atoms';
import { createAccount } from '@/helpers/dataHelpers/account';
import { createWallet, saveSessionData } from '@/helpers';
import { AccountRecord } from '@/types';

const STEPS_LABELS = ['Create password', 'Recovery phrase', 'Verify phrase'];

export const CreateWallet = () => {
  const [mnemonic12, setMnemonic12] = useAtom(mnemonic12State);
  const [mnemonic24, setMnemonic24] = useAtom(mnemonic24State);
  const [use24Words, setUse24Words] = useAtom(use24WordsState);
  const [mnemonicVerified, setMnemonicVerified] = useAtom(mnemonicVerifiedState);

  const [password, setPassword] = useAtom(passwordAtom);
  const setConfirmPassword = useSetAtom(confirmPasswordAtom);
  const [passwordsVerified, setPasswordsVerified] = useAtom(passwordsVerifiedAtom);

  const setIsLoggedIn = useSetAtom(isLoggedInAtom);

  const [activeScreen, setActiveScreen] = useState(0);
  const [fullyVerified, setFullyVerified] = useState(false);

  const [accountRecord, setAccountRecord] = useState<AccountRecord | null>(null);
  const [stringMnemonic, setStringMnemonic] = useState<string>('');

  const walletName = 'Aria';

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
  /* ******************************************************************************************* */

  /* ******************************************************************************************* */
  /* David Current TODOs */
  // TODO: enable search function for wallet asset list by chain (on top of current functionality)
  // TODO: enable search function to validator list by chain (on top of current functionality)
  // TODO: add show/hide function to validator list (by chain)
  // TODO: abstract IBC needs
  // TODO: abstract wallet prefix and mnemonic decryption
  // TODO: Add remember me
  // TODO: make toast animate in, animate out, and swipe-away
  // TODO: Add get for IBC information
  // TODO: Add support for IBC sends
  // TODO: Add first level of routing (swap to IBC send or IBC to swap)
  // TODO: Add additional chain views to verify above
  // TODO: enable Wallet Name display
  // TODO: abstract wallet prefix and mnemonic decryption
  // TODO: add auth support for dApps
  /* ******************************************************************************************* */

  /* Current TODOs */
  // TODO: add auth support for dApps
  // TODO: add button to "add chain" in center of empty chain list
  // TODO: add button to "stake to validator" in center of empty 'current' validator list
  // TODO: add text for "no validators found.  how are you seeing this?" in center of empty 'all' validator list
  // TODO: add link to github repo for registry
  // TODO: add ledger support
  // Add routing
  // TODO: modify claim, restake, and unstake functions to withdraw from all unique delegator addresses
  // TODO: enable search function for wallet asset list by chain (on top of current functionality)
  // TODO: enable search function to validator list by chain (on top of current functionality)
  // TODO: add show/hide function to validator list (by chain)

  /* Revenue TODOs (ensure no added fees from us adds total fees over 1% on transaction */
  // TODO: enable transaction fees for wallet transactions (bundle a transaction for revenue. based on transaction fees (0.5x basic transaction fee)?)
  // TODO: list these in user info:
  // revenue sources will be gas markups (transaction fees), cross-chain exchange fees, on-ramp/off-ramp fees, staking commission, affiliate revenue
  // TODO: minor revenue for wallets - gas markups
  // TODO: in-app exchange fee (find lowest rates for user, but add small commission)
  // TODO: on-ramp fees (add small commission)
  // TODO: staking fees add small percent commission
  // TODO: affiliate revenue from integrated services
  // NOTE: metamask - primary from swap and on-ramp
  // NOTE: trust - primary from on-ramps, swaps, and staking
  // NOTE: coinbase - primary from on-ramps, coinbase, and affiliate
  // NOTE: exodus - primary from staking, affiliate, and on-ramp

  /* Interchain-compatibility TODOs (mobile version before this) */
  // TODO: ensure pipeline to other registries is functional.  change here auto-PRs there
  // TODO: integrate skip protocol or automated use of exchange to allow swapping between chains
  // TODO: modify claim, restake, and unstake functions to withdraw from all unique delegator addresses

  /* dApp TODOs */
  // TODO: add page
  // TODO: add search
  // TODO: add categorization for filtering and sorting
  // TODO: add in-app auth
  // TODO: save to "add-page" for fast-access

  /* Nice to have TODOs */
  // TODO: get google analytics going
  // TODO: creation of wallet with old password should overwrite old wallet
  // TODO: fix issue with gas on 'all' button for validator selections (bundle transactions)
  // TODO: make toasts copy-on-click
  // TODO: fix copytextfield issue of enlarged border on click
  // TODO: clean up helper functions and hooks
  // TODO: make "clear" and "max" button send screen inputs.  make placement and appearance for these uniform (send and unstake sections)
  // TODO: add search icon to search field, add onclick
  // TODO: keep track of current page for case of re-open before timeout
  // TODO: prevent re-building auth every time wallet updates
  // TODO: make data text in asset and validator tiles scrollable
  // TODO: add feeLoading state so user knows fees are updating
  // TODO: ensure logout after blur + timeout (blur is click outside application to close).  to remove sensitive data after time period
  // TODO: speed up resolution on rpc queries (send, stake, unstake, claim)
  // TODO: add change password functionality

  /* Wallet UI TODOs */
  // TODO: create add/edit/remove wallet screen to allow management of multiple accounts
  // TODO: add save wallet screen for saving preferred received assets per wallet and wallet name/identifier (for those user sends to)
  // TODO: add show/hide function to wallet asset list (select which assets to show.  add searchability to this)
  // TODO: security tab enables/disables need to confirm transactions/re-entry of password on transactions (3 levels of security)
  // TODO: update transactions history button (need endpoint for this.  disable until ready)
  // TODO: show donut chart with assets rather than singular value (requires connections to exchanges)
  // TODO: Add on-ramp / off-ramp page
  // TODO: If at least one on-ramp connection exists, include fiat in send options
  // TODO: If at least one off-ramp connection exists, include fiat in receive options
  // TODO: Add NFT page
  // TODO: Add page view selection in options
  // TODO: handle stake to all (add total, it distributes that total amongst all selected). david sees as beneficial.  do others?

  /* Less Critical Wallet TODOs */
  // TODO: add data transfer method for extension to wallet or back (including account data)
  // TODO: ensure refresh only queries once (currently 4 times per pull)

  /* Internationalization TODOs */
  // TODO: add translations for all strings (pull from string file/translation file)
  // TODO: add option screen filter for regional display for numbers

  /* Nice to have TODOs */
  // TODO: add password complexity bar on entry
  // TODO: add toggle option for single-click transactions and another for force accepting/declining transactions
  // TODO: add toggle option for ultra-secure mode, using password auth for on every transaction like with hardware wallets.  in that mode, no session storage is used.
  // TODO: loader on tilescroller swipe-to-refresh coming in late and tries to catch up.  make more uniform with percent pulled
  // TODO: add option screen filter for validator list (by status.  default to not showing jailed validators.  check fetchAllValidators function and validatorsAtom (currently filters here))

  /* Nice to have Interchain-compatibility TODOs */
  // TODO: add manual IBC (for rare cases.  hide behind dev tool enabling?)

  /* Dev Mode TODOs */
  // TODO: add dev mode options (additional views and manual use screens).  these persist after close of dev mode (just hide options toggles)
  // TODO: include "add network" screen (dev mode)
  // TODO: Add Manual RPC changes in-app (both selection in list and form entry.  one or both of these should be kept behind dev-mode toggle)

  const logIn = async (mnemonic: string, walletName: string, accountID: string) => {
    const { wallet } = await createWallet(mnemonic, password, walletName);
    await saveSessionData(wallet, accountID, false);
    setIsLoggedIn(true);
  };

  // Check everything is completed properly and pass to confirmation screen
  const handleCreateWallet = async () => {
    try {
      // TODO: add session token and move user to chain visibility screen
      console.log('trying to create wallet');
      // Generate wallet from the mnemonic and create the token
      const mnemonic = getStringMnemonic();
      const walletName = 'Aria';
      // TODO: make create/add depending on source of origin
      const accountRecord = await createAccount(mnemonic, password, walletName);
      console.log('create wallet function ended');

      setAccountRecord(accountRecord);
      setStringMnemonic(mnemonic);

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
        <WalletSuccessScreen
          caption="Your wallet was created successfully"
          onClick={() => {
            if (accountRecord) {
              logIn(stringMnemonic, walletName, accountRecord.id);
            }
          }}
        />
      )}
    </div>
  );
};
