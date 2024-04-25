import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import NavBar from '../elements/NavBar';
import { BsPeopleFill, BsReplyFill, BsSend, BsSendFill } from 'react-icons/bs';
import { getDataFromAO, getDefaultProcess, getTokenBalance, isLoggedIn } from '../util/util';
import { AOT_TEST, AO_TWITTER } from '../util/consts';
import { Server } from '../../server/server';
import PostModal from '../modals/PostModal';
import Portrait from '../elements/Portrait';
import { publish, subscribe } from '../util/event';

interface SitePageState {
  members: number;
  posts: number;
  replies: number;
  open: boolean;
  address: string;
}

class SitePage extends React.Component<{}, SitePageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      members: 0,
      posts: 0,
      replies: 0,
      open: false,
      address: '',
    };

    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);

    subscribe('wallet-events', () => {
      let address = Server.service.getIsLoggedIn();
      this.setState({ address })
    });
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    let address = await isLoggedIn();
    // console.log("site page -> address:", address)

    Server.service.setIsLoggedIn(address);
    Server.service.setActiveAddress(address);
    this.setState({ address })

    let process = await getDefaultProcess(address);
    Server.service.setDefaultProcess(process);

    this.getStatus();
    setInterval(() => this.getStatus(), 60000); // 1 min

    let bal_aot = await getTokenBalance(AOT_TEST, process);
    Server.service.setBalanceOfAOT(bal_aot);
  }

  onOpen() {
    this.setState({ open: true });
  }

  onClose() {
    this.setState({ open: false });
    publish('new-post');
  }

  async getStatus() {
    return

    let posts = await getDataFromAO(AO_TWITTER, 'GetPosts');
    // console.log("posts amount:", posts.length)
    this.setState({ posts: posts.length });

    // get the amount of addresses (No Duplicate) from all of posts.
    let resp = this.removeDuplicate(posts);
    // console.log("addr from posts --> amount:", resp.length)
    this.setState({ members: resp.length });

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
          <img className='app-logo' src='/logo.png' />
          {/* <img className='app-logo' src='/ao.png' /> */}
          {/* <div className='app-logo-text'>Twitter (beta)</div> */}
        </NavLink>

        <div className='app-status-row'>
          <div className='app-status-data'><BsPeopleFill />{this.state.members}</div>
          <div className='app-status-data'><BsSendFill />{this.state.posts}</div>
          <div className='app-status-data'><BsReplyFill />{this.state.replies}</div>
        </div>

        <div className="app-content">
          <div className="app-navbar">
            <NavBar />

            {this.state.address &&
              <div className="app-post-button" onClick={this.onOpen}>
                <BsSend size={22} />Post
              </div>
            }

            {/* <div className='app-portrait-container'>
              <img className='testao-msg-portrait' src='/portrait-default.png' />
              <div className="testao-msg-nicknam">name</div>
            </div> */}

            <Portrait />
          </div>

          <div id="id-app-page" className="app-page">
            <Outlet />
          </div>
        </div>

        <PostModal open={this.state.open} onClose={this.onClose} />
      </div>
    );
  }
}

export default SitePage;