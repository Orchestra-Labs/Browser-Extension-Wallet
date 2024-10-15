import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { EyeOpen, EyeClose } from '@/assets/icons';
import { ROUTES } from '@/constants';
import { Button, Input } from '@/ui-kit';
import { resetNodeErrorCounts, tryAuthorizeWalletAccess } from '@/helpers';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'error' | 'success' | null>(null);

  // Reset status on typing
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Only reset the error state if the user had an error before
    if (passwordStatus === 'error') {
      setPasswordStatus(null);
    }
  };

  const handleUnlock = async () => {
    // TOOD: include error message if no wallet exists on this device
    const isAuthorized = await tryAuthorizeWalletAccess(password);
    if (isAuthorized) {
      resetNodeErrorCounts();
      // If password is correct, set wallet address and navigate to app root
      navigate(ROUTES.APP.ROOT);
    } else {
      // If password is incorrect, set status to error
      setPasswordStatus('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUnlock();
    }
  };

  return (
    <div className="mt-6 h-full">
      <div className="w-full h-full pt-7 px-8 flex flex-col">
        <h1 className="text-white text-h2 font-bold">Welcome back!</h1>
        <p className="mt-2.5 text-neutral-1 text-base">Sign in to securely access your wallet</p>
        <form className="mt-9 flex-1">
          <Input
            variant="primary"
            showsErrorText={true}
            status={passwordStatus}
            errorText={passwordStatus === 'error' ? 'Incorrect password' : ''}
            className="w-full"
            wrapperClass="mb-4"
            label="Password"
            placeholder="Enter password"
            type={passwordVisible ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={e => handleKeyDown(e)}
            icon={passwordVisible ? <EyeOpen width={20} /> : <EyeClose width={20} />}
            iconRole="button"
            onIconClick={() => setPasswordVisible(!passwordVisible)}
          />
        </form>
        <div className="flex flex-col gap-y-4 w-full justify-between gap-x-5 pb-2">
          <Button className="w-full text-black" onClick={handleUnlock}>
            Unlock
          </Button>
          <div>
            <span className="text-base text-white mr-1">Don't have a wallet yet?</span>
            <Button variant="link" size="xsmall" className="text-base" asChild>
              <NavLink to={ROUTES.AUTH.NEW_WALLET.ROOT}>Create wallet</NavLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
