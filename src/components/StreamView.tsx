import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import { Src } from "@livepeer/react";
import { Livepeer } from "livepeer";
import { LoadingIcon, MuteIcon, PauseIcon, PlayIcon, SettingsIcon, UnmuteIcon } from "@livepeer/react/assets";
import { useEffect, useState, useRef, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import { PropsWithChildren, forwardRef, CSSProperties } from "react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import React from "react";
import { useMediaQuery } from '../hooks/use-media-query';
import Hls from 'hls.js';

const livepeer = new Livepeer({
  apiKey: "7ac51e94-e027-4664-b624-821673c7305c",
});

const playbackId = "6950nisrggh4cvk1";

// fetch the playback info on the server, using React Server Components
// or regular API routes
export const getPlaybackSource = async (playbackId: string): Promise<Src[] | null> => {
  const playbackInfo = await livepeer.playback.get(playbackId);

  const src = getSrc(playbackInfo.playbackInfo);
    console.log(src);
  return src;
};

// Custom hook for HLS setup
const useHlsStream = (playbackId: string | null, videoRef: React.RefObject<HTMLVideoElement>) => {
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const setupStream = async () => {
            if (!playbackId || !videoRef.current) return;

            try {
                const playbackInfo = await livepeer.playback.get(playbackId);
                const sources = playbackInfo.playbackInfo.meta.source;
                const hlsSource = sources.find(s => s.type === "html5/application/vnd.apple.mpegurl");
                
                if (!hlsSource) {
                    console.error("No HLS source found");
                    return;
                }

                if (Hls.isSupported()) {
                    if (hlsRef.current) {
                        hlsRef.current.destroy();
                    }

                    const hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: false,
                        backBufferLength: 90
                    });
                    
                    hls.loadSource(hlsSource.url);
                    hls.attachMedia(videoRef.current);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        videoRef.current?.play().catch(console.error);
                    });

                    hlsRef.current = hls;
                } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
                    videoRef.current.src = hlsSource.url;
                    videoRef.current.play().catch(console.error);
                }
            } catch (error) {
                console.error("Error setting up stream:", error);
            }
        };

        setupStream();

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [playbackId]); // Only re-run if playbackId changes
};

export const StreamEmbed = React.memo(() => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTelegramWebView = window.Telegram?.WebApp !== undefined;
    const videoRef = useRef<HTMLVideoElement>(null);

    // Memoize URL parsing to prevent re-renders
    const { playbackId, embedUrl } = useMemo(() => {
        const url = new URL(import.meta.env.VITE_EMBED_ID);
        return {
            playbackId: url.searchParams.get('v'),
            embedUrl: import.meta.env.VITE_EMBED_ID
        };
    }, []); // Empty deps since env var won't change

    // Use HLS hook for mobile
    useHlsStream(isMobile ? playbackId : null, videoRef);

    if (isMobile) {
        return (
            <video
                ref={videoRef}
                className="absolute top-0 left-0 h-full w-full"
                controls={false}
                playsInline
                autoPlay
                muted={false}
            />
        );
    }

    return (
        <iframe 
            src={embedUrl}
            allowFullScreen 
            allow="autoplay; encrypted-media; picture-in-picture" 
            className="h-full w-full"
            {...(!isTelegramWebView && {
                sandbox: "allow-scripts allow-same-origin allow-presentation"
            })}
        />
    );
});

StreamEmbed.displayName = 'StreamEmbed';

