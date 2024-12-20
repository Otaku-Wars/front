import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom';
import {PrivyProvider} from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import "./globals.css"
import { EthPriceProvider } from './EthPriceProvider.tsx';
import { ActivityProvider } from './components/ActivityListenerProvider.tsx';
import { TimerProvider } from './contexts/TimerContext.tsx';

const isProd = import.meta.env.PROD;
export const currentChain = isProd ?
  base :
  defineChain({
    id: 31337,
    name: 'Localhost',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: [import.meta.env.VITE_HTTP_RPC_URL ?? 'http://localhost:8545'] },
    },
  })

export const apiUrl = import.meta.env.VITE_API_URL as string
export const httpRpc = import.meta.env.VITE_HTTP_RPC_URL as string
export const wsApiUrl = import.meta.env.VITE_WS_API_URL as string
export const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string
const queryClient = new QueryClient()
console.log('apiUrl', apiUrl)
console.log('httpRpc', httpRpc)
console.log('contractAddress', contractAddress)
console.log('wsApiUrl', wsApiUrl)
console.log('currentChain', currentChain.name)
console.log('isProd', isProd)

export const config = createConfig({
  chains: [currentChain],
  transports: {
    [currentChain.id]: http()
  } as any
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId="clzlu1sf0009xediwgtczg7yq"
        config={{
          defaultChain: currentChain,
          supportedChains: [currentChain],
          // Display email and wallet as login methods
          loginMethods: ['email', 'wallet', 'twitter'],
          // Customize Privy's appearance in your app
          appearance: {
            theme: 'dark',
          },
        }}
      >
        <WagmiProvider config={config}>
          <EthPriceProvider> 
            <ActivityProvider>
              <TimerProvider>
                <App />
              </TimerProvider>
            </ActivityProvider>
          </EthPriceProvider>
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
