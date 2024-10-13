import { useQueries, useQuery } from "@tanstack/react-query";
import { apiUrl } from "../main";
import { Character, CurrentBattleState, User } from "@memeclashtv/types";
import { Activity, MatchEndActivity, StakeActivity, TradeActivity } from "@memeclashtv/types/activity";
import { useEthPrice } from "../EthPriceProvider";
import { useCallback, useMemo } from "react";


export const useCharacter = (characterId: number): { data: Character | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useCharacters();
    const character = data?.find(c => c.id === characterId);
    return { data:character, isLoading, isError };
}

export const useCharacters = (): { data: Character[] | undefined, isLoading: boolean, isError: boolean, isFetched: boolean } => {
    const { data, isLoading, isError, isFetched } = useQuery({
        queryKey: ['characters'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/characters`);
            return response.json();
        },
        staleTime: 10000,
    });

    console.log("fetched characters: ", data, isLoading, isError);

    return { data, isLoading, isError, isFetched };
}

export const useCharacterTrades = (characterId: number): { data: TradeActivity[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'trades'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/trades/character/${characterId}`);
            return response.json();
        },
        staleTime: 10000,
    });

    return { data, isLoading, isError };
}
export const useCharacterPerformance = (characterId: number, start:number): { data: number | undefined, isLoading: boolean, isError: boolean } => {
    const { data: dataReturned, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'performance', start],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/trades/character/${characterId}/performance/after/${parseInt(start.toString())}`);
            return response.json()
        },
        staleTime: 10000, // Data is fresh for 10 seconds
        refetchOnWindowFocus: false, // Disable refetch on window focus
        refetchOnReconnect: false, // Disable refetch on network reconnect
    });

    const performance  = dataReturned?.pricePerformance ?? 0;

    console.log("character performance: ", performance, isLoading, isError)

    return { data: performance, isLoading, isError };
}

export const useAllCharacterPerformance = (characterIds: number[], start: number) => {
    const queries = characterIds.map(characterId => ({
        queryKey: ['character', characterId, 'performance', start],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/trades/character/${characterId}/performance/after/${parseInt(start.toString())}`);
            return response.json();
        },
        staleTime: 10000, // Data is fresh for 10 seconds
        refetchOnWindowFocus: false, // Disable refetch on window focus
        refetchOnReconnect: false, // Disable refetch on network reconnect
    }));

    const results = useQueries({ queries });

    return results?.map(result => {
        console.log("result: ", result)
        return {
            data: result.data?.pricePerformance ?? 0,
            isLoading: result.isLoading,
            isError: result.isError,
            characterId: result?.data?.characterId
        };
    });
};

export const useBattleState = (): { data: CurrentBattleState | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['battleState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/battle`);
            return response.json();
        },
        refetchInterval: 5000,
    });

    console.log("battleState: ", data)
    return { data, isLoading, isError };
}

export const useCharacterMatches = (characterId: number): { data: MatchEndActivity[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'matches'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/matches/character/${characterId}`);
            return response.json();
        },
        staleTime: 10000,
    });
    //order by timestamp
    //and only
    const sortedData = data?.sort((a, b) => b.timestamp - a.timestamp);
    return { data: sortedData, isLoading, isError };
}

export const useCharacterHolders = (characterId: number): { data: User[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'holders'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/users/character/${characterId}`);
            return response.json();
        },
        staleTime: 10000,
    });

    return { data, isLoading, isError };
}

export const useCharacterStakes = (characterId: number): { data: StakeActivity[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'stakes'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/stakes/character/${characterId}`);
            return response.json();
        },
        staleTime: 10000,
    });

    return { data, isLoading, isError };
}

export const useUser = (address: string): { data: User | undefined, isLoading: boolean, isError: boolean, isPending: boolean } => {
    const { data, isLoading, isError, isPending } = useQuery({
        queryKey: ['user', address],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/users/${address}`);
            return response.json();
        },
        staleTime: 10000,
    });

    // Define dummy data if user is undefined
    const defaultUser: User = {
        address,
        balances: [], // Assuming no balances for dummy data
        stakes: [], // Assuming no stakes for dummy data
        stakeUnlockTime: 0
    };
    console.log("useUser data", data)
    return { data: data || defaultUser, isLoading, isError, isPending };
}

