import { useQueries, useQuery } from "@tanstack/react-query";
import { apiUrl } from "../main";
import { Character, CurrentBattleState, User } from "@memeclashtv/types";
import { MatchEndActivity, StakeActivity, TradeActivity } from "@memeclashtv/types/activity";
import { useEthPrice } from "../EthPriceProvider";
import { useCallback } from "react";


export const useCharacter = (characterId: number): { data: Character | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useCharacters();
    const character = data?.find(c => c.id === characterId);
    return { data:character, isLoading, isError };
}

export const useCharacters = (): { data: Character[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['characters'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/characters`);
            return response.json();
        },
        staleTime: 10000,
    });

    console.log("fetched characters: ", data, isLoading, isError);

    return { data, isLoading, isError };
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

    return { data, isLoading, isError };
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
