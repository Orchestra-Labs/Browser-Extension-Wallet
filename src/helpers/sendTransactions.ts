import { CHAIN_ENDPOINTS } from '@/constants';
import { queryRpcNode } from './queryNodes';
import { SendObject, TransactionResult , RPCResponse } from '@/types';

export const sendTransaction = async (fromAddress: string, sendObject: SendObject) : Promise<TransactionResult> => {
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
    const response = await queryRpcNode({
      endpoint,
      messages,
      feeDenom: sendObject.denom,
    });

    console.log('Successfully sent:', response);
    return {
      success: true,
      message: 'Transaction sent successfully!',
      data: response,
    };
  } catch (error: any) {
    console.error('Error during send:', error);
    
    //construct error response in RPCResponse type
    const errorResponse : RPCResponse = {
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

// TODO: suppose sends of multiple different currencies
export const multiSendTransaction = async (fromAddress: string, sendObjects: SendObject[]) : Promise<TransactionResult> => {
    const endpoint = CHAIN_ENDPOINTS.sendMessage;


  const messages = sendObjects.map(sendObject => ({
    typeUrl: endpoint,
    value: {
      fromAddress,
      toAddress: sendObject.recipientAddress,
      amount: [{ denom: sendObject.denom, amount: sendObject.amount }],
    },
  }));

  try {
    const response = await queryRpcNode({
      endpoint,
      messages,
      feeDenom: sendObjects[0].denom,
    });

    console.log('Successfully sent to all recipients:', response);
    return {
      success: true,
      message: 'Transactions sent successfully to all recipients!',
      data: response,
    };
  } catch (error: any) {
    console.error('Error during send:', error);
    
    //construct error response in RPCResponse type
    const errorResponse : RPCResponse = {
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

