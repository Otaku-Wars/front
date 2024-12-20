import { useQueries, useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiUrl } from "../main";
import { Balance, Character, CurrentBattleState, PortfolioEntry, User } from "@memeclashtv/types";
import { Activity, ActivityType, MatchEndActivity, StakeActivity, TradeActivity } from "@memeclashtv/types/activity";
import { useEthPrice } from "../EthPriceProvider";
import { useCallback, useMemo, useState, useEffect } from "react";
import { getSellPriceMc } from "../utils";

interface PowerUpParams {
  characterId: number
  attribute: number // 2 for attack, 3 for defense
  pointsToSpend: number
}

export const getTrade = async (characterId: number): Promise<TradeActivity | undefined> => {
    const response = await fetch(`${apiUrl}/trades/character/${characterId}`);
    return response.json();
}

export const getMatch = async (characterId: number): Promise<MatchEndActivity | undefined> => {
    const response = await fetch(`${apiUrl}/matches/character/${characterId}`);
    return response.json();
}

export const useTrade = (timestamp: number): { data: TradeActivity | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['trades', timestamp],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/trades/${timestamp}`);
            return response.json();
        },
        staleTime: Infinity,
    });
    return { data, isLoading, isError };
}

export const useMatch = (timestamp: number): { data: MatchEndActivity | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['matches', timestamp],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/matches/${timestamp}`);
            return response.json();
        },
        staleTime: Infinity,
    });
    return { data, isLoading, isError };
}

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
export const useCharacterPerformance = (characterId: number, start:number) => {
    const { data: dataReturned, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'performance', start],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/trades/character/${characterId}/performance/after/${parseInt(start.toString())}`);
            return response.json()
        },
        staleTime: 10000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
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

export const useBattleState = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['battleState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/battle`);
            return response.json();
        },
        refetchInterval: 10000,
        staleTime: 5000,
        refetchOnWindowFocus: false,
        refetchOnMount: false
    });

    console.log("battleState: ", data)
    return { data, isLoading, isError };
}

export const useMatches = (): { data: MatchEndActivity[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['matches'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/matches`);
            return response.json();
        },
        staleTime: 10000,
    });
    const sortedData = data?.sort((a, b) => b.timestamp - a.timestamp);
    return { data: sortedData, isLoading, isError };
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
        stakeUnlockTime: 0,
        pnl: {
            costBasis: 0,
            fees: 0,
        }
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

export const usePortfolio = (userAddress: string): { data: PortfolioEntry[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['portfolio', userAddress],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/users/${userAddress}/portfolio`);
            return response.json();
        },
        staleTime: 10000,
    });

    return { data, isLoading, isError };
}

export const usePortfolioAfterTime = (userAddress: string, timestamp: number): { data: PortfolioEntry[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['portfolio', userAddress, timestamp],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/users/${userAddress}/portfolio/after/${timestamp}`);
            return response.json();
        },
        staleTime: 10000,
    });

    return { data, isLoading, isError };
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

export const useAllTokenActivities = (
): { 
    data: (TradeActivity | MatchEndActivity)[] | undefined, 
    isLoading: boolean, 
    isError: boolean 
} => {
    const { data: characters, isLoading: isCharactersLoading, isError: isCharactersError } = useCharacters();
    const characterIds = characters?.map(c => c.id) || [];
    const { data: tokenActivities, isLoading: isTokenActivitiesLoading, isError: isTokenActivitiesError } = useTokenActivities(characterIds);
    const flattenedActivities = useMemo(() => {
        let _activities = tokenActivities?.flat() || [];
        _activities.sort((a, b) => b.timestamp - a.timestamp);
        return _activities;
    }, [tokenActivities]);

    return { data: flattenedActivities, isLoading: isTokenActivitiesLoading, isError: isTokenActivitiesError };
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
    }[] | undefined, 
    isLoading: boolean, 
    isError: boolean 
} => {
    const { data: tokenActivities, isLoading, isError } = useTokenActivities(characterIds);
    const { data: user, isLoading: isUserLoading, isError: isUserError } = useUser(userAddress);
    const [pnlDataArray, setPnlDataArray] = useState<{
        characterId: number, 
        spent: number,
    }[]>([]);
    
    useEffect(() => {
        const pnlDataArrayFunction = async () => {
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
            const pnl = await calculateValueSpent(
                userAddress,
                characterActivities, 
                characterUserBalance,
                characterId
            );
            console.log("valuespent pnl", {...pnl, characterId})
            pnlData.push({
                characterId,
                spent: pnl.valueSpent,
            });
            index++;
            }
            setPnlDataArray(pnlData);
        };
        if(tokenActivities && user && !isLoading && !isError) {
            pnlDataArrayFunction();
        }
    }, [tokenActivities, user, isLoading, isError]);

    return { data: pnlDataArray, isLoading, isError };
}

//2% fee
export const FEE_PERCENTAGE = 0.02;

export const calculateValueSpent = async (
    userAddress: string,
    characterActivities: (TradeActivity | MatchEndActivity)[], 
    characterUserBalance: number,
    characterId: number
): Promise<{
    valueSpent: number, 
    fee: number,
}> => {
    let shareAmount = 0;
    let totalValueSpent = 0;
    let totalFees = 0;
    let supplyOfLastBuy = 0;
    let marketCapOfLastBuy = 0;
    if (characterUserBalance === 0) {
        return {valueSpent: 0, fee: 0};
    }
    console.log("valuespent characterActivities", characterActivities)
    for (const activity of characterActivities as any) {
        if(shareAmount > characterUserBalance) {
            break;
        }
        console.log("valuespent activity", activity)
        if (
            activity.type === ("trade" as any) && 
            activity.character === characterId && 
            activity.trader.toLowerCase() === userAddress.toLowerCase()
        ) {
            const trade = activity as TradeActivity;
            const isBuy = trade.isBuy;
            const ethAmount = trade.ethAmount;
            const fee = trade.protocolEthAmount;
            console.log("valuespent trade", ethAmount, fee)
            if (isBuy) {
                totalValueSpent += ethAmount;
                shareAmount += trade.shareAmount;
                //totalFees += fee;
                supplyOfLastBuy = trade.newSupply;
                marketCapOfLastBuy = trade.newMarketCap;
            }
        }

        //
        if(shareAmount > characterUserBalance) {
            //If share amount is greater than characterUserBalance, now find the value of a sell of shareAmount - characterUserBalance
            const valueToRemove = await getSellPriceMc(supplyOfLastBuy, marketCapOfLastBuy, shareAmount - characterUserBalance);
            totalValueSpent -= valueToRemove;
            //break from loop
            break;
        }
    }
    return {valueSpent: totalValueSpent, fee: totalFees};
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

const queryClient = new QueryClient()

export const usePowerUp = (address: string) => {
  const mutation = useMutation({
    mutationFn: async ({ characterId, attribute, pointsToSpend }: PowerUpParams) => {
      const response = await fetch(`${apiUrl}/characters/${characterId}/power-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('privyToken')}`,
        },
        body: JSON.stringify({
          user: address,
          attribute,
          pointsToSpend,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to power up character')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  return mutation
}
