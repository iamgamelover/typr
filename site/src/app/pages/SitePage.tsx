import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import NavBar from '../elements/NavBar';
import { BsRocketTakeoff } from 'react-icons/bs';
import { isLoggedIn } from '../util/util';
import { Service } from '../../server/service';

class SitePage extends React.Component {

  static service: Service = new Service();

  componentDidMount() {
    console.log('SitePage')
    // this.start()
  }
  
  // async start() {
  //   // for testing
  //   let activeAddress = await isLoggedIn();
  //   console.log("activeAddress:", activeAddress)
  //   SitePage.service.setIsLoggedIn(activeAddress);
  //   SitePage.service.setActiveAddress(activeAddress);
  // }

  render() {
    return (
      <div className="app-container">
        <NavLink className='app-logo-line' to='/'>
          <img className='app-logo' src='/ao.png' />
          <div className='app-logo-text'>Twitter (beta)</div>
        </NavLink>

        <div className="app-content">
          <div className="app-navbar">
            <NavBar />
            <NavLink className="app-post-button" to='/'>
              <BsRocketTakeoff size={23} />
              <div>Post</div>
            </NavLink>

            {/* <div className='app-portrait-container'>
              <img className='testao-msg-portrait' src='/portrait-default.png' />
              <div className="testao-msg-nicknam">name</div>
            </div> */}
          </div>

          <div id="id-app-page" className="app-page">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }
}

export default SitePage;