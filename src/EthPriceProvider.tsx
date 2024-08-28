import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiUrl } from './main';

const EthPriceContext = createContext<number | undefined>(undefined);

export const EthPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [ethPrice, setEthPrice] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchEthPrice = async () => {
            try {
                const response = await fetch(`${apiUrl}/price/eth`);
                const data = await response.json();
                setEthPrice(data?.ethPrice);
                console.log("ethPrice: ", data?.ethPrice);
            } catch (error) {
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEthPrice();
        const interval = setInterval(fetchEthPrice, 10000); // Refetch every 10 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <EthPriceContext.Provider value={ethPrice}>
            {isLoading ? <div>Loading...</div> : isError ? <div>Error fetching ETH price</div> : children}
        </EthPriceContext.Provider>
    );
};

export const useEthPrice = () => {
    const context = useContext(EthPriceContext);
    if (context === undefined) {
        throw new Error('useEthPrice must be used within an EthPriceProvider');
    }
    console.log("ethPrice context: ", context)
    return context;
};