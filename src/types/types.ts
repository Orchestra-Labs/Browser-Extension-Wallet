import { NetworkLevel } from '@/constants';

export interface SessionToken {
  mnemonic: string;
  accountID: string;
  rememberMe: boolean;
  timestamp: string;
}

export interface SubscriptionRecord {
  coinDenoms: string[];
}

export interface WalletRecord {
  id: string;
  name: string;
  encryptedMnemonic: string;
  settings: {};
}

export interface AccountRecord {
  id: string; // password and account share ID
  // prioritize lowest level settings for priority (wallet visibility over account visibility)
  settings: {
    hasSetCoinList: boolean;
    defaultNetworkID: string;
    defaultCoinDenom: string;
    subscribedTo: { [networkID: string]: SubscriptionRecord };
    activeWalletID: string;
  };
  wallets: WalletRecord[];
}

export interface PasswordRecord {
  id: string; // password and account share ID
  hash: string;
  salt: string;
}

export interface Asset {
  denom: string;
  amount: string;
  exchangeRate?: string;
  isIbc: boolean;
  logo?: string;
  symbol?: string;
  exponent?: number;
  isFeeToken?: boolean;
  networkName?: string;
  networkID?: string;
}

export interface WalletAssets {
  address: string;
  assets: Asset[];
}

export interface SendObject {
  recipientAddress: string;
  amount: string;
  denom: string;
}
export interface SwapObject {
  sendObject: SendObject;
  resultDenom: string;
}

export interface IBCObject {
  fromAddress: string;
  sendObject: SendObject;
  sendChain: string;
  receiveChain: string;
  networkLevel: NetworkLevel;
}

export interface DelegationResponse {
  delegation: {
    delegator_address: string;
    validator_address: string;
    shares: string;
  };
  balance: {
    denom: string;
    amount: string;
  };
}

export interface Pagination {
  next_key: string | null;
  total: string;
}

export interface ValidatorInfo {
  operator_address: string;
  consensus_pubkey: {
    '@type': string;
    key: string;
  };
  jailed: boolean;
  status: string; // Bonded, Unbonding, Unbonded
  tokens: string;
  delegator_shares: string;
  description: {
    moniker: string;
    website: string;
    details: string;
  };
  commission: {
    commission_rates: {
      rate: string;
      max_rate: string;
      max_change_rate: string;
    };
  };
}

export interface ValidatorReward {
  validator: string;
  rewards: any[];
}

export interface UnbondingDelegationEntry {
  balance: string;
  completion_time: string;
}

export interface UnbondingDelegationResponse {
  delegator_address: string;
  validator_address: string;
  entries: UnbondingDelegationEntry[];
}

export interface CombinedStakingInfo {
  delegation: DelegationResponse['delegation'];
  balance: DelegationResponse['balance'];
  validator: ValidatorInfo;
  rewards: ValidatorReward['rewards'];
  stakingParams?: StakingParams | null;
  estimatedReturn?: string;
  votingPower?: string;
  uptime?: string;
  unbondingBalance?: UnbondingDelegationEntry;
}

//Create base RPC response interface
export interface BaseRPCResponse {
  code: number;
  message?: string;
}

//Extend specifically for tx's
export interface TransactionRPCResponse extends BaseRPCResponse {
  txHash?: string;
  gasUsed?: string;
  gasWanted?: string;
  height?: number;
}

//TX result incl the response
export interface TransactionResult {
  success: boolean;
  message: string;
  data?: TransactionRPCResponse;
}

export interface TransactionSuccess {
  isSuccess: boolean;
  txHash?: string;
}

export interface RPCResponse {
  code: number;
  txhash?: string;
  gasUsed?: string;
  gasWanted?: string;
  message?: string;
  rawLog?: string;
  height?: number;

  // REST responses
  delegation_responses?: Array<{
    delegation: {
      delegator_address: string;
      validator_address: string;
      shares: string;
    };
    balance: {
      denom: string;
      amount: string;
    };
  }>;

  // Validator fields
  validators?: ValidatorInfo[];
  validator?: ValidatorInfo;

  // Pagination fields
  pagination?: {
    next_key: string | null;
    total: string;
  };

  // Rewards fields
  rewards?:
    | Array<{
        validator_address: string;
        reward: any[];
      }>
    | any[]; // Allow both formats of rewards
  reward?: any[]; // For single validator rewards

  params?: StakingParams;

  // Catch-all
  [key: string]: any;
}

export interface StakingParams {
  unbonding_time: string;
  max_validators: number;
  max_entries: number;
  historical_entries: number;
  bond_denom: string;
}

export interface ChainRecord {
  name: string;
  chainId: string;
  rpcUrls: string[];
  restUrls: string[];
  status: string;
}

// TODO: ensure IBC channel used is always the one for the sending chain
export interface IBCChannel {
  channel_id: string;
  port_id: string;
  state: string;
  counterparty: {
    channel_id: string;
    port_id: string;
  };
}

export interface ChainData {
  coin: string;
  mainnet: string;
  testnet: string;
}

export interface PrefixStorage {
  lastUpdated: string;
  data: ChainData[];
}

export interface GitHubFile {
  name: string;
  path: string;
  download_url: string;
}

export interface GitHubFileResponse {
  content: string;
  encoding: string;
}

export interface IBCConnectionFileChain {
  chain_name: string;
  client_id: string;
  connection_id: string;
}

export interface IBCConnectionFileChannel {
  channel_id: string;
  port_id: string;
}

export interface IBCConnectionFile {
  chain_1: any;
  chain_2: any;
  channels: Array<{
    chain_1: IBCConnectionFileChannel;
    chain_2: IBCConnectionFileChannel;
  }>;
}

export interface TransactionState {
  asset: Asset;
  amount: number;
  chainName: string;
  networkLevel: NetworkLevel;
}
