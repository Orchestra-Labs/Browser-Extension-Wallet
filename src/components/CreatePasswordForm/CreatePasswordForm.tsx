import React, { useState, useEffect } from 'react';
import { EyeClose, EyeOpen } from '@/assets/icons';
import { Input } from '@/ui-kit';
import { useAtom, useSetAtom } from 'jotai';
import { confirmPasswordAtom, passwordAtom, passwordsVerifiedAtom } from '@/atoms';

export const CreatePasswordForm = () => {
  const [password, setPassword] = useAtom(passwordAtom);
  const [confirmPassword, setConfirmPassword] = useAtom(confirmPasswordAtom);
  const setPasswordsVerified = useSetAtom(passwordsVerifiedAtom);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'error' | 'success' | null>(null);
  const [confirmPasswordStatus, setConfirmPasswordStatus] = useState<'error' | 'success' | null>(
    null,
  );
  const [allowValidatePassword, setAllowValidatePassword] = useState(false);
  const [allowValidateConfirmPassword, setAllowValidateConfirmPassword] = useState(false);

  // Validate password
  const validatePassword = () => {
    if (password === '') {
      setPasswordStatus(null);
      return;
    }
    const isPasswordValid = password.length >= 8;
    setPasswordStatus(isPasswordValid ? 'success' : 'error');
  };

  // Validate confirm password
  const validateConfirmPassword = () => {
    if (confirmPassword === '') {
      setConfirmPasswordStatus(null);
      return;
    }
    const isConfirmPasswordValid = confirmPassword === password;
    setConfirmPasswordStatus(isConfirmPasswordValid ? 'success' : 'error');
  };

  const checkPasswordStatus = () => {
    if (allowValidatePassword || password.length === 0) {
      validatePassword();
    }
  };

  const checkConfirmPasswordStatus = () => {
    if (allowValidateConfirmPassword || confirmPassword.length === 0) {
      validateConfirmPassword();
    }
  };

  // Validate passwords after the first validation
  useEffect(() => {
    checkPasswordStatus();
    checkConfirmPasswordStatus();
  }, [password]);

  useEffect(() => {
    checkConfirmPasswordStatus();
  }, [confirmPassword]);

  useEffect(() => {
    const passwordVerified = passwordStatus === 'success';
    const confirmPasswordVerified = confirmPasswordStatus === 'success';

    setPasswordsVerified(passwordVerified && confirmPasswordVerified);
  }, [passwordStatus, confirmPasswordStatus]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Start validating after 8 characters, paste, or blur
    if (newPassword.length >= 8 && !allowValidatePassword) {
      setAllowValidatePassword(true);
    }

    // Reset validation when empty
    if (newPassword === '') {
      setAllowValidatePassword(false);
      setPasswordStatus(null);
    }

    if (allowValidatePassword) {
      validatePassword();
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    // Start validating after blur, paste, or if password is already valid
    if (newConfirmPassword.length >= 8 || allowValidateConfirmPassword) {
      setAllowValidateConfirmPassword(true);
    }

    // Reset validation when empty
    if (newConfirmPassword === '') {
      setAllowValidateConfirmPassword(false);
      setConfirmPasswordStatus(null);
    }

    if (allowValidateConfirmPassword) {
      validateConfirmPassword();
    }
  };

  const handlePasswordBlur = () => {
    if (password.length > 0) {
      setAllowValidatePassword(true);
    }
    validatePassword();
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword.length > 0) {
      setAllowValidateConfirmPassword(true);
    }
    validateConfirmPassword();
  };

  const handlePasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setPassword(pastedText);

    // Start validating immediately after paste
    if (pastedText.length > 0) {
      setAllowValidatePassword(true);
    }
    validatePassword();
  };

  const handleConfirmPasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    e.preventDefault();
    setConfirmPassword(pastedText);

    // Start validating immediately after paste
    if (pastedText.length > 0) {
      setAllowValidateConfirmPassword(true);
    }
    validateConfirmPassword();
  };

  return (
    <>
      <form className="mt-9 flex-1">
        {/* New Password Input */}
        <Input
          variant="primary"
          showsErrorText={true}
          status={passwordStatus}
          errorText={passwordStatus === 'error' ? 'Password must be at least 8 characters' : ''}
          label="New password (8 characters min)"
          placeholder="Enter password"
          type={passwordVisible ? 'text' : 'password'}
          value={password}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
          onPaste={handlePasswordPaste}
          icon={passwordVisible ? <EyeOpen width={20} /> : <EyeClose width={20} />}
          iconRole="button"
          onIconClick={() => setPasswordVisible(!passwordVisible)}
          wrapperClass="mb-4"
        />

        {/* Confirm Password Input */}
        <Input
          variant="primary"
          showsErrorText={true}
          status={confirmPasswordStatus}
          errorText={confirmPasswordStatus === 'error' ? 'Passwords do not match' : ''}
          label="Confirm password"
          placeholder="Repeat password"
          type={confirmPasswordVisible ? 'text' : 'password'}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          onBlur={handleConfirmPasswordBlur}
          onPaste={handleConfirmPasswordPaste}
          icon={confirmPasswordVisible ? <EyeOpen width={20} /> : <EyeClose width={20} />}
          iconRole="button"
          onIconClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
        />
      </form>
    </>
  );
};
