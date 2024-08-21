export const convertWeiToEth = (wei: bigint): number => {
    return Number(wei) / 10**18
}

//Smart contract simulation functions
export const getCurve = (supply: number, amount: number): number => {
    const k = BigInt(1);
    const supplyCubed = BigInt(supply) * BigInt(supply) * BigInt(supply);
    const newSupply = BigInt(supply) + BigInt(amount);
    const newSupplyCubed = newSupply * newSupply * newSupply;
    const area = (k * (newSupplyCubed - supplyCubed)) / BigInt(3);
    const scaledArea = (area * (BigInt(1e18))) / BigInt(100000000);

    return convertWeiToEth(scaledArea);
}

export const getPrice = (supply: number, amount: number, scalingFactor: number): number => {
    const price = getCurve(supply, amount);
    return price * scalingFactor;
}

export const getScalingFactor = (supply: number, value: number): number => {
    const xf = supply;
    const originalValue = getCurve(0, xf);

    if (originalValue === 0) return 1;

    const scalingFactor = BigInt(value) * BigInt(1e18) / BigInt(originalValue);

    return scalingFactor === BigInt(0) ? 1 : convertWeiToEth(scalingFactor);
}

export const getBuyPrice = (supply: number, value: number): number => {
    //console.log("getBuyPrice", supply, value)
    const scalingFactor = getScalingFactor(supply, value);
    //console.log("scalingFactor", scalingFactor)
    const price = getPrice(supply, 1, scalingFactor);
    return price;
}