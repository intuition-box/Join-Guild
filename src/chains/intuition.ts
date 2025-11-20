import { defineChain } from 'viem'

export const intuitionTestnet = defineChain({
  id: 13579,
  name: 'Intuition Testnet',
  network: 'intuition-testnet',
  nativeCurrency: {
    name: 'Testnet TRUST',
    symbol: 'TTRUST',
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.rpc.intuition.systems'],
      webSocket: ['wss://testnet.rpc.intuition.systems/ws'],
    },
    public: {
      http: ['https://testnet.rpc.intuition.systems'],
      webSocket: ['wss://testnet.rpc.intuition.systems/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'IntuitionScan (Testnet)',
      url: 'https://testnet.explorer.intuition.systems/',
      apiUrl: 'https://testnet.explorer.intuition.systems/api',
    },
  },
  testnet: true,
})

export const intuitionMainnet = defineChain({
  id: 1155,
  name: 'Intuition',
  network: 'intuition',
  nativeCurrency: {
    name: 'TRUST',
    symbol: 'TRUST',
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.intuition.systems/http'],
    },
    public: {
      http: ['https://rpc.intuition.systems/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'IntuitionScan',
      url: 'https://explorer.intuition.systems/',
      apiUrl: 'https://explorer.intuition.systems/api',
    },
  },
  testnet: false,
})

