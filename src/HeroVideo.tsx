import { useEffect, useRef, useState } from 'react';

type Playback = 'loading' | 'playing' | 'paused' | 'ended' | 'fallback';

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completed = useRef(false);
  const [playback, setPlayback] = useState<Playback>('loading');
  const [stillReady, setStillReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const showStill = reducedMotion || playback === 'ended' || playback === 'fallback';

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (preference.matches && (videoRef.current?.currentTime ?? 0) > 0) {
        completed.current = true;
        setPlayback('ended');
      }
      setReducedMotion(preference.matches);
    };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
      return;
    }
    if (completed.current) return;
    let active = true;
    video.play().catch(() => {
      if (active && !completed.current) setPlayback('paused');
    });
    return () => { active = false; };
  }, [reducedMotion]);

  function finish() {
    completed.current = true;
    setPlayback('ended');
  }

  function useFallback() {
    completed.current = true;
    setPlayback('fallback');
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) video.pause();
    else {
      try { await video.play(); }
      catch { setPlayback('paused'); }
    }
  }

  return <>
    <div className={`hero-portrait${showStill && stillReady ? ' is-still' : ''}`} data-playback={reducedMotion ? 'reduced-motion' : playback} aria-hidden="true">
      <video
        ref={videoRef}
        src={reducedMotion ? undefined : './media/hero-smile.mp4'}
        poster={reducedMotion ? './images/hero-video-last.webp' : './images/hero-video-first.webp'}
        width="1600"
        height="900"
        muted
        playsInline
        preload={reducedMotion ? 'none' : 'auto'}
        onPlaying={() => { if (!completed.current) setPlayback('playing'); }}
        onPause={() => { if (!completed.current && !videoRef.current?.ended) setPlayback('paused'); }}
        onEnded={finish}
        onError={useFallback}
        tabIndex={-1}
      />
      <img className="hero-video-still" src="./images/hero-video-last.webp" width="1600" height="900" alt="" fetchPriority={showStill ? 'high' : 'low'} onLoad={() => setStillReady(true)}/>
    </div>
    {!showStill && playback !== 'loading' ? <button
      type="button"
      className="hero-video-toggle"
      aria-label={playback === 'playing' ? 'Призупинити відео' : 'Відтворити відео'}
      onClick={togglePlayback}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {playback === 'playing' ? <path d="M9 5v14M15 5v14"/> : <path d="m8 5 11 7-11 7V5Z"/>}
      </svg>
    </button> : null}
  </>;
}
