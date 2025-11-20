import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import App from './App'
import { intuitionTestnet, intuitionMainnet } from './chains/intuition'

const isProd = import.meta.env.PROD
const activeChain = isProd ? intuitionMainnet : intuitionTestnet
const chains = [intuitionTestnet, intuitionMainnet]

const wagmiConfig = createConfig({
  chains,
  transports: {
    [intuitionTestnet.id]: http(intuitionTestnet.rpcUrls.default.http[0]),
    [intuitionMainnet.id]: http(intuitionMainnet.rpcUrls.default.http[0]),
  },
  connectors: [injected()],
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains} initialChain={activeChain} modalSize="compact">
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)

