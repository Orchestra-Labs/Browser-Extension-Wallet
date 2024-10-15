import { SigningStargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { queryNode } from './queryNodes';

// Function to claim rewards from a designated validator
export const claimRewardsFromValidator = async (
  delegatorAddress: string,
  validatorAddress: string,
  mnemonic: string,
) => {
  try {
    // Use queryNode to select an available RPC endpoint
    const rpcEndpoint = await queryNode('', '', true); // Use RPC query to get an available node

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'cosmos' });
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);

    const fee = {
      amount: [{ denom: 'uatom', amount: '5000' }],
      gas: '200000',
    };

    const msg = {
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: {
        delegatorAddress: delegatorAddress,
        validatorAddress: validatorAddress,
      },
    };

    const result = await client.signAndBroadcast(delegatorAddress, [msg], fee, '');
    console.log('Rewards claimed successfully from the validator:', result);
  } catch (error) {
    console.error('Error claiming rewards from the validator:', error);
  }
};

// Function to claim rewards and then restake them to a designated validator
export const claimAndRestake = async (
  delegatorAddress: string,
  validatorAddress: string,
  mnemonic: string,
) => {
  try {
    // Use queryNode to select an available RPC endpoint
    const rpcEndpoint = await queryNode('', '', true); // Use RPC query to get an available node

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'cosmos' });
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);

    const fee = {
      amount: [{ denom: 'uatom', amount: '5000' }],
      gas: '200000',
    };

    // Step 1: Claim rewards from the validator
    const claimMsg = {
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: {
        delegatorAddress: delegatorAddress,
        validatorAddress: validatorAddress,
      },
    };

    console.log('Claiming rewards from validator...');
    const claimResult = await client.signAndBroadcast(delegatorAddress, [claimMsg], fee, '');
    if (claimResult.code !== 0) {
      throw new Error(`Failed to claim rewards: ${claimResult.rawLog}`);
    }
    console.log('Rewards claimed successfully:', claimResult);

    // Step 2: Get the available balance to restake
    const availableBalance = await client.getBalance(delegatorAddress, 'uatom');
    if (!availableBalance || parseFloat(availableBalance.amount) <= 0) {
      throw new Error('No available balance to restake');
    }

    const restakeAmount = (parseFloat(availableBalance.amount) - 5000).toFixed(0); // Subtracting 5000 for gas fee

    // Step 3: Restake the claimed rewards to the validator
    const restakeMsg = {
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
      value: {
        delegatorAddress: delegatorAddress,
        validatorAddress: validatorAddress,
        amount: {
          denom: 'uatom',
          amount: restakeAmount,
        },
      },
    };

    console.log('Restaking rewards to validator...');
    const restakeResult = await client.signAndBroadcast(delegatorAddress, [restakeMsg], fee, '');
    if (restakeResult.code !== 0) {
      throw new Error(`Failed to restake rewards: ${restakeResult.rawLog}`);
    }
    console.log('Rewards restaked successfully:', restakeResult);
  } catch (error) {
    console.error('Error during claim and restake:', error);
  }
};

// Function to claim rewards from all validators
export const claimRewardsFromAllValidators = async (
  delegatorAddress: string,
  validatorAddresses: string[],
  mnemonic: string,
) => {
  try {
    // Use queryNode to select an available RPC endpoint
    const rpcEndpoint = await queryNode('', '', true); // Use RPC query to get an available node

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'cosmos' });
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);

    const fee = {
      amount: [{ denom: 'uatom', amount: '5000' }],
      gas: '200000',
    };

    const msgs = validatorAddresses.map(validatorAddress => ({
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: {
        delegatorAddress: delegatorAddress,
        validatorAddress: validatorAddress,
      },
    }));

    const result = await client.signAndBroadcast(delegatorAddress, msgs, fee, '');
    console.log('Rewards claimed successfully from all validators:', result);
  } catch (error) {
    console.error('Error claiming rewards from all validators:', error);
  }
};

// Function to claim rewards from all validators and restake to designated validators
export const claimAndRestakeAll = async (
  delegatorAddress: string,
  validatorAddresses: string[],
  mnemonic: string,
) => {
  try {
    // Use queryNode to select an available RPC endpoint
    const rpcEndpoint = await queryNode('', '', true); // Use RPC query to get an available node

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'cosmos' });
    const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);

    const fee = {
      amount: [{ denom: 'uatom', amount: '5000' }],
      gas: '200000',
    };

    // Step 1: Claim rewards from all validators
    const claimMsgs = validatorAddresses.map(validatorAddress => ({
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: {
        delegatorAddress: delegatorAddress,
        validatorAddress: validatorAddress,
      },
    }));

    console.log('Claiming rewards from all validators...');
    const claimResult = await client.signAndBroadcast(delegatorAddress, claimMsgs, fee, '');
    if (claimResult.code !== 0) {
      throw new Error(`Failed to claim rewards: ${claimResult.rawLog}`);
    }
    console.log('Rewards claimed successfully from all validators:', claimResult);

    // Step 2: Get the available balance to restake
    const availableBalance = await client.getBalance(delegatorAddress, 'uatom');
    if (!availableBalance || parseFloat(availableBalance.amount) <= 0) {
      throw new Error('No available balance to restake');
    }

    const restakeAmount = (parseFloat(availableBalance.amount) - 5000).toFixed(0); // Subtracting 5000 for gas fee

    // Step 3: Restake the claimed rewards to all specified validators (split equally)
    const restakeMsgs = validatorAddresses.map(validatorAddress => ({
      typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
      value: {
        delegatorAddress: delegatorAddress,
        validatorAddress: validatorAddress,
        amount: {
          denom: 'uatom',
          amount: (parseFloat(restakeAmount) / validatorAddresses.length).toFixed(0), // Split equally among validators
        },
      },
    }));

    console.log('Restaking rewards to all validators...');
    const restakeResult = await client.signAndBroadcast(delegatorAddress, restakeMsgs, fee, '');
    if (restakeResult.code !== 0) {
      throw new Error(`Failed to restake rewards: ${restakeResult.rawLog}`);
    }
    console.log('Rewards restaked successfully to all validators:', restakeResult);
  } catch (error) {
    console.error('Error during claim and restake all:', error);
  }
};
