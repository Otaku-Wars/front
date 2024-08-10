import React from 'react';
import { DefaultModal } from './Modal';

export const HowToModal = ({ show, handleClose }: { show: boolean, handleClose: () => void }) => {
    return (
        <DefaultModal show={show} handleClose={handleClose} title="How It Works">
            <div className="howto-content">
                <p>MemeClash.TV is a non-stop livestream of characters fighting in a simulated world.</p>
                <p>Endless Battles: Matches happen 24/7 with auto matchmaking.</p>
                <p>Win and Earn: Characters earn a percentage of the opponent’s liquidity when they win.</p>
                <p>Trade Shares: You can buy and sell shares of your favorite character.</p>
                <p>Market Impact: Characters become stronger as their market cap increases.</p>
            </div>
        </DefaultModal>
    );
};
