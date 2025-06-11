import React, { useEffect, useState, useRef } from "react";
import styles from "../styles/AudioTourList.module.css";
import AudioTourSection from "./pageElements/AudioTourSection";
import { fetchAudioTours } from "../utils/apiCalls";
import LoadingBar from "./pageElements/LoadingBar";

const SECTION_LABELS = {
  ons_verhaal: "Ons verhaal",
  over_het_kantoor: "Over het Kantoor",
  onze_filosofie: "Onze filosofie",
};
const SECTION_ORDER = ["ons_verhaal", "over_het_kantoor", "onze_filosofie"];

function AudioTourList() {
  const [tours, setTours] = useState([]);
  const [error, setError] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [tourPaused, setTourPaused] = useState(false);
  const [tourQueue, setTourQueue] = useState([]);
  const [tourStep, setTourStep] = useState(0);
  const audioRefs = useRef({});
  const cardRefs = useRef({});

  useEffect(() => {
    fetchAudioTours()
      .then(setTours)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (tours.length) {
      // Preload all audio files
      tours.forEach((tour) => {
        if (tour.acf?.audio?.url) {
          const audio = new window.Audio();
          audio.src = tour.acf.audio.url;
          audio.preload = "auto";
        }
      });
      // Preload all video files
      tours.forEach((tour) => {
        if (
          tour.acf?.visuals?.mime_type?.startsWith("video") &&
          tour.acf.visuals.url
        ) {
          const video = document.createElement("video");
          video.src = tour.acf.visuals.url;
          video.preload = "auto";
        }
      });
    }
  }, [tours]);

  // Group and sort items
  const grouped = {
    ons_verhaal: [],
    over_het_kantoor: [],
    onze_filosofie: [],
  };
  tours.forEach((tour) => {
    const sectie = tour.acf?.sectie;
    if (grouped[sectie]) {
      grouped[sectie].push({
        id: tour.id,
        name: tour.acf.naam || tour.title.rendered,
        visuals: tour.acf.visuals,
        audio: tour.acf.audio?.url,
        section: SECTION_LABELS[sectie],
        functie: tour.acf.functie,
        beschrijving: tour.acf.beschrijving,
      });
    }
  });
  grouped.ons_verhaal.sort((a, b) =>
    a.name.localeCompare(b.name, "nl", { sensitivity: "base" })
  );

  // Play/pause logic for individual play
  const handlePlay = (id) => {
    Object.entries(audioRefs.current).forEach(([otherId, audio]) => {
      if (audio) {
        if (parseInt(otherId) !== id) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    });
    const audio = audioRefs.current[id];
    if (!audio) return;
    if (playingIndex === id && !audio.paused) {
      audio.pause();
      setPlayingIndex(null);
    } else {
      audio.play();
      setPlayingIndex(id);
    }
  };

  // Handle "Tour starten" with pause/resume
  const handleTourStart = () => {
    if (tourPlaying && !tourPaused) {
      const currentItem = tourQueue[tourStep];
      if (currentItem) {
        const audio = audioRefs.current[currentItem.id];
        if (audio && !audio.paused) {
          audio.pause();
        }
      }
      setTourPaused(true);
      setTourPlaying(false);
      return;
    }
    if (tourPaused) {
      setTourPaused(false);
      setTourPlaying(true);
      const currentItem = tourQueue[tourStep];
      if (currentItem) {
        const audio = audioRefs.current[currentItem.id];
        if (audio && audio.paused) {
          audio.play();
        }
      }
      return;
    }
    const queue = SECTION_ORDER.flatMap((key) => grouped[key]).filter(
      (item) => item.audio
    );
    if (!queue.length) return;
    setTourQueue(queue);
    setTourStep(0);
    setTourPlaying(true);
    setTourPaused(false);
    setPlayingIndex(queue[0].id);
    const audio = audioRefs.current[queue[0].id];
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  };

  // Helper to force refresh audio file (bypass SW cache)
  const refreshAudioSrc = async (audioUrl) => {
    try {
      const url = new URL(audioUrl, window.location.origin);
      url.searchParams.set("_cb", Date.now());
      const response = await fetch(url.toString(), { cache: "reload" });
      // Check for valid audio MIME type
      const contentType = response.headers.get("Content-Type") || "";
      if (!response.ok || !contentType.startsWith("audio/"))
        throw new Error("Invalid audio response");
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  };

  // Listen for audio end/error to play next in queue, with fallback
  useEffect(() => {
    if ((!tourPlaying && !tourPaused) || !tourQueue.length) return;
    const currentItem = tourQueue[tourStep];
    if (!currentItem) {
      setTourPlaying(false);
      setPlayingIndex(null);
      return;
    }
    const audio = audioRefs.current[currentItem.id];
    if (!audio) return;

    let retried = false;

    const handleEnded = () => {
      if (tourPaused) return;
      if (tourStep < tourQueue.length - 1) {
        setTourStep((step) => step + 1);
      } else {
        setTourPlaying(false);
        setPlayingIndex(null);
      }
    };

    const handleError = async () => {
      if (!retried) {
        retried = true;
        // Try to refresh the audio src (bypass SW cache)
        const refreshedSrc = await refreshAudioSrc(currentItem.audio);
        if (refreshedSrc) {
          audio.src = refreshedSrc;
          audio.load();
          audio.play().catch(handleEnded); // If play fails again, skip
          return;
        }
      }
      // If still fails, skip to next
      handleEnded();
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [tourPlaying, tourPaused, tourQueue, tourStep]);

  // When tourStep changes, play the next audio
  useEffect(() => {
    if (!tourPlaying || !tourQueue.length) return;
    const currentItem = tourQueue[tourStep];
    if (!currentItem) return;
    setPlayingIndex(currentItem.id);
    const audio = audioRefs.current[currentItem.id];
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  }, [tourStep, tourPlaying, tourQueue]);

  // Focus and scroll the active card into view when playingIndex changes
  useEffect(() => {
    if (playingIndex && cardRefs.current[playingIndex]) {
      cardRefs.current[playingIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      cardRefs.current[playingIndex].focus();
    }
  }, [playingIndex]);

  // Pass refs down so cards register their audio elements and card DOM nodes
  const handleAudioRef = (id, ref) => {
    audioRefs.current[id] = ref;
    if (ref && ref.closest) {
      cardRefs.current[id] = ref.closest(`.${styles.card}`) || ref.parentNode;
    }
  };

  if (error) return <div>Error: {error}</div>;
  if (!tours.length) return <LoadingBar />;

  return (
    <main className={styles.main}>
      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <button
            className={styles.tourStartenBtn}
            onClick={handleTourStart}
            disabled={false}
          >
            {tourPlaying && !tourPaused
              ? "Tour pauzeren"
              : tourPaused
              ? "Tour hervatten"
              : "Tour starten"}
          </button>
        </div>
        <div className={styles.centerCol}>
          {SECTION_ORDER.map((sectieKey) =>
            grouped[sectieKey].length ? (
              <AudioTourSection
                key={sectieKey}
                title={SECTION_LABELS[sectieKey]}
                items={grouped[sectieKey]}
                playingIndex={playingIndex}
                isTourPlaying={tourPlaying && !tourPaused}
                onPlay={handlePlay}
                onAudioRef={handleAudioRef}
              />
            ) : null
          )}
        </div>
      </div>
    </main>
  );
}

export default AudioTourList;
