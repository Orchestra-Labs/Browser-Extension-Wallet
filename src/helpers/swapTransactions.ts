import { osmosis } from '@orchestra-labs/symphonyjs';
import { incrementErrorCount, performRpcQuery, selectNodeProviders } from './queryNodes';
import { SwapObject, TransactionResult, RPCResponse} from '@/types';
import { CHAIN_ENDPOINTS, DELAY_BETWEEN_NODE_ATTEMPTS, MAX_NODES_PER_QUERY } from '@/constants';
import { createOfflineSignerFromMnemonic } from './wallet';
import { getSigningOsmosisClient } from '@orchestra-labs/symphonyjs';
import { delay } from './timer';
import { getSessionToken } from './localStorage';

const { swapSend } = osmosis.market.v1beta1.MessageComposer.withTypeUrl;

// TODO: merge in with queryNodes.  do not need separate signer if endpoint and message object are used
const queryWithRetry = async ({
  endpoint,
  walletAddress,
  messages = [],
  feeDenom,
}: {
  endpoint: string;
  walletAddress: string;
  messages?: any[];
  feeDenom: string;
}): Promise<any> => {
  const providers = selectNodeProviders();
  console.log('Selected node providers:', providers);

  let numberAttempts = 0;

  while (numberAttempts < MAX_NODES_PER_QUERY) {
    for (const provider of providers) {
      try {
        const queryMethod = provider.rpc;
        console.log(`Querying node ${queryMethod} with endpoint: ${endpoint}`);

        const sessionToken = getSessionToken();
        if (!sessionToken){
          console.error('Error- getSessionTokenFailed');
          return
          
        }
        const offlineSigner = await createOfflineSignerFromMnemonic(sessionToken.mnemonic || '');

        const client = await getSigningOsmosisClient({
          rpcEndpoint: queryMethod,
          signer: offlineSigner,
        });

        const result = await performRpcQuery(client, walletAddress, messages, feeDenom);
        return result;
      } catch (error) {
        incrementErrorCount(provider.rpc);
        console.error('Error querying node:', error);
      }
      numberAttempts++;

      if (numberAttempts >= MAX_NODES_PER_QUERY) {
        break;
      }

      await delay(DELAY_BETWEEN_NODE_ATTEMPTS);
    }
  }

  throw new Error(`All node query attempts failed after ${MAX_NODES_PER_QUERY} attempts.`);
};

export const swapTransaction = async (fromAddress: string, swapObject: SwapObject): Promise<TransactionResult> => {
    const endpoint = CHAIN_ENDPOINTS.sendMessage;


  const messages = [
    swapSend({
      fromAddress,
      toAddress: swapObject.sendObject.recipientAddress,
      offerCoin: {
        denom: swapObject.sendObject.denom,
        amount: swapObject.sendObject.amount,
      },
      askDenom: swapObject.resultDenom,
    }),
  ];

  try {
    const response = await queryWithRetry({
      endpoint,
      walletAddress: fromAddress,
      messages,
      feeDenom: swapObject.sendObject.denom,
    });

    console.log('Successfully sent:', response);
    return {
      success: true,
      message: 'Swap transaction completed successfully!',
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
      message: 'Error performing swap transaction. Please try again.',
      data: errorResponse,
    };
  }
};

// TODO: support swapping multiple tramsactons (fee is currently a blocker)
export const multiSwapTransaction = async (fromAddress: string, swapObjects: SwapObject[]): Promise<TransactionResult> => {
  const endpoint = CHAIN_ENDPOINTS.sendMessage;

  const messages = swapObjects.map(swapObject =>
    swapSend({
      fromAddress,
      toAddress: swapObject.sendObject.recipientAddress,
      offerCoin: {
        denom: swapObject.sendObject.denom,
        amount: swapObject.sendObject.amount,
      },
      askDenom: swapObject.resultDenom,
    }),
  );

  try {
    const response = await queryWithRetry({
      endpoint,
      walletAddress: fromAddress,
      messages,
      feeDenom: swapObjects[0].sendObject.denom,
    });

    console.log('Successfully sent to all recipients:', response);
    return {
      success: true,
      message: 'Multiple swap transactions completed successfully!',
      data: response,
    };
  } catch (error: any) {
    console.error('Error during multiple swap:', error);
    
    //construct error response in RPCResponse type
    const errorResponse : RPCResponse = {
      code: error.code || 1,
      message: error.message,
    };

    return {
      success: false,
      message: 'Error performing multipleswap transaction. Please try again.',
      data: errorResponse,
    };
  }
};
