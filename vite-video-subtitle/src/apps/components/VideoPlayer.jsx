import React, { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { FaPlay, FaPause, FaVolumeUp } from "react-icons/fa";
import PropTypes from 'prop-types';

// import Duration from './Duration'

function VideoPlayer(props) {
  const { url, progressInterval, onVideoSizeChange } = props;
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [volume, setVolume] = useState(0);
  const playerRef = useRef(null);

  const [videoWidth, setVideoWidth] = useState("auto");
  const [videoHeight, setVideoHeight] = useState("auto");
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const videoPlayer = playerRef.current.getInternalPlayer();

      if (videoPlayer && videoPlayer.videoWidth && videoPlayer.videoHeight) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        const videoAspectRatio =
          videoPlayer.videoWidth / videoPlayer.videoHeight;

        let width = 0;
        let height = 0;
        if (videoAspectRatio > 1) {
          width = Math.min(screenWidth / 2, 650);
          height = width / videoAspectRatio;
        } else {
          height = Math.min(screenHeight / 2, 550);
          width = height * videoAspectRatio;
        }

        const roundedWidth = Math.round(width);
        const roundedHeight = Math.round(height);

        setVideoWidth(roundedWidth);
        setVideoHeight(roundedHeight);

        onVideoSizeChange({ width: roundedWidth, height: roundedHeight });
      }
    };

    // window.addEventListener('resize', handleResize);
    handleResize();

    // return () => {
    //   window.removeEventListener('resize', handleResize);
    // };
  }, [videoLoaded]);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
    playerRef.current.seekTo(parseFloat(e.target.value));
  };

  const handleProgress = (state) => {
    setPlayed(parseFloat(state.played));
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleVideoReady = () => {
    setVideoLoaded(true);
  };

  return (
    <div>
      <div>
        <ReactPlayer
          ref={playerRef}
          url={url}
          width={videoWidth}
          height={videoHeight}
          playing={playing}
          volume={volume}
          onProgress={handleProgress}
          progressInterval={progressInterval}
          onReady={handleVideoReady}
        />
      </div>
      <div style={{ width: videoWidth, position: "relative" }}>
        <input
          type="range"
          min={0}
          max={0.999999}
          step="any"
          value={played}
          onChange={handleSeekChange}
          style={{
            width: "100%",
            cursor: "pointer",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <button
          style={{
            // background: "transparent",
            cursor: "pointer",
          }}
          onClick={handlePlayPause}
        >
          {playing ? <FaPause /> : <FaPlay />}
        </button>
        <FaVolumeUp style={{ marginLeft: "30px" }} />
        <input
          type="range"
          min={0}
          max={1}
          step="any"
          value={volume}
          onChange={handleVolumeChange}
          style={{ cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

VideoPlayer.propTypes = {
	url: PropTypes.string,
  progressInterval: PropTypes.number,
	onVideoSizeChange: PropTypes.func,
};

VideoPlayer.defaultProps = {
	url: '',
  progressInterval: 50,
	onVideoSizeChange: () => {},
};

export default VideoPlayer;
