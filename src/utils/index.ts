import { readContract } from '@wagmi/core'
import { config } from '../main'
import {abi as WorldABI} from '../abis/World.json'; // Adjust the path to your actual ABI file
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` ?? '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const convertWeiToEth = (wei: bigint): number => {
    return Number(wei) / 10**18
}

export const getPrice = async (supply: number, amount: number, scalingFactor: number): Promise<number> => {
    const price = await getCurveCall(supply, amount);
    return price * scalingFactor;
}

export const getScalingFactor = async (supply: number, value: number, originalValue: number): Promise<number> => {
    if (originalValue === 0) return 1;

    //console.log("originalValue", originalValue);
    //console.log("value", value);

    // Multiply value and originalValue by 1e18 to work with integers only
    const valueWei = BigInt(Math.floor(value * 1e18));
    const originalValueWei = BigInt(Math.floor(originalValue * 1e18));

    const scalingFactor = valueWei * BigInt(1e18) / originalValueWei;

    return scalingFactor === BigInt(0) ? 1 : convertWeiToEth(scalingFactor);
}

export const getBuyPrice = async (supply: number, value: number): Promise<number> => {
    const originalValue = await getCurveCall(0, supply);
    console.log("ccc originalValue", originalValue)
    const scalingFactor = await getScalingFactor(supply, value, originalValue);
    //console.log("scalingFactor", scalingFactor)
    const price = await getPrice(supply, 1, scalingFactor);
    return price;
}

export const getSellPriceMc = async (supply: number, value: number, amount: number): Promise<number> => {
    const originalValue = await getCurveCall(0, supply);
    const scalingFactor = await getScalingFactor(supply, value, originalValue);
    console.log("scalingFactor", scalingFactor)
    const price = await getPrice(supply-amount, amount, scalingFactor);
    return price;
}

export const getSellPrice = async (supply: number, value: number): Promise<number> => {
    const originalValue = await getCurveCall(0, supply);
    const scalingFactor = await getScalingFactor(supply, value, originalValue);
    //console.log("scalingFactor", scalingFactor)
    const price = await getPrice(supply+1, supply, scalingFactor);
    return price;
}

export const getPriceCall = async (characterId: number): Promise<number> => {
    const amount = await readContract(config,{
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: WorldABI,
        functionName: 'getBuyPrice',
        args: [BigInt(characterId), BigInt(1)],
    }) as bigint;

    return convertWeiToEth(amount);
}

export const DEFAULT_A = 0.05e18;
export const DEFAULT_B = 50000e18;
export const DEFAULT_C = 10000000e18;

export const getCurveCall = async (supply: number, amount: number): Promise<number> => {
    const curve = await readContract(config,{
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: WorldABI,
        functionName: 'getCurve',
        args: [BigInt(supply), BigInt(amount), BigInt(DEFAULT_A), BigInt(DEFAULT_B), BigInt(DEFAULT_C)],
    }) as bigint;

    return convertWeiToEth(curve);
}