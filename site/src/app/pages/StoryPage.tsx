import React from 'react';
import './StoryPage.css';

class StoryPage extends React.Component {
  render() {
    return (
      <div className='story-page'>
        <h1>Story</h1>
        <div className='story-intro-line'>
          Once a post receives enough support. <br/>
          It becomes a featured story. <br/>
          And the author will earn rewards. <br/>
          This will inspire the author to write better stories.
        </div>
        <div className='story-intro-line game'>
        This is a platform where amazing stories can be showcased. 
        </div>
      </div>
    )
  }
}

export default StoryPage;