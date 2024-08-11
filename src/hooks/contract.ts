import { useWriteContract, useReadContract, Connector, ConnectorEventMap, CreateConnectorFn, State, useReadContracts } from 'wagmi';
import { BigNumber } from 'ethers';
import {abi as WorldABI} from '../abis/World.json'; // Adjust the path to your actual ABI file
import { readContract } from 'wagmi/actions';
import { Transport } from '@wagmi/core';
import { EventData } from '@wagmi/core/internal';
import { EIP6963ProviderDetail } from 'mipd';
import { Chain, Client, EIP1193RequestFn } from 'viem';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` ?? '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const convertWeiToEth = (wei: bigint): number => {
    return Number(wei) / 10**18
}

export const convertEthToWei = (eth: number): bigint => {
    return BigInt(parseInt((eth * 10**18).toString()))
}

// Hook to read the user's balance of shares for a character
export function useCharacterSharesBalance(characterId: number, address: string) {
  const {
    data,
    error,
    isError,
    isPending,
    isSuccess
  } = useReadContract({
    query: {
        refetchInterval: 2000,
    },
    abi: WorldABI,
    address: contractAddress,
    functionName: 'characterSharesBalance',
    args: [characterId, address],
  });

    return { data: Number(data), error, isError, isPending, isSuccess };
}

// Hook to get the buy price for a specific character's shares
export function useBuyPrice(characterId: number, amount: BigNumber) {
    const {
        data,
        error,
        isError,
        isPending,
        isSuccess
    } = useReadContract({
        abi: WorldABI,
        address: contractAddress,
        functionName: 'getBuyPriceAfterFee',
        args: [characterId, amount],
    });
    let buyPrice = convertWeiToEth(data as bigint);
    buyPrice = Number.isNaN(buyPrice) ? 0 : buyPrice;
    return { data: buyPrice, error, isError, isPending, isSuccess };
}


// Hook to get the sell price for a specific character's shares
export function useSellPrice(characterId: number, amount: BigNumber) {
    const {
        data,
        error,
        isError,
        isPending,
        isSuccess
    } = useReadContract({
        abi: WorldABI,
        address: contractAddress,
        functionName: 'getSellPriceAfterFee',
        args: [characterId, amount],
    });
    let sellPrice = convertWeiToEth(data as bigint);
    sellPrice = Number.isNaN(sellPrice) ? 0 : sellPrice;
    return { data: sellPrice, error, isError, isPending, isSuccess };
}

// Takes in array of objects {characterId, amount}
export const useGetSellPrices = (objects: {characterId: number, amount: number}[]) => {
    console.log("objects", objects)
    const {
        data
    } = useReadContracts({
        contracts: objects?.map(({characterId, amount}) => {
            return {
                abi: WorldABI,
                address: contractAddress,
                functionName: 'getSellPriceAfterFee',
                args: [characterId, BigNumber.from(amount ?? 0)],
            }
        })
    });

    console.log("sell prices", data)

    return { data };
}

// Hook to get the staked amount of a user
export function useStakedAmount(characterId: number, address: string, attribute: number) {
  return useReadContract({
    abi: WorldABI,
    address: contractAddress,
    functionName: 'getStakedAmount',
    args: [characterId, address, attribute],
  });
}

// Hook to buy shares
export function useBuyShares(characterId: number, amount: BigNumber, ethAmount: bigint) {
  const { writeContract, data, error, isError, isPending, isSuccess } = useWriteContract();

  const buyShares = () => {
    writeContract({
      abi: WorldABI,
      address: contractAddress,
      functionName: 'buyShares',
      args: [characterId, amount],
      value: ethAmount,
    });
  };

  return { buyShares, data, error, isError, isSuccess, isPending };
}

// Hook to sell shares
export function useSellShares(characterId: number, amount: BigNumber) {
  const { writeContract, data, error, isError, isSuccess, isPending } = useWriteContract();

  const sellShares = () => {
    writeContract({
      abi: WorldABI,
      address: contractAddress,
      functionName: 'sellShares',
      args: [characterId, amount],
    });
  };

  return { sellShares, data, error, isError, isSuccess, isPending };
}

// Hook to stake shares
export function useStake(characterId: number, attribute: number, amount: BigNumber) {
  const { writeContract, data, error, isError, isSuccess } = useWriteContract();

  const stakeShares = () => {
    writeContract({
      abi: WorldABI,
      address: contractAddress,
      functionName: 'stake',
      args: [characterId, attribute, amount],
    });
  };

  return { stakeShares, data, error, isError, isSuccess };
}

// Hook to unstake shares
export function useUnstake(characterId: number, attribute: number, amount: BigNumber) {
  const { writeContract, data, error, isError, isSuccess } = useWriteContract();

  const unstakeShares = () => {
    writeContract({
      abi: WorldABI,
      address: contractAddress,
      functionName: 'unstake',
      args: [characterId, attribute, amount],
    });
  };

  return { unstakeShares, data, error, isError, isSuccess };
}
