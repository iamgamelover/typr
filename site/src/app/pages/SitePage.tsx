import React from 'react';
import {Outlet} from 'react-router-dom';
// import HeaderBar from '../elements/HeaderBar';

class SitePage extends React.Component {

  render() {
    return (
      <div className="app-container">
        {/* <div>
          <HeaderBar />
        </div> */}
        <div className="app-content">
          <div id="id-app-page" className="app-page">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }
}

export default SitePage;