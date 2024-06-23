'use client'
import { useRef, useState } from 'react';

interface CustomVideoProps {
  width: number;
  height: number;
  children: {
    props: {
      src: string
    }
  };
}

export function CustomVideo({ width, height, children, ...props }: CustomVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const { src } = children?.props;

  const handlePlay = () => {
    if (!videoRef.current) return
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (!videoRef.current) return
    setIsPlaying(false);
  };

  return (
    <div className="relative w-full h-auto">
      <video
        ref={videoRef}
        width={width}
        height={height}
        loop
        playsInline
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="rounded-xl w-full h-auto"
        onClick={isPlaying ? handlePause : handlePlay}
        {...props}
      >
        <source src={src} type="video/mp4" />
      </video>
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handlePlay}
        >
          <div className="bg-black bg-opacity-50 rounded-full p-6 hover:bg-opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
