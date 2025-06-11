import React from "react";
import styles from "../../styles/LoadingBar.module.css";

const LoadingBar = () => (
  <div className={styles.loadingBarContainer}>
    <div className={styles.loadingBar}>
      <div className={styles.loadingBarProgress}></div>
    </div>
    <span className={styles.loadingText}>Audio tour data aan het laden...</span>
  </div>
);

export default LoadingBar;
