import React, { useState } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import './VideoPlayerPage.css';

const VideoPlayerPage = () => {
  const [selectedVideo, setSelectedVideo] = useState('hls');

  // Working video sources for testing
  const videoSources = {
    hls: [
      {
        src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        type: 'application/x-mpegURL',
        label: 'HLS - Big Buck Bunny'
      }
    ],
    mpd: [
      {
        src: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
        type: 'application/dash+xml',
        label: 'DASH/MPD - Big Buck Bunny'
      }
    ]
  };

  const posters = {
    hls: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/320px-Big_buck_bunny_poster_big.jpg',
    mpd: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/320px-Big_buck_bunny_poster_big.jpg'
  };

  // Sample chapters for the video
  const videoChapters = [
    {
      time: 0,
      title: "Opening Credits",
      description: "The story begins with our hero Big Buck Bunny"
    },
    {
      time: 30,
      title: "Meeting the Characters",
      description: "Introduction to the woodland creatures"
    },
    {
      time: 90,
      title: "The Conflict",
      description: "Trouble starts in the peaceful forest"
    },
    {
      time: 150,
      title: "The Chase",
      description: "Action-packed sequence through the forest"
    },
    {
      time: 240,
      title: "Resolution",
      description: "How our hero saves the day"
    },
    {
      time: 300,
      title: "Ending Credits",
      description: "The story concludes with a happy ending"
    }
  ];

  // Sample captions/subtitles (WebVTT format)
  const videoCaptions = [
    {
      kind: 'subtitles',
      src: '/captions-en.vtt',
      srclang: 'en',
      label: 'English',
      default: true
    },
    {
      kind: 'subtitles',
      src: '/captions-es.vtt',
      srclang: 'es',
      label: 'Spanish'
    }
  ];

  const handleVideoTypeChange = (type) => {
    setSelectedVideo(type);
  };

  return (
    <div className="video-player-page">
      <div className="page-header">
        <h1>Video.js Player - MPD & HLS Support</h1>
        <p>Demonstrating Video.js with DASH (MPD) and HLS streaming formats</p>
      </div>

      <div className="video-controls">
        <div className="format-selector">
          <label>Select Video Format:</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="videoFormat"
                value="hls"
                checked={selectedVideo === 'hls'}
                onChange={() => handleVideoTypeChange('hls')}
              />
              <span>HLS (.m3u8)</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="videoFormat"
                value="mpd"
                checked={selectedVideo === 'mpd'}
                onChange={() => handleVideoTypeChange('mpd')}
              />
              <span>DASH (.mpd)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="video-container">
        <VideoPlayer
          key={selectedVideo} // Force re-render when video type changes
          sources={videoSources[selectedVideo]}
          poster={posters[selectedVideo]}
          title={`${selectedVideo.toUpperCase()} Video Stream - Big Buck Bunny`}
          width="100%"
          height="500px"
          controls={true}
          autoplay={false}
          preload="metadata"
          chapters={videoChapters}
          captions={videoCaptions}
        />
      </div>
    </div>
  );
};

export default VideoPlayerPage;