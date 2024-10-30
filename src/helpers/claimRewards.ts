import { CHAIN_ENDPOINTS, GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY } from '@/constants';
import { queryRpcNode } from './queryNodes';
import { DelegationResponse, TransactionResult } from '@/types';
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
): Promise<TransactionResult> => {
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

    if (!response) {
      return {
        success: false,
        message: 'No response received from transaction',
        data: {
          code: 1,
        },
      };
    }

    console.log('Rewards claimed successfully:', response);
    return {
      success: true,
      message: 'Transaction successful',
      data: {
        code: response.code || 0,
        txHash: response.txHash,
        gasUsed: response.gasUsed,
        gasWanted: response.gasWanted,
        height: response.height,
      },
    };
  } catch (error) {
    console.error('Error claiming rewards:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        code: 1,
      },
    };
  }
};

// Function to claim rewards and restake for one or multiple validators
export const claimAndRestake = async (
  delegations: DelegationResponse | DelegationResponse[],
  rewards?: {
    validator: string;
    rewards: { denom: string; amount: string }[];
  }[],
): Promise<TransactionResult> => {
  const delegateEndpoint = CHAIN_ENDPOINTS.delegateToValidator;

  // Ensure delegations is always an array
  const delegationsArray = Array.isArray(delegations) ? delegations : [delegations];
  const delegatorAddress = delegationsArray[0].delegation.delegator_address;
  const validatorAddresses = delegationsArray.map(d => d.delegation.validator_address);

  try {
    // If rewards weren't passed in, fetch them
    const validatorRewards =
      rewards ||
      (await fetchRewards(
        delegatorAddress,
        validatorAddresses.map(addr => ({ validator_address: addr })),
      ));

    // Check if there are any non-zero rewards
    const hasRewards = validatorRewards.some(reward => {
      if (!reward.rewards || reward.rewards.length === 0) return false;
      const amount = parseFloat(reward.rewards[0].amount);
      return amount > 0;
    });

    if (!hasRewards) {
      console.log('No non-zero rewards to claim and delegate');
      return {
        success: false,
        message: 'No rewards to claim',
        data: {
          code: 1,
        },
      };
    }

    // Claim rewards first and check for success
    const claimResponse = await claimRewards(delegatorAddress, validatorAddresses);

    if (!claimResponse.success || claimResponse.data?.code !== 0) {
      return claimResponse;
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
      const response = await queryRpcNode({
        endpoint: delegateEndpoint,
        messages: delegateMessages.flat(),
      });

      if (!response) {
        return {
          success: false,
          message: 'No response received from restake transaction',
          data: {
            code: 1,
          },
        };
      }

      console.log('Rewards claimed and delegated successfully:', response);
      return {
        success: true,
        message: 'Transaction successful',
        data: {
          code: response.code || 0,
          txHash: response.txHash,
          gasUsed: response.gasUsed,
          gasWanted: response.gasWanted,
          height: response.height,
        },
      };
    } else {
      console.log('No rewards to delegate after filtering zero amounts');
      return {
        success: false,
        message: 'No rewards to delegate',
        data: {
          code: 1,
        },
      };
    }
  } catch (error) {
    console.error('Error during claim and restake process:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        code: 1,
      },
    };
  }
};

// Function to stake to a validator
export const stakeToValidator = async (
  amount: string,
  denom: string,
  walletAddress: string,
  validatorAddress: string,
): Promise<TransactionResult> => {
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

    if (!response) {
      return {
        success: false,
        message: 'No response received from transaction',
        data: {
          code: 1,
        },
      };
    }

    console.log('Successfully staked:', response);
    return {
      success: true,
      message: 'Transaction successful',
      data: {
        code: response.code || 0,
        txHash: response.txHash,
        gasUsed: response.gasUsed,
        gasWanted: response.gasWanted,
        height: response.height,
      },
    };
  } catch (error) {
    console.error('Error during staking:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        code: 1,
      },
    };
  }
};

// Function to unstake from a validator
export const unstakeFromValidator = async (
  amount: string,
  delegation: DelegationResponse,
): Promise<TransactionResult> => {
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

    if (!response) {
      return {
        success: false,
        message: 'No response received from transaction',
        data: {
          code: 1,
        },
      };
    }

    console.log('Successfully unstaked:', response);
    return {
      success: true,
      message: 'Transaction successful',
      data: {
        code: response.code || 0,
        txHash: response.txHash,
        gasUsed: response.gasUsed,
        gasWanted: response.gasWanted,
        height: response.height,
      },
    };
  } catch (error) {
    console.error('Error during unstaking:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        code: 1,
      },
    };
  }
};

// Function to unstake from multiple validators
export const unstakeFromAllValidators = async (
  delegations: DelegationResponse[],
): Promise<TransactionResult> => {
  const endpoint = CHAIN_ENDPOINTS.undelegateFromValidator;

  const messages = buildClaimMessage({
    endpoint,
    delegations,
  });

  try {
    const response = await queryRpcNode({
      endpoint,
      messages,
    });

    if (!response) {
      return {
        success: false,
        message: 'No response received from transaction',
        data: {
          code: 1,
        },
      };
    }

    console.log('Successfully unstaked:', response);
    return {
      success: true,
      message: 'Transaction successful',
      data: {
        code: response.code || 0,
        txHash: response.txHash,
        gasUsed: response.gasUsed,
        gasWanted: response.gasWanted,
        height: response.height,
      },
    };
  } catch (error) {
    console.error('Error during unstaking:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        code: 1,
      },
    };
  }
};
