import React from 'react';
import './externalEmbed.css';
import { regexPatterns } from '../util/consts';

interface ExternalEmbedProps {
    src: string;
}

const ExternalEmbed: React.FC<ExternalEmbedProps> = ({ src }) => {
    const { youtubeRegex } = regexPatterns;
    // console.log('ExternalEmbed:', src);
    const getVideoID = (src: string): string | null => {
        const match = src.match(youtubeRegex);
        return match ? match[1] : null;
      };
    
      const videoId = getVideoID(src);
    
      if (!videoId) {
        return <p>Invalid video URL: ${src}</p>;
      }
    
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      const iframeTitle = `YouTube video player`;

    return (
        <div className="embed-container">
            <iframe
                className="responsive-iframe"
                src={embedUrl}
                title={iframeTitle}
                frameBorder="0"
                allowFullScreen
            ></iframe>
        </div>
    );
};

export default ExternalEmbed;