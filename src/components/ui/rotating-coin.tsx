import { cn } from "../../lib/utils"

export function RotatingCoin({ className }: { className?: string }) {
  return (
    <div className={cn("coin-wrapper", className)}>
      <div className="coin-container">
        <div className="sparkles">
          <div className="sparkle s1">✦</div>
          <div className="sparkle s2">✦</div>
          <div className="sparkle s3">✦</div>
          <div className="sparkle s4">✦</div>
        </div>
        <div className="coin">
          <div className="front">
            <div className="shimmer"></div>
            <div className="dollar">$</div>
          </div>
          <div className="back">
            <div className="shimmer"></div>
          </div>
        </div>
      </div>
      <style>
        {`
        .coin-wrapper {
          width: 64px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .coin-container {
          perspective: 1000px;
          width: 64px;
          height: 64px;
          position: relative;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        
        .sparkles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .sparkle {
          position: absolute;
          color: #ffd700;
          font-size: 12px;
          opacity: 0;
          text-shadow: 0 0 4px rgba(255, 215, 0, 0.8);
        }

        .s1 {
          top: -5px;
          left: 50%;
          animation: sparkle 2s ease-in-out infinite;
        }

        .s2 {
          top: 50%;
          right: -5px;
          animation: sparkle 2s ease-in-out infinite 0.5s;
        }

        .s3 {
          bottom: -5px;
          left: 50%;
          animation: sparkle 2s ease-in-out infinite 1s;
        }

        .s4 {
          top: 50%;
          left: -5px;
          animation: sparkle 2s ease-in-out infinite 1.5s;
        }

        @keyframes sparkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0.5);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        .coin {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: rotate 3s linear infinite;
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.3));
        }
        
        .front, .back {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .front {
          background: radial-gradient(circle at 30% 30%, #ffd700 0%, #ffc200 30%, #e6b800 60%, #d4a700 100%);
          border: 2px solid #cc9900;
          box-shadow: inset -2px -2px 4px rgba(0,0,0,0.2),
                     inset 2px 2px 4px rgba(255,255,255,0.3);
          animation: glow 3s ease-in-out infinite;
        }
        
        .back {
          transform: rotateY(180deg);
          background: radial-gradient(circle at 30% 30%, #ffd700 0%, #ffc200 30%, #e6b800 60%, #d4a700 100%);
          border: 2px solid #cc9900;
          box-shadow: inset -2px -2px 4px rgba(0,0,0,0.2),
                     inset 2px 2px 4px rgba(255,255,255,0.3);
          animation: glow 3s ease-in-out infinite;
        }

        .shimmer {
          position: absolute;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background: linear-gradient(
            45deg,
            transparent 0%,
            rgba(255, 255, 255, 0) 35%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 65%,
            transparent 100%
          );
          animation: shimmer 3s infinite;
          pointer-events: none;
        }
        
        .dollar {
          font-size: 2rem;
          font-weight: bold;
          color: #b38600;
          text-shadow: 1px 1px 1px rgba(255,255,255,0.5),
                     -1px -1px 1px rgba(0,0,0,0.2);
          position: relative;
          z-index: 1;
        }

        @keyframes shimmer {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes glow {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
        }
        
        @keyframes rotate {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        @media (prefers-reduced-motion) {
          .coin-container {
            animation: none;
          }
          .coin {
            animation: none;
            filter: none;
          }
          .sparkle {
            animation: none !important;
            opacity: 0;
          }
          .shimmer {
            display: none;
          }
          .front, .back {
            animation: none;
          }
        }
        `}
      </style>
    </div>
  )
} 


//Recreate in full but smaller
export function SmallRotatingCoin({ className }: { className?: string }) {
  return (
    <div className={cn("small-coin-wrapper", className)}>
      <div className="small-coin-container">
        <div className="small-sparkles">
          <div className="small-sparkle s1">✦</div>
          <div className="small-sparkle s2">✦</div>
          <div className="small-sparkle s3">✦</div>
          <div className="small-sparkle s4">✦</div>
        </div>
        <div className="small-coin">
          <div className="small-front">
            <div className="small-shimmer"></div>
            <div className="small-dollar">$</div>
          </div>
          <div className="small-back">
            <div className="small-shimmer"></div>
          </div>
        </div>
      </div>
      <style>
        {`
        .small-coin-wrapper {
          width: 32px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .small-coin-container {
          perspective: 500px;
          width: 32px;
          height: 32px;
          position: relative;
          animation: small-float 3s ease-in-out infinite;
        }

        @keyframes small-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        .small-sparkles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .small-sparkle {
          position: absolute;
          color: #ffd700;
          font-size: 8px;
          opacity: 0;
          text-shadow: 0 0 2px rgba(255, 215, 0, 0.8);
        }

        .small-sparkle.s1 {
          top: -3px;
          left: 50%;
          animation: small-sparkle 2s ease-in-out infinite;
        }

        .small-sparkle.s2 {
          top: 50%;
          right: -3px;
          animation: small-sparkle 2s ease-in-out infinite 0.5s;
        }

        .small-sparkle.s3 {
          bottom: -3px;
          left: 50%;
          animation: small-sparkle 2s ease-in-out infinite 1s;
        }

        .small-sparkle.s4 {
          top: 50%;
          left: -3px;
          animation: small-sparkle 2s ease-in-out infinite 1.5s;
        }

        @keyframes small-sparkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0.5);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        .small-coin {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: small-rotate 3s linear infinite;
          filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.3));
        }
        
        .small-front, .small-back {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .small-front {
          background: radial-gradient(circle at 30% 30%, #ffd700 0%, #ffc200 30%, #e6b800 60%, #d4a700 100%);
          border: 1px solid #cc9900;
          box-shadow: inset -1px -1px 2px rgba(0,0,0,0.2),
                     inset 1px 1px 2px rgba(255,255,255,0.3);
          animation: small-glow 3s ease-in-out infinite;
        }
        
        .small-back {
          transform: rotateY(180deg);
          background: radial-gradient(circle at 30% 30%, #ffd700 0%, #ffc200 30%, #e6b800 60%, #d4a700 100%);
          border: 1px solid #cc9900;
          box-shadow: inset -1px -1px 2px rgba(0,0,0,0.2),
                     inset 1px 1px 2px rgba(255,255,255,0.3);
          animation: small-glow 3s ease-in-out infinite;
        }
        
        .small-shimmer {
          position: absolute;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background: linear-gradient(
            45deg,
            transparent 0%,
            rgba(255, 255, 255, 0) 35%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 65%,
            transparent 100%
          );
          animation: small-shimmer 3s infinite;
          pointer-events: none;
        }
        
        .small-dollar {
          font-size: 1rem;
          font-weight: bold;
          color: #b38600;
          text-shadow: 0.5px 0.5px 0.5px rgba(255,255,255,0.5),
                     -0.5px -0.5px 0.5px rgba(0,0,0,0.2);
          position: relative;
          z-index: 1;
        }

        @keyframes small-shimmer {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes small-glow {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
        }
        
        @keyframes small-rotate {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        @media (prefers-reduced-motion) {
          .small-coin-container {
            animation: none;
          }
          .small-coin {
            animation: none;
            filter: none;
          }
          .small-sparkle {
            animation: none !important;
            opacity: 0;
          }
          .small-shimmer {
            display: none;
          }
          .small-front, .small-back {
            animation: none;
          }
        }
        `}
      </style>
    </div>
  )
}