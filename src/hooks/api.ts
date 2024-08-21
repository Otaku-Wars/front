import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../main";
import { Character } from "@memeclashtv/types";
import { TradeActivity } from "@memeclashtv/types/activity";


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