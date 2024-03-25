import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import NavBar from '../elements/NavBar';
import { BsPeopleFill, BsReplyFill, BsSend, BsSendFill } from 'react-icons/bs';
import { getDataFromAO, isLoggedIn } from '../util/util';
import { AO_TWITTER } from '../util/consts';
import { Server } from '../../server/server';

interface SitePageState {
  members: number;
  posts: number;
  replies: number;
}

class SitePage extends React.Component<{}, SitePageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      members: 0,
      posts: 0,
      replies: 0,
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    // for testing
    let activeAddress = await isLoggedIn();
    // console.log("activeAddress:", activeAddress)
    Server.service.setIsLoggedIn(activeAddress);
    Server.service.setActiveAddress(activeAddress);

    this.getStatus();
    setInterval(() => this.getStatus(), 60000); // 1 min
  }

  async getStatus() {
    console.log("getStatus")

    let members = await getDataFromAO(AO_TWITTER, 'GetMembers');
    // console.log("members:", members)
    let resp = this.removeDuplicate(members);
    // console.log("members amount:", resp.length)
    this.setState({ members: resp.length });

    let posts = await getDataFromAO(AO_TWITTER, 'GetPosts');
    // console.log("posts amount:", posts.length)
    this.setState({ posts: posts.length });

    // will use this to get the amount of posts in the future.
    // let postIDs = await getDataFromAO('GetPostIDs');
    // console.log("another way for posts amount:", postIDs.length)

    let replies = await getDataFromAO(AO_TWITTER, 'GetReplies');
    // console.log("replies amount:", replies.length)
    this.setState({ replies: replies.length });
  }

  removeDuplicate(data: any) {
    let result = [];
    let ids = [] as any;
    for (let i = 0; i < data.length; i++) {
      let resp = JSON.parse(data[i]);
      let id = resp.address;
      if (!ids.includes(id)) {
        ids.push(id);
        result.push(resp);
      }
    }

    return result;
  }

  render() {
    return (
      <div className="app-container">
        <NavLink className='app-logo-line' to='/'>
          <img className='app-logo' src='/ao.png' />
          <div className='app-logo-text'>Twitter (beta)</div>
        </NavLink>

        <div className='app-status-row'>
          <div className='app-status-data'><BsPeopleFill />{this.state.members}</div>
          <div className='app-status-data'><BsSendFill />{this.state.posts}</div>
          <div className='app-status-data'><BsReplyFill />{this.state.replies}</div>
        </div>

        <div className="app-content">
          <div className="app-navbar">
            <NavBar />
            <NavLink className="app-post-button" to='/'>
              <BsSend size={22} />
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