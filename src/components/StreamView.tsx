import React from 'react';
import { useMediaQuery } from '../hooks/use-media-query';

const CHANNEL_NAME = 'memeclashtv';
const PARENT_DOMAIN = window.location.hostname;

export const StreamEmbed = React.memo(() => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTelegramWebView = (
        typeof window !== "undefined" &&
        typeof window.Telegram !== "undefined" &&
        navigator?.userAgent?.includes("Telegram")
    );

    // Calculate dimensions based on mobile/desktop
    const dimensions = isMobile ? {
        width: '100%',
        height: '100%',
        aspectRatio: '16/9'
    } : {
        width: '100%',
        height: '100%'
    };

    return (
        <div className="relative w-full h-full" style={dimensions}>
            <iframe
                src={`https://player.twitch.tv/?channel=${CHANNEL_NAME}&parent=${PARENT_DOMAIN}`}
                frameBorder="0"
                allowFullScreen
                scrolling="no"
                className="absolute top-0 left-0 w-full h-full"
                allow="autoplay; fullscreen"
                {...(!isTelegramWebView && {
                    sandbox: "allow-scripts allow-same-origin allow-presentation"
                })}
            />
        </div>
    );
});

StreamEmbed.displayName = 'StreamEmbed';

export default () => {
    return (
        <div className="h-full w-full border border-gray-700">
            <StreamEmbed />
        </div>
    );
}