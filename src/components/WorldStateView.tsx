import { useQuery } from "@tanstack/react-query"
import { apiUrl } from "../main"

export const WorldStateView = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['worldState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/world`)
            return response.json()
        },
        refetchInterval: 1000,
    })

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (isError) {
        return <div>Error</div>
    }

    return (
        <div>
            <h1>World State</h1>
            <p>Mathces length: {data?.matches?.length}</p>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    )
}