import React, { useRef, useEffect, useState } from "react";
import styles from "../../styles/AudioTourCard.module.css";

const AudioTourCard = ({
  item,
  isActive,
  isTourPlaying,
  onPlay,
  onAudioRef,
}) => {
  const audioRef = useRef(null);
  const [showDescription, setShowDescription] = useState(false);
  const [hoverPlay, setHoverPlay] = useState(false);

  const isVideo =
    item.visuals &&
    item.visuals.mime_type &&
    item.visuals.mime_type.startsWith("video");

  useEffect(() => {
    if (audioRef.current && item.audio) onAudioRef(item.id, audioRef.current);
  }, [audioRef, item.id, onAudioRef, item.audio]);

  useEffect(() => {
    if (isVideo && item.visuals) {
      const videoEl = document.getElementById(`video-${item.id}`);
      if (videoEl) {
        if (isActive && isTourPlaying) {
          videoEl.loop = true;
          videoEl.play().catch(() => {});
        } else if (hoverPlay) {
          videoEl.loop = false;
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
          videoEl.currentTime = 0;
          videoEl.loop = false;
        }
      }
    }
  }, [isActive, isTourPlaying, isVideo, item.visuals, item.id, hoverPlay]);

  useEffect(() => {
    if (!isVideo || !item.visuals) return;
    const videoEl = document.getElementById(`video-${item.id}`);
    if (!videoEl) return;
    const handleEnded = () => {
      if (hoverPlay) {
        setHoverPlay(false);
        videoEl.currentTime = 0;
      }
    };
    videoEl.addEventListener("ended", handleEnded);
    return () => {
      videoEl.removeEventListener("ended", handleEnded);
    };
  }, [isVideo, item.visuals, item.id, hoverPlay]);

  const handleVideoMouseEnter = () => {
    if (!(isActive && isTourPlaying)) {
      setHoverPlay(true);
    }
  };

  const handleButtonClick = () => {
    if (!item.audio) return;
    onPlay(item.id);
  };

  // Button logic
  let buttonText = "Afspelen";
  let buttonDisabled = !item.audio;
  if (isActive && isTourPlaying) {
    buttonText = "Speelt af";
    buttonDisabled = true;
  } else if (isActive) {
    buttonText = "Pauzeer";
    buttonDisabled = false;
  }

  return (
    <div
      className={`${styles.card} ${isActive ? styles.activeCard : ""}`}
      tabIndex={isActive ? 0 : -1}
      aria-live={isActive ? "polite" : undefined}
      style={{
        resize: "horizontal",
        overflow: "hidden",
        minWidth: 220,
        maxWidth: 600,
        display: "inline-block",
        verticalAlign: "top",
      }}
    >
      {/* Visuals: image or video */}
      {item.visuals && isVideo ? (
        <video
          id={`video-${item.id}`}
          className={styles.cardImg}
          src={item.visuals.url}
          width="100%"
          height="140"
          muted
          playsInline
          preload="metadata"
          onMouseEnter={handleVideoMouseEnter}
        />
      ) : item.visuals && item.visuals.url ? (
        <img
          className={styles.cardImg}
          src={item.visuals.url}
          alt={`Afbeelding van ${item.name}`}
        />
      ) : null}
      {item.functie && <p className={styles.cardFunctie}>{item.functie}</p>}
      <p className={styles.cardName}>{item.name}</p>

      {isTourPlaying && isActive && (
        <div className={styles.nowPlaying}>Nu aan het spelen (tour)</div>
      )}

      {item.beschrijving && (
        <>
          <button
            className={styles.toggleBeschrijvingBtn}
            onClick={() => setShowDescription((v) => !v)}
            type="button"
            aria-expanded={showDescription}
          >
            {showDescription ? "Verberg beschrijving" : "Toon beschrijving"}
          </button>
          {showDescription && (
            <div className={styles.cardBeschrijving}>{item.beschrijving}</div>
          )}
        </>
      )}

      <button
        onClick={handleButtonClick}
        disabled={buttonDisabled}
        className={`${styles.cardButton} ${
          isActive ? styles.cardButtonActive : ""
        } ${!item.audio ? styles.unavailableBtn : ""}`}
      >
        {item.audio ? buttonText : "Niet beschikbaar"}
      </button>
      {item.audio && (
        <audio
          className={styles.cardAudio}
          ref={audioRef}
          src={item.audio}
          preload="auto"
        />
      )}
    </div>
  );
};

export default AudioTourCard;