export const StreamPlayer = ({ src }: { src: Src[] | null }) => {
    return (
        <Player.Root 
            lowLatency={true}
            autoPlay={true}
            src={src}
        >
          <Player.Container
            style={{
              height: "100%",
              width: "100%",
              overflow: "hidden",
              backgroundColor: "black",
            }}
          >
            <Player.Video
              title="Live Stream"
              style={{
                height: "100%",
                width: "100%",
                objectFit: "contain",
              }}
            />
    
            <Player.LoadingIndicator asChild>
              <Loading />
            </Player.LoadingIndicator>
    
            <Player.ErrorIndicator matcher="all" asChild>
              <Loading />
            </Player.ErrorIndicator>
    
            <Player.Controls
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6))",
                padding: "0.5rem 1rem",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Player.PlayPauseTrigger
                  style={{
                    width: 25,
                    height: 25,
                  }}
                >
                  <Player.PlayingIndicator asChild matcher={false}>
                    <PlayIcon />
                  </Player.PlayingIndicator>
                  <Player.PlayingIndicator asChild>
                    <PauseIcon />
                  </Player.PlayingIndicator>
                </Player.PlayPauseTrigger>

                <Player.LiveIndicator
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <div
                    style={{
                      backgroundColor: "#ef4444",
                      height: 8,
                      width: 8,
                      borderRadius: 9999,
                    }}
                  />
                  <span style={{ fontSize: 12, userSelect: "none" }}>LIVE</span>
                </Player.LiveIndicator>

                <Player.MuteTrigger
                  style={{
                    width: 25,
                    height: 25,
                  }}
                >
                  <Player.VolumeIndicator asChild matcher={false}>
                    <MuteIcon />
                  </Player.VolumeIndicator>
                  <Player.VolumeIndicator asChild matcher={true}>
                    <UnmuteIcon />
                  </Player.VolumeIndicator>
                </Player.MuteTrigger>
                <Player.Volume
                  style={{
                    position: "relative",
                    display: "flex",
                    flexGrow: 1,
                    height: 25,
                    alignItems: "center",
                    maxWidth: 120,
                    touchAction: "none",
                    userSelect: "none",
                  }}
                >
                  <Player.Track
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      position: "relative",
                      flexGrow: 1,
                      borderRadius: 9999,
                      height: "2px",
                    }}
                  >
                    <Player.Range
                      style={{
                        position: "absolute",
                        backgroundColor: "white",
                        borderRadius: 9999,
                        height: "100%",
                      }}
                    />
                  </Player.Track>
                  <Player.Thumb
                    style={{
                      display: "block",
                      width: 12,
                      height: 12,
                      backgroundColor: "white",
                      borderRadius: 9999,
                    }}
                  />
                </Player.Volume>
              </div>
              <Settings />
            </Player.Controls>
          </Player.Container>
        </Player.Root>
    );
};