export const useUsers = (): { data: User[] | undefined, isLoading: boolean, isError: boolean, isPending: boolean } => {
    const { data, isLoading, isError, isPending } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/users/`);
            return response.json();
        },
        staleTime: 10000,
    });

    return { data, isLoading, isError, isPending };
}
// export const useEthPrice = (): { data: number | undefined, isLoading: boolean, isError: boolean } => {
//     const { data, isLoading, isError } = useQuery({
//         queryKey: ['ethPrice'],
//         queryFn: async () => {
//             const response = await fetch(`${apiUrl}/ethPrice`);
//             return response.json();
//         },
//         staleTime: 10000,
//     });

//     return { data, isLoading, isError };
// }

export const useConvertEthToUsdApi = (): (eth:number) => number => {
    const price = useEthPrice();
    return useCallback((eth: number) => {
        return eth * price;
    }, [price]);
}


export const useTokenActivities = (
    characterIds: number[]
): { 
    data: (TradeActivity | MatchEndActivity)[][] | undefined, 
    isLoading: boolean, 
    isError: boolean 
} => {
    const tradesResults = useQueries({
        queries: characterIds.map(characterId => ({
            queryKey: ['character', characterId, 'trades'],
            queryFn: async () => {
                const response = await fetch(`${apiUrl}/trades/character/${characterId}`);
                return response.json();
            },
            staleTime: 10000,
        }))
    });

    const matchesResults = useQueries({
        queries: characterIds.map(characterId => ({
            queryKey: ['character', characterId, 'matches'],
            queryFn: async () => {
                const response = await fetch(`${apiUrl}/matches/character/${characterId}`);
                return response.json();
            },
            staleTime: 10000,
        }))
    });

    console.log("valuespent tradesResults", tradesResults)
    console.log("valuespent matchesResults", matchesResults)

    const combinedActivities = useMemo(() => {
        return characterIds.map((characterId, index) => {
            if (tradesResults[index].isLoading || matchesResults[index].isLoading) {
                return [];
            }
            if (tradesResults[index].isError || matchesResults[index].isError) {
                return [];
            }
            
            const trades = tradesResults[index].data || [];
            const matches = matchesResults[index].data || [];

            console.log("valuespent trades", trades)
            console.log("valuespent matches", matches)

            // Combine both activities
            const allActivities = [
                ...trades.map((trade: TradeActivity) => ({
                    ...trade,
                    timestamp: trade.timestamp, // Ensure timestamp is available
                    type: 'trade' // Add a type for easier identification
                })),
                ...matches.map((match: MatchEndActivity) => ({
                    ...match,
                    timestamp: match.timestamp, // Ensure timestamp is available
                })),
            ];

            console.log("valuespent allActivities", allActivities)

            // Sort by timestamp
            return allActivities.sort((a, b) => a.timestamp - b.timestamp);
        });
    }, [tradesResults, matchesResults, characterIds]);

    const isLoading = tradesResults.some(result => result.isLoading) || matchesResults.some(result => result.isLoading);
    const isError = tradesResults.some(result => result.isError) || matchesResults.some(result => result.isError);

    console.log("valuespent combinedActivities", combinedActivities)
    return { data: combinedActivities, isLoading, isError };
}


//Fetch activites only once, on window load
export const initActivities = async (count: number): Promise<Activity[]>  => {
    const response = await fetch(`${apiUrl}/activities/${count}`);
    const data = await response.json();
    const activities = data?.activities || [];
    console.log("initActivities activities", activities)
    return activities;
}

export const useValueSpent = (
    userAddress: string,
    characterIds: number[],
): { 
    data: {
        characterId: number, 
        spent: number,
        fee: number,
    }[] | undefined, 
    isLoading: boolean, 
    isError: boolean 
} => {
    const { data: tokenActivities, isLoading, isError } = useTokenActivities(characterIds);
    const { data: user, isLoading: isUserLoading, isError: isUserError } = useUser(userAddress);
    const pnlDataArray = useMemo(() => {
        let pnlData = [];
        let index = 0;
        for (const characterId of characterIds) {
            //All the trades and matches for a character
            console.log("valuespent characterId", characterId)
            const characterActivities = tokenActivities?.[index] || [];
            //The balance of the user for a given character
            const characterUserBalance = user?.balances?.find(balance => balance.character === characterId)?.balance
            + (user?.stakes?.find(stake => stake.character === characterId)?.balance ?? 0);
            console.log("valuespent characterUserBalance", characterUserBalance)
            console.log("valuespent characterActivities", characterActivities)
            const pnl = calculateValueSpent(
                userAddress,
                characterActivities, 
                characterUserBalance,
                characterId
            );
            pnlData.push({
                characterId,
                spent: pnl.valueSpent,
                fee: pnl.fee,
            });
            index++;
        }
        return pnlData;
    }, [tokenActivities, user, isLoading, isError]);

    return { data: pnlDataArray, isLoading, isError };
}

//2% fee
export const FEE_PERCENTAGE = 0.02;

export const calculateValueSpent = (
    userAddress: string,
    characterActivities: (TradeActivity | MatchEndActivity)[], 
    characterUserBalance: number,
    characterId: number
): {valueSpent: number, fee: number} => {
    let totalValueSpent = 0;
    if (characterUserBalance === 0) {
        return {valueSpent: 0, fee: 0};
    }
    console.log("valuespent characterActivities", characterActivities)
    for (const activity of characterActivities as any) {
        console.log("valuespent activity", activity)
        if (
            activity.type === ("trade" as any) && 
            activity.character === characterId && 
            activity.trader.toLowerCase() === userAddress.toLowerCase()
        ) {
            const isBuy = activity.isBuy;
            const ethAmount = activity.ethAmount;
            if (isBuy) {
                totalValueSpent += ethAmount;
            } else {
                totalValueSpent -= ethAmount;
            }
        }
    }
    const fee = totalValueSpent * FEE_PERCENTAGE;
    const valueSpent = totalValueSpent - fee;
    return {valueSpent: valueSpent, fee: fee};
}

export const calculatePnL = (
    valueSpent: number,
    currentValue: number,
): {
    percentageChange: number,
    absoluteChange: number,
} => {
    const percentageChange = ((currentValue - valueSpent) / valueSpent);
    const absoluteChange = currentValue - valueSpent;
    return {
        percentageChange,
        absoluteChange,
    };
}