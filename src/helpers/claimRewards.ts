import { CHAIN_ENDPOINTS, GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY } from '@/constants';
import { queryRpcNode } from './queryNodes';
import { DelegationResponse, TransactionResult } from '@/types';
import { fetchRewards } from './fetchStakingInfo';

// TODO: verify multiple messages add fees from queryNodes properly.  shouldn't need magic number below
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

export const claimRewards = async (
  delegatorAddress: string,
  validatorAddress: string | string[],
  simulateOnly = false,
): Promise<TransactionResult> => {
  const endpoint = CHAIN_ENDPOINTS.claimRewards;
  const validatorAddressesArray = Array.isArray(validatorAddress)
    ? validatorAddress
    : [validatorAddress];
  const messages = buildClaimMessage({
    endpoint,
    delegatorAddress,
    validatorAddress: validatorAddressesArray,
  });

  try {
    const response = await queryRpcNode({
      endpoint,
      messages,
      simulateOnly,
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

    if (simulateOnly) {
      return {
        success: true,
        message: 'Simulation successful',
        data: response,
      };
    }

    return {
      success: true,
      message: 'Transaction successful',
      data: response,
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

// TODO: fails occasionally on restake.  find out why and fix.  needs timeout?
export const claimAndRestake = async (
  delegations: DelegationResponse | DelegationResponse[],
  rewards?: { validator: string; rewards: { denom: string; amount: string }[] }[],
  simulateOnly = false,
): Promise<TransactionResult> => {
  const delegateEndpoint = CHAIN_ENDPOINTS.delegateToValidator;
  const delegationsArray = Array.isArray(delegations) ? delegations : [delegations];
  const delegatorAddress = delegationsArray[0].delegation.delegator_address;
  const validatorAddresses = delegationsArray.map(d => d.delegation.validator_address);

  try {
    console.log("claim and restake:")
    const validatorRewards =
      rewards ||
      (await fetchRewards(
        delegatorAddress,
        validatorAddresses.map(addr => ({ validator_address: addr })),
      ));
    const hasRewards = validatorRewards.some(
      reward => parseFloat(reward.rewards[0]?.amount || '0') > 0,
    );
  
    if (!hasRewards) { 
      return { success: false, message: 'No rewards to claim', data: { code: 1 } };
    }
    // Create claim messages using same structure as claimRewards
    const claimMessages = buildClaimMessage({
      endpoint: CHAIN_ENDPOINTS.claimRewards,
      delegatorAddress,
      validatorAddress: validatorAddresses,
    });

    // Create delegate messages
    const delegateMessages = validatorRewards.flatMap(reward =>
      buildClaimMessage({
        endpoint: delegateEndpoint,
        delegatorAddress,
        validatorAddress: reward.validator,
        amount: reward.rewards[0].amount.split('.')[0],
        denom: reward.rewards[0].denom,
      }),
    );

    // Combine messages in correct order
    const batchedMessages = [...claimMessages, ...delegateMessages];

    if (simulateOnly) {
      const simulateResponse = await queryRpcNode({
        endpoint: delegateEndpoint,
        messages: batchedMessages,
        simulateOnly: true
      });
      if (!simulateResponse) {
        return {
          success: false,
          message: 'No response received from delegation',
          data: { code: 1 },
        };
      }
      
      return {
        success: true,
        message: 'Simulation successful',
        data: {...simulateResponse.data, 
          gasWanted: parseFloat(simulateResponse.gasWanted || '0')
        }
      };
    }
    console.log("made it to batched tx submission")
    // Execute batched transaction
    if (batchedMessages.length > 0) {
      const response = await queryRpcNode({
        endpoint: delegateEndpoint,
        messages: batchedMessages,
      });
      return { success: true, message: 'Batch transaction successful', data: response };
    }

    return { success: false, message: 'No messages to process', data: { code: 1 } };
  } catch (error) {
    console.error('Error during batch claim and restake process:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: { code: 1 },
    };
  }
};

export const stakeToValidator = async (
  amount: string,
  denom: string,
  walletAddress: string,
  validatorAddress: string,
  simulateOnly = false,
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
      simulateOnly,
    });

    if (!response) {
      return {
        success: false,
        message: 'No response received from transaction',
        data: { code: 1 },
      };
    }

    if (simulateOnly) {
      return { success: true, message: 'Simulation successful', data: response };
    }

    return { success: true, message: 'Transaction successful', data: response };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: { code: 1 },
    };
  }
};

export const unstakeFromValidator = async ({
  delegations,
  amount,
  simulateOnly = false,
}: {
  delegations: DelegationResponse | DelegationResponse[];
  amount?: string;
  simulateOnly?: boolean;
}): Promise<TransactionResult> => {
  const endpoint = CHAIN_ENDPOINTS.undelegateFromValidator;
  const delegationsArray = Array.isArray(delegations) ? delegations : [delegations];
  const isSingleDelegation = delegationsArray.length === 1 && amount;

  // If there's a single delegation and amount is provided, format the amount
  const messages = isSingleDelegation
    ? buildClaimMessage({
        endpoint,
        delegatorAddress: delegationsArray[0].delegation.delegator_address,
        validatorAddress: delegationsArray[0].delegation.validator_address,
        amount: (
          parseFloat(amount!) *
          Math.pow(
            10,
            LOCAL_ASSET_REGISTRY[delegationsArray[0].balance.denom].exponent ||
              GREATER_EXPONENT_DEFAULT,
          )
        ).toFixed(0),
        denom: delegationsArray[0].balance.denom,
      })
    : buildClaimMessage({
        endpoint,
        delegations: delegationsArray,
      });

  try {
    const response = await queryRpcNode({
      endpoint,
      messages,
      simulateOnly,
    });

    if (!response) {
      return {
        success: false,
        message: 'No response received from transaction',
        data: { code: 1 },
      };
    }

    if (simulateOnly) {
      return { success: true, message: 'Simulation successful', data: response };
    }

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
      data: { code: 1 },
    };
  }
};
