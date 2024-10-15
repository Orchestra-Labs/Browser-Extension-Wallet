const APP_ROOT = '/';
const AUTH_ROOT = '/auth';

export const ROUTES = {
  APP: {
    ROOT: APP_ROOT,
    TRANSACTIONS_HISTORY: `/history`,
    TRANSACTION: `/history/:id`,
    SEND: '/send',
    RECEIVE: '/send',
    ADD_NETWORK: '/add-network',
  },
  AUTH: {
    ROOT: AUTH_ROOT,
    NEW_WALLET: {
      ROOT: `${AUTH_ROOT}/wallet`,
      CREATE: `${AUTH_ROOT}/wallet/create`,
      IMPORT: `${AUTH_ROOT}/wallet/import`,
    },
  },
};
