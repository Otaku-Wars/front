import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../main";
import { Character, CurrentBattleState, User } from "@memeclashtv/types";
import { MatchEndActivity, StakeActivity, TradeActivity } from "@memeclashtv/types/activity";


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
        refetchInterval: 1000,
    });

    return { data, isLoading, isError };
}

export const useCharacterTrades = (characterId: number): { data: TradeActivity[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'trades'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/trades/character/${characterId}`);
            return response.json();
        },
        refetchInterval: 1000,
    });

    return { data, isLoading, isError };
}

export const useCharacterPerformance = (characterId: number, start:number): { data: number | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'performance', start],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/character/${characterId}/performance/after/${start}`);
            return response.json();
        },
        refetchInterval: 1000,
    });

    return { data, isLoading, isError };
}


export const useBattleState = (): { data: CurrentBattleState | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['battleState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/battle`);
            return response.json();
        },
        refetchInterval: 1000,
    });

    return { data, isLoading, isError };
}

export const useCharacterMatches = (characterId: number): { data: MatchEndActivity[] | undefined, isLoading: boolean, isError: boolean } => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['character', characterId, 'matches'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/matches/character/${characterId}`);
            return response.json();
        },
        refetchInterval: 1000,
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
        refetchInterval: 1000,
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
        refetchInterval: 1000,
    });

    return { data, isLoading, isError };
}
