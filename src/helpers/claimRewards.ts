import { CHAIN_ENDPOINTS, GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY } from '@/constants';
import { queryRpcNode } from './queryNodes';
import { DelegationResponse } from '@/types';
import { fetchRewards } from './fetchStakingInfo';

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
    return response;
  } catch (error) {
    console.error('Error claiming rewards:', error);
    throw error;
  }
};

// Function to claim rewards and restake for one or multiple validators
export const claimAndRestake = async (delegations: DelegationResponse | DelegationResponse[], rewards?: {
  validator: string;
  rewards: { denom: string; amount: string }[];
}[]) => {
  const delegateEndpoint = CHAIN_ENDPOINTS.delegateToValidator;

  // Ensure delegations is always an array
  const delegationsArray = Array.isArray(delegations) ? delegations : [delegations];
  const delegatorAddress = delegationsArray[0].delegation.delegator_address;
  const validatorAddresses = delegationsArray.map(d => d.delegation.validator_address);

  try {
    // If rewards weren't passed in, fetch them
    const validatorRewards = rewards || await fetchRewards(
      delegatorAddress,
      validatorAddresses.map(addr => ({ validator_address: addr }))
    );

    // Check if there are any non-zero rewards
    const hasRewards = validatorRewards.some(reward => {
      if (!reward.rewards || reward.rewards.length === 0) return false;
      const amount = parseFloat(reward.rewards[0].amount);
      return amount > 0;
    });

    if (!hasRewards) {
      console.log('No non-zero rewards to claim and delegate');
      return null;
    }

    // Claim rewards first and check for success
    let claimResponse;
    try {
      claimResponse = await claimRewards(delegatorAddress, validatorAddresses);
      
      // Check if the claim was successful
      if (!claimResponse) {
        throw new Error('No response received from claim transaction');
      }

      if (claimResponse.code !== 0) {
        throw new Error(`Claim failed: ${claimResponse.rawLog || 'Unknown error'}`);
      }

      // Create delegation messages for each validator with their respective reward amounts
      const delegateMessages = validatorRewards.flatMap(reward => {
        // Skip if no rewards or zero rewards
        if (!reward.rewards || reward.rewards.length === 0) return [];

        const { denom, amount } = reward.rewards[0];
        
        // Skip if reward amount is zero
        if (parseFloat(amount) <= 0) return [];

        // Format the amount according to the asset's exponent
        const formattedAmount = amount.split('.')[0]; // Remove any decimal places if present

        return buildClaimMessage({
          endpoint: delegateEndpoint,
          delegatorAddress,
          validatorAddress: reward.validator,
          amount: formattedAmount,
          denom,
        });
      });

      // Only proceed with delegation if there are messages (implying non-zero rewards)
      if (delegateMessages.length > 0) {
        const restakeResponse = await queryRpcNode({
          endpoint: delegateEndpoint,
          messages: delegateMessages.flat(),
        });

        if (restakeResponse.code !== 0) {
          throw new Error(`Failed to restake rewards: ${restakeResponse.rawLog}`);
        }

        console.log('Rewards claimed and delegated successfully:', restakeResponse);
        return restakeResponse;
      } else {
        console.log('No rewards to delegate after filtering zero amounts');
        return null;
      }
    } catch (error) {
      console.error('Error during claim or restake:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error during claim and restake process:', error);
    throw error;
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
    return response;
  } catch (error) {
    console.error('Error during staking:', error);
    throw error;
  }
};

// Function to unstake from a validator
export const unstakeFromValidator = async (amount: string, delegation: DelegationResponse) => {
  const endpoint = CHAIN_ENDPOINTS.undelegateFromValidator;
  const delegatorAddress = delegation.delegation.delegator_address;
  const validatorAddress = delegation.delegation.validator_address;
  const denom = delegation.balance.denom;

  // Convert the amount to the smallest unit by multiplying by 10^exponent
  const formattedAmount = (
    parseFloat(amount) *
    Math.pow(10, LOCAL_ASSET_REGISTRY[denom].exponent || GREATER_EXPONENT_DEFAULT)
  ).toFixed(0);

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
    return response;
  } catch (error) {
    console.error('Error during unstaking:', error);
    throw error;
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
    return unstakeResponse;
  } catch (error) {
    console.error('Error during unstaking:', error);
    throw error;
  }
};