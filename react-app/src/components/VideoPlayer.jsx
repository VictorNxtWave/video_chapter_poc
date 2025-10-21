import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Import plugins
import 'videojs-contrib-quality-levels';
import 'videojs-seek-buttons';
import 'videojs-markers-plugin';

// Utility function to convert SRT to VTT format
const convertSrtToVtt = (srtContent) => {
  // Remove BOM if present
  srtContent = srtContent.replace(/^\uFEFF/, '');
  
  // Convert SRT timestamps to VTT format (replace commas with dots)
  let vttContent = srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  
  // Remove sequence numbers (lines that are just numbers)
  vttContent = vttContent.replace(/^\d+\s*\n/gm, '');
  
  // Clean up extra blank lines
  vttContent = vttContent.replace(/\n{3,}/g, '\n\n');
  
  // Add WEBVTT header
  vttContent = 'WEBVTT\n\n' + vttContent.trim();
  
  return vttContent;
};

// Function to fetch and convert SRT file to VTT
const fetchAndConvertSrt = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch SRT file: ${response.statusText}`);
    }
    
    const srtContent = await response.text();
    const vttContent = convertSrtToVtt(srtContent);
    
    // Create a blob from the VTT content
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const blobUrl = URL.createObjectURL(blob);
    
    return blobUrl;
  } catch (error) {
    console.error('Error converting SRT to VTT:', error);
    return null;
  }
};

const VideoPlayer = ({ 
  sources, 
  poster, 
  title = "Video Player",
  width = "100%",
  height = "400px",
  controls = true,
  autoplay = false,
  preload = "metadata",
  chapters = [],
  captions = []
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const blobUrlsRef = useRef([]); 
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

      // Set sources first
      if (sources && sources.length > 0) {
        playerRef.current.src(sources);
      }

      // Initialize plugins after player is ready
      playerRef.current.ready(() => {
        console.log('Video.js player is ready');


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

        // Add captions/subtitles (with SRT support)
        if (captions && captions.length > 0) {
          // Process captions sequentially to handle async conversion
          const loadCaptions = async () => {
            for (let index = 0; index < captions.length; index++) {
              const caption = captions[index];
              let captionSrc = caption.src;
              
              
              console.log(`Converting SRT to VTT: ${caption.label}`);
              // Convert SRT to VTT
              const vttBlobUrl = await fetchAndConvertSrt(caption.src);
              if (vttBlobUrl) {
                captionSrc = vttBlobUrl;
                // Track blob URL for cleanup
                blobUrlsRef.current.push(vttBlobUrl);
                console.log(`SRT converted successfully: ${caption.label}`);
              } else {
                console.error(`Failed to convert SRT: ${caption.label}`);
                continue; // Skip this caption if conversion failed
              }
              
              if (playerRef.current) {
                playerRef.current.addRemoteTextTrack({
                  kind: caption.kind || 'subtitles',
                  src: captionSrc,
                  srclang: caption.srclang,
                  label: caption.label,
                  default: caption.default || index === 0
                }, false);
              }
            }
            console.log('Captions added:', captions.length);
          };
          
          loadCaptions();
        }
      });

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
      
      // Revoke blob URLs to free memory
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current = [];
    };
  }, [sources, poster, controls, autoplay, preload, width, height, chapters, captions]);

  // Update sources when they change
  useEffect(() => {
    if (playerRef.current && sources) {
      playerRef.current.src(sources);
    }
  }, [sources]);

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
            {/* <span className="chapter-indicator">\</span> */}
            <span className="chapter-title-text">{currentChapter.title}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;