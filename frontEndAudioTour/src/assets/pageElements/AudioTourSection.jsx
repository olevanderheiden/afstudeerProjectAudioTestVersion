import AudioTourCard from "./AudioTourCard";
import styles from "../../styles/AudioTourSection.module.css";

const AudioTourSection = ({
  title,
  items,
  playingIndex,
  isTourPlaying,
  onPlay,
  onAudioRef,
}) => (
  <section className={styles.section}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <div className={styles.sectionContent}>
      {items.map((item) => (
        <AudioTourCard
          key={item.id}
          item={item}
          isActive={playingIndex === item.id}
          isTourPlaying={isTourPlaying}
          onPlay={onPlay}
          onAudioRef={onAudioRef}
        />
      ))}
    </div>
  </section>
);

export default AudioTourSection;
