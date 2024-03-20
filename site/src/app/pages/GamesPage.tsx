import React from 'react';
import './GamesPage.css';

class GamesPage extends React.Component {
  render() {
    return (
      <div className='games-page'>
        <div className='games-intro-line'>
          We believe that games will shape our future. <br/>
          Span across entertainment, education, health, shopping, crypto, and fintech. 
          <br/>And that is where we will be. <br/>
          From https://twitter.com/jasonoliver
        </div>
        <div className='games-intro-line game'>
          There is a MUD game running on AO that can be played in the AOS terminal. <br/>
          Here is a place for GUI to play it. <br/>
          Stay tuned! 
        </div>
      </div>
    )
  }
}

export default GamesPage;