import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Import plugins
import 'videojs-contrib-quality-levels';
import 'videojs-seek-buttons';
import 'videojs-markers-plugin';

const VideoPlayer = ({ 
  sources, 
  poster, 
  title = "Video Player",
  width = "100%",
  height = "400px",
  controls = true,
  autoplay = false,
  preload = "metadata",
  chapters = []
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [currentChapter, setCurrentChapter] = useState(null);

  useEffect(() => {
    // Initialize Video.js player
    if (videoRef.current && !playerRef.current) {
      const videoElement = videoRef.current;
      
      playerRef.current = videojs(videoElement, {
        controls: controls,
        autoplay: autoplay,
        preload: preload,
        width: width,
        height: height,
        poster: poster,
        fluid: true,
        responsive: true,
        playbackRates: [0.5, 1, 1.25, 1.5, 2]
      });

      // Initialize plugins after player is ready
      playerRef.current.ready(() => {
        console.log('Video.js player is ready');
        
        // Add seek buttons
        if (playerRef.current.seekButtons) {
          playerRef.current.seekButtons({
            forward: 10,
            back: 10
          });
        }

        // Add chapter markers
        if (chapters && chapters.length > 0 && playerRef.current.markers) {
          playerRef.current.markers({
            markerStyle: {
              'width': '10px',
              'background-color': '#FF6B6B',
              'border-radius': '2px',
              'opacity': '0.8'
            },
            markerTip: {
              display: true,
              text: function(marker) {
                return marker.text;
              }
            },
            breakOverlay: {
              display: false
            },
            markers: chapters.map(chapter => ({
              time: chapter.time,
              text: chapter.title,
              overlayText: chapter.title
            }))
          });

          console.log('Chapter markers added:', chapters.length);
        }
      });

      // Set sources
      if (sources && sources.length > 0) {
        playerRef.current.src(sources);
      }

      // Track current chapter based on time
      const updateCurrentChapter = () => {
        if (playerRef.current && chapters.length > 0) {
          const currentTime = playerRef.current.currentTime();
          
          // Find the current chapter based on video time
          let activeChapter = chapters[0]; // Default to first chapter
          for (let i = chapters.length - 1; i >= 0; i--) {
            if (currentTime >= chapters[i].time) {
              activeChapter = chapters[i];
              break;
            }
          }
          setCurrentChapter(activeChapter);
        }
      };

      // Listen for time updates to track current chapter
      playerRef.current.on('timeupdate', updateCurrentChapter);
      playerRef.current.on('seeking', updateCurrentChapter);
      playerRef.current.on('seeked', updateCurrentChapter);

      playerRef.current.on('error', (error) => {
        console.error('Video.js error:', error);
      });

      playerRef.current.on('loadstart', () => {
        console.log('Video loading started');
      });

      playerRef.current.on('canplay', () => {
        console.log('Video can start playing');
      });
    }

    return () => {
      // Cleanup player on unmount
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [sources, poster, controls, autoplay, preload, width, height, chapters]);

  // Update sources when they change
  useEffect(() => {
    if (playerRef.current && sources) {
      playerRef.current.src(sources);
    }
  }, [sources]);

  const handleChapterClick = (time) => {
    if (playerRef.current) {
      playerRef.current.currentTime(time);
      playerRef.current.play();
    }
  };

  return (
    <div className="video-player-container">
      {title && <h2 className="video-title">{title}</h2>}
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          controls={controls}
          preload={preload}
          data-setup="{}"
        >
          <p className="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading to a web browser that
            <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
              supports HTML5 video
            </a>.
          </p>
        </video>
        
        {/* Chapter title overlay */}
        {currentChapter && (
          <div className="current-chapter-overlay">
            <span className="chapter-indicator">•</span>
            <span className="chapter-title-text">{currentChapter.title}</span>
          </div>
        )}
      </div>
      
      {chapters && chapters.length > 0 && (
        <div className="chapters-list">
          <h3>Chapters</h3>
          <ul>
            {chapters.map((chapter, index) => (
              <li 
                key={index} 
                className="chapter-item"
                onClick={() => handleChapterClick(chapter.time)}
              >
                <span className="chapter-time">
                  {Math.floor(chapter.time / 60)}:{(chapter.time % 60).toString().padStart(2, '0')}
                </span>
                <span className="chapter-title">{chapter.title}</span>
                {chapter.description && (
                  <span className="chapter-description">{chapter.description}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;