const Seek = forwardRef<HTMLButtonElement, Player.SeekProps>(
    ({ children, ...props }, forwardedRef) => (
      <Player.Seek ref={forwardedRef} {...props}>
        <Player.Track
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            position: "relative",
            flexGrow: 1,
            borderRadius: 9999,
            height: 2,
          }}
        >
          <Player.SeekBuffer
            style={{
              position: "absolute",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: 9999,
              height: "100%",
            }}
          />
          <Player.Range
            style={{
              position: "absolute",
              backgroundColor: "white",
              borderRadius: 9999,
              height: "100%",
            }}
          />
        </Player.Track>
        <Player.Thumb
          style={{
            display: "block",
            width: 12,
            height: 12,
            backgroundColor: "white",
            borderRadius: 9999,
          }}
        />
      </Player.Seek>
    ),
  );
  
  const Loading = forwardRef<HTMLDivElement, PropsWithChildren>(
    ({ children, ...props }, forwardedRef) => {
      return (
        <div
          {...props}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            backgroundColor: "black",
            backdropFilter: "blur(10px)",
            textAlign: "center",
          }}
          ref={forwardedRef}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <LoadingIcon
              style={{
                width: "32px",
                height: "32px",
                animation: "spin infinite 1s linear",
              }}
            />
          </div>
        </div>
      );
    },
  );
  
  const Settings = React.forwardRef(
    (
      { style }: { style?: CSSProperties },
      ref: React.Ref<HTMLButtonElement> | undefined,
    ) => {
      return (
        <Popover.Root>
          <Popover.Trigger ref={ref} asChild>
            <button
              type="button"
              style={style}
              aria-label="Playback settings"
              onClick={(e) => e.stopPropagation()}
            >
              <SettingsIcon
                style={{
                  width: 25,
                  height: 25,
                }}
              />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              style={{
                width: 250,
                borderRadius: 5,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(12px)",
                padding: 10,
              }}
              side="top"
              alignOffset={-70}
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                  }}
                >
                  Settings
                </p>
                <Player.LiveIndicator
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                  matcher={false}
                >
                  <label
                    style={{
                      fontSize: 12,
                    }}
                    htmlFor="qualitySelect"
                  >
                    Quality
                  </label>
                  <Player.RateSelect name="rateSelect">
                    <Player.SelectTrigger
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        height: 30,
                        minWidth: 120,
                        fontSize: 12,
                        gap: 5,
                        padding: 10,
                        borderRadius: 5,
                        outline: "white solid 1px",
                      }}
                      aria-label="Playback speed"
                    >
                      <Player.SelectValue placeholder="Select a speed..." />
                      <Player.SelectIcon>
                        <ChevronDownIcon style={{ width: 14, height: 14 }} />
                      </Player.SelectIcon>
                    </Player.SelectTrigger>
                    <Player.SelectPortal>
                      <Player.SelectContent
                        style={{
                          borderRadius: 5,
                          backgroundColor: "black",
                        }}
                      >
                        <Player.SelectViewport style={{ padding: 5 }}>
                          <Player.SelectGroup>
                            <RateSelectItem value={0.5}>0.5x</RateSelectItem>
                            <RateSelectItem value={1}>1x</RateSelectItem>
                          </Player.SelectGroup>
                        </Player.SelectViewport>
                      </Player.SelectContent>
                    </Player.SelectPortal>
                  </Player.RateSelect>
                </Player.LiveIndicator>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                    }}
                    htmlFor="qualitySelect"
                  >
                    Quality
                  </label>
                  <Player.VideoQualitySelect name="qualitySelect">
                    <Player.SelectTrigger
                      style={{
                        minWidth: 120,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        height: 30,
                        fontSize: 12,
                        gap: 5,
                        padding: 10,
                        borderRadius: 5,
                        outline: "white solid 1px",
                      }}
                      aria-label="Playback quality"
                    >
                      <Player.SelectValue placeholder="Select a quality..." />
                      <Player.SelectIcon>
                        <ChevronDownIcon style={{ width: 14, height: 14 }} />
                      </Player.SelectIcon>
                    </Player.SelectTrigger>
                    <Player.SelectPortal>
                      <Player.SelectContent
                        style={{
                          borderRadius: 5,
                          backgroundColor: "black",
                        }}
                      >
                        <Player.SelectViewport style={{ padding: 5 }}>
                          <Player.SelectGroup>
                            <VideoQualitySelectItem value="auto">
                              Auto (HD+)
                            </VideoQualitySelectItem>
                            <VideoQualitySelectItem value="1080p">
                              1080p (HD)
                            </VideoQualitySelectItem>
                            <VideoQualitySelectItem value="360p">
                              360p
                            </VideoQualitySelectItem>
                          </Player.SelectGroup>
                        </Player.SelectViewport>
                      </Player.SelectContent>
                    </Player.SelectPortal>
                  </Player.VideoQualitySelect>
                </div>
              </div>
              <Popover.Close
                style={{
                  borderRadius: 9999,
                  height: 20,
                  width: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "absolute",
                  top: 5,
                  right: 5,
                }}
                aria-label="Close"
              >
                <XIcon />
              </Popover.Close>
              <Popover.Arrow
                style={{
                  fill: "white",
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      );
    },
  );
  
  const RateSelectItem = forwardRef<HTMLDivElement, Player.RateSelectItemProps>(
    ({ children, ...props }, forwardedRef) => {
      return (
        <Player.RateSelectItem
          style={{
            fontSize: 12,
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            paddingRight: 35,
            paddingLeft: 25,
            position: "relative",
            userSelect: "none",
            height: 30,
          }}
          {...props}
          ref={forwardedRef}
        >
          <Player.SelectItemText>{children}</Player.SelectItemText>
          <Player.SelectItemIndicator
            style={{
              position: "absolute",
              left: 0,
              width: 25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckIcon style={{ width: 14, height: 14 }} />
          </Player.SelectItemIndicator>
        </Player.RateSelectItem>
      );
    },
  );
  
  const VideoQualitySelectItem = forwardRef<
    HTMLDivElement,
    Player.VideoQualitySelectItemProps
  >(({ children, ...props }, forwardedRef) => {
    return (
      <Player.VideoQualitySelectItem
        style={{
          fontSize: 12,
          borderRadius: 5,
          display: "flex",
          alignItems: "center",
          paddingRight: 35,
          paddingLeft: 25,
          position: "relative",
          userSelect: "none",
          height: 30,
        }}
        {...props}
        ref={forwardedRef}
      >
        <Player.SelectItemText>{children}</Player.SelectItemText>
        <Player.SelectItemIndicator
          style={{
            position: "absolute",
            left: 0,
            width: 25,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckIcon style={{ width: 14, height: 14 }} />
        </Player.SelectItemIndicator>
      </Player.VideoQualitySelectItem>
    );
  });

export default () => {
    const [ src, setSrc ] = useState<Src[] | null>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    
    useEffect(() => {
        getPlaybackSource(playbackId).then(setSrc);
    }, []);

    if (!src) {
        return <div>Loading...</div>;
    }

    return (
      <div className="h-full w-full border border-gray-700">
        <StreamEmbed />
      </div>
    );
}