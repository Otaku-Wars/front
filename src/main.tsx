import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom';
import {PrivyProvider} from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

export const currentChain = defineChain({
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
const queryClient = new QueryClient()
console.log('apiUrl', apiUrl)


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
            theme: 'light',
            accentColor: '#676FFF',
            logo: "https://cdn.discordapp.com/attachments/1264677515239358505/1270843771713617920/gb.gif?ex=66b7273e&is=66b5d5be&hm=cc83d0edd82b04ebadd3d3c26b023687f90434fa546b879d9b51964b7048a84c&" // Add your logo image URL here
          },
        }}
      >
        <WagmiProvider config={createConfig({
          chains: [currentChain],
          transports: {
            [currentChain.id]: http()
          }})}
        >
          <App />
        </WagmiProvider>
      </PrivyProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
