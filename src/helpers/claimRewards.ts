import { CHAIN_ENDPOINTS, GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY } from '@/constants';
import { queryRpcNode } from './queryNodes';
import { DelegationResponse } from '@/types';

export const buildClaimMessage = ({
  endpoint,
  delegatorAddress,
  validatorAddress,
  amount,
  denom,
  delegations,
}: {
  endpoint: string;
  delegatorAddress?: string;
  validatorAddress?: string | string[];
  amount?: string;
  denom?: string;
  delegations?: DelegationResponse[];
}): any => {
  console.log('Building claim message:', {
    endpoint,
    delegatorAddress,
    validatorAddress,
    amount,
    denom,
    delegations,
  });

  if (delegations) {
    // Handle multiple delegations
    return delegations.map(delegation => ({
      typeUrl: endpoint,
      value: {
        delegatorAddress: delegation.delegation.delegator_address,
        validatorAddress: delegation.delegation.validator_address,
        amount: {
          denom: delegation.balance.denom,
          // TODO: remove magic number fees in favor of single source of truth (simulate transactions)
          // Subtracting 5000 for gas fee
          amount: (parseFloat(delegation.balance.amount) - 5000).toFixed(0),
        },
      },
    }));
  }

  // Single validator address or multiple
  const validatorAddressesArray = Array.isArray(validatorAddress)
    ? validatorAddress
    : [validatorAddress];

  // Create messages for each validator in the array
  return validatorAddressesArray.map(validator => ({
    typeUrl: endpoint,
    value: {
      delegatorAddress: delegatorAddress,
      validatorAddress: validator,
      ...(amount && denom ? { amount: { denom, amount } } : {}),
    },
  }));
};

// Function to claim rewards from one or multiple validators
export const claimRewards = async (
  delegatorAddress: string,
  validatorAddress: string | string[],
) => {
  const endpoint = CHAIN_ENDPOINTS.claimRewards;

  // Make sure validatorAddress is always an array
  const validatorAddressesArray = Array.isArray(validatorAddress)
    ? validatorAddress
    : [validatorAddress];

  const messages = buildClaimMessage({
    endpoint,
    delegatorAddress,
    validatorAddress: validatorAddressesArray, // Pass array for consistency
  });

  console.log('Claiming rewards from validator(s):', {
    delegatorAddress,
    validatorAddressesArray,
    messages,
  });

  try {
    const response = await queryRpcNode({
      endpoint,
      messages,
    });

    console.log('Rewards claimed successfully:', response);
  } catch (error) {
    console.error('Error claiming rewards:', error);
  }
};

// Function to claim rewards and restake for one or multiple validators
export const claimAndRestake = async (delegations: DelegationResponse | DelegationResponse[]) => {
  const endpoint = CHAIN_ENDPOINTS.delegateToValidator;

  // Ensure delegations is always an array
  const delegationsArray = Array.isArray(delegations) ? delegations : [delegations];
  const delegatorAddress = delegationsArray[0].delegation.delegator_address;
  const validatorAddresses = delegationsArray.map(d => d.delegation.validator_address);

  const messages = buildClaimMessage({
    endpoint,
    delegations: delegationsArray,
  });

  console.log('Claiming and restaking rewards for validator(s):', {
    delegatorAddress,
    validatorAddresses,
    messages,
  });

  try {
    // Use the updated claimRewards function
    await claimRewards(delegatorAddress, validatorAddresses);

    const restakeResponse = await queryRpcNode({
      endpoint,
      messages,
    });

    if (restakeResponse.code !== 0) {
      throw new Error(`Failed to restake rewards: ${restakeResponse.rawLog}`);
    }

    console.log('Rewards restaked successfully to all validators:', restakeResponse);
  } catch (error) {
    console.error('Error during claim and restake:', error);
  }
};

// Function to stake to a validator
export const stakeToValidator = async (
  amount: string,
  denom: string,
  walletAddress: string,
  validatorAddress: string,
) => {
  const endpoint = CHAIN_ENDPOINTS.delegateToValidator;
  const formattedAmount = (
    parseFloat(amount) *
    Math.pow(10, LOCAL_ASSET_REGISTRY[denom].exponent || GREATER_EXPONENT_DEFAULT)
  ).toFixed(0);

  const messages = buildClaimMessage({
    endpoint,
    delegatorAddress: walletAddress,
    validatorAddress,
    amount: formattedAmount,
    denom,
  });

  try {
    const response = await queryRpcNode({
      endpoint,
      messages,
    });

    console.log('Successfully staked:', response);
  } catch (error) {
    console.error('Error during staking:', error);
  }
};

// Function to unstake from a validator
export const unstakeFromValidator = async (amount: string, delegation: DelegationResponse) => {
  const endpoint = CHAIN_ENDPOINTS.undelegateFromValidator;
  const delegatorAddress = delegation.delegation.delegator_address;
  const validatorAddress = delegation.delegation.validator_address;
  const denom = delegation.balance.denom;

  // TODO: format according to passed asset
  // Convert the amount to the smallest unit by multiplying by 10^exponent
  const formattedAmount = (
    parseFloat(amount) *
    Math.pow(10, LOCAL_ASSET_REGISTRY[denom].exponent || GREATER_EXPONENT_DEFAULT)
  ).toFixed(0);

  // Log the formatted amount to ensure it is correct
  console.log('Formatted amount (in smallest unit):', formattedAmount);

  const messages = buildClaimMessage({
    endpoint,
    delegatorAddress,
    validatorAddress,
    amount: formattedAmount,
    denom,
  });

  try {
    const response = await queryRpcNode({
      endpoint,
      messages,
    });

    console.log('Successfully unstaked:', response);
  } catch (error) {
    console.error('Error during unstaking:', error);
  }
};

// Function to unstake from multiple validators
export const unstakeFromAllValidators = async (delegations: DelegationResponse[]) => {
  const endpoint = CHAIN_ENDPOINTS.undelegateFromValidator;

  const messages = buildClaimMessage({
    endpoint,
    delegations,
  });

  try {
    const unstakeResponse = await queryRpcNode({
      endpoint,
      messages,
    });
    console.log('Successfully unstaked:', unstakeResponse);
  } catch (error) {
    console.error('Error during unstaking:', error);
  }
};
