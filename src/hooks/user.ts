import { useBalance as wagmiUseBalance, useSendTransaction } from 'wagmi';
import { parseUnits } from 'ethers/lib/utils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { zeroAddress } from 'viem';

export const useAddress = (): `0x${string}` => {
    const { user } = usePrivy()
    const address = user?.wallet?.address ?? zeroAddress;
    return address as `0x${string}`
}

export const useBalance = (address: `0x${string}`) => {
  const { data, isError, isLoading, error } = wagmiUseBalance({
    query: {
        refetchInterval: 2000,
    },
    address,
  });
console.log("getting balance", data)
  return {
    balance: data?.formatted,
    balanceNumber: parseFloat(data?.formatted ?? '0'),
    isLoading,
    isError,
    error,
  };
}

export const useWithdraw = () => {
  const { sendTransaction, data, isError, isPending, isSuccess, error } = useSendTransaction();

  const withdraw = (to: `0x${string}`, amount: number) => {
    sendTransaction({
      to,
      value: parseUnits(amount.toString(), 'ether').toBigInt(),
    });
  };

  return {
    withdraw,
    data,
    isPending,
    isError,
    isSuccess,
    error,
  };
}
