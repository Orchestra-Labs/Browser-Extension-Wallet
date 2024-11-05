import { CHAIN_ENDPOINTS } from '@/constants';
import { queryRpcNode } from './queryNodes';
import { SendObject, TransactionResult, RPCResponse, Asset } from '@/types';
import { getValidFeeDenom } from './feeDenom';

export const isValidSend = ({
  sendAsset,
  receiveAsset,
}: {
  sendAsset: Asset;
  receiveAsset: Asset;
}) => {
  const result = sendAsset.denom === receiveAsset.denom;
  console.log('Checking if valid send:', { sendAsset, receiveAsset, result });
  return result;
};

export const sendTransaction = async (
  fromAddress: string,
  sendObject: SendObject,
  simulateOnly: boolean = false,
): Promise<TransactionResult> => {
  const endpoint = CHAIN_ENDPOINTS.sendMessage;

  const messages = [
    {
      typeUrl: endpoint,
      value: {
        fromAddress,
        toAddress: sendObject.recipientAddress,
        amount: [{ denom: sendObject.denom, amount: sendObject.amount }],
      },
    },
  ];

  try {
    const feeDenom = getValidFeeDenom(sendObject.denom);
    const response = await queryRpcNode({
      endpoint,
      messages,
      feeDenom,
      simulateOnly,
    });

    if (simulateOnly) {
      return {
        success: true,
        message: 'Simulation completed successfully!',
        data: response,
      };
    }

    return {
      success: true,
      message: 'Transaction sent successfully!',
      data: response,
    };
  } catch (error: any) {
    console.error('Error during send:', error);

    // Construct error response in RPCResponse type
    const errorResponse: RPCResponse = {
      code: error.code || 1,
      message: error.message,
    };

    return {
      success: false,
      message: 'Error sending transaction. Please try again.',
      data: errorResponse,
    };
  }
};

// TODO: Fix for case of sending of multiple different currencies
// Function to send multiple transactions, with optional simulation mode
export const multiSendTransaction = async (
  fromAddress: string,
  sendObjects: SendObject[],
  simulateOnly: boolean = false, // New parameter for simulation
): Promise<TransactionResult> => {
  const endpoint = CHAIN_ENDPOINTS.sendMessage;

  const messages = sendObjects.map(sendObject => ({
    typeUrl: endpoint,
    value: {
      fromAddress,
      toAddress: sendObject.recipientAddress,
      amount: [{ denom: sendObject.denom, amount: sendObject.amount }],
    },
  }));

  const feeDenom = getValidFeeDenom(sendObjects[0].denom);

  try {
    const response = await queryRpcNode({
      endpoint,
      messages,
      feeDenom,
      simulateOnly,
    });

    if (simulateOnly) {
      return {
        success: true,
        message: 'Simulation of multi-send completed successfully!',
        data: response,
      };
    }

    return {
      success: true,
      message: 'Transactions sent successfully to all recipients!',
      data: response,
    };
  } catch (error: any) {
    console.error('Error during multi-send:', error);

    // construct error response in RPCResponse type
    const errorResponse: RPCResponse = {
      code: error.code || 1,
      message: error.message,
    };

    return {
      success: false,
      message: 'Error sending transactions. Please try again.',
      data: errorResponse,
    };
  }
};
