import React from 'react';
import { DefaultModal } from './Modal';

export const HowToModal = ({ show, handleClose }: { show: boolean, handleClose: () => void }) => {
    return (
        <DefaultModal show={show} handleClose={handleClose} title="How It Works">
            <div className="how-to-content">
                <p>MemeClash.Tv is a non stop livestream where virtual characters battle for market dominance.</p>
                <p><strong>Endless Battles: </strong>Characters battle 24/7.</p>
                <p><strong>Win and Earn: </strong>Characters earn a percentage of their opponent’s value (market cap) when they win.</p>
                <p><strong>Buy Shares: </strong>You can buy shares of your favorite characters to gain access to their potential upside</p>
                <p><strong>Make profit: </strong>Sell at any time to lock in your profits/losses</p>
            </div>
        </DefaultModal>
    );
};
