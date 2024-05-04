import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import NavBar from '../elements/NavBar';
import { BsPeopleFill, BsReplyFill, BsSend, BsSendFill } from 'react-icons/bs';
import {
  formatBalance, getDataFromAO, getDefaultProcess,
  getTokenBalance, isLoggedIn,
  messageToAO
} from '../util/util';
import { AOT_TEST, AO_TWITTER, CRED, TRUNK } from '../util/consts';
import { Server } from '../../server/server';
import PostModal from '../modals/PostModal';
import Portrait from '../elements/Portrait';
import { publish, subscribe } from '../util/event';

interface SitePageState {
  users: number;
  posts: number;
  replies: number;
  open: boolean;
  address: string;
}

class SitePage extends React.Component<{}, SitePageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      users: 0,
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

    // getting notifications.
    setInterval(() => this.getNotis(), 20000); // 20 seconds

    let bal_cred = await getTokenBalance(CRED, process);
    // bal_cred = formatBalance(bal_cred, 3);
    // console.log("bal_cred:", bal_cred)
    Server.service.setBalanceOfCRED(bal_cred);

    let bal_aot = await getTokenBalance(AOT_TEST, process);
    // console.log("bal_aot:", bal_aot)
    Server.service.setBalanceOfAOT(bal_aot);

    let bal_trunk = await getTokenBalance(TRUNK, process);
    // bal_trunk = formatBalance(bal_trunk, 3);
    // console.log("bal_trunk:", bal_trunk)
    Server.service.setBalanceOfTRUNK(bal_trunk);

    publish('get-bal-done')
  }

  onOpen() {
    this.setState({ open: true });
  }

  onClose() {
    this.setState({ open: false });
    publish('new-post');
  }

  async getStatus() {
    let users = await getDataFromAO(AO_TWITTER, 'GetUsersCount');
    this.setState({ users: users[0].total_count });

    let posts = await getDataFromAO(AO_TWITTER, 'GetPostsCount');
    this.setState({ posts: posts[0].total_count });

    let replies = await getDataFromAO(AO_TWITTER, 'GetRepliesCount');
    this.setState({ replies: replies[0].total_count });
  }

  async getNotis() {
    let process = Server.service.getDefaultProcess();
    let address = Server.service.getActiveAddress();
    let postIDs = await getDataFromAO(AO_TWITTER, 'Get-PostIDs', { address });
    // console.log("postIDs:", postIDs)

    for (let i = 0; i < postIDs.length; i++) {
      let post_id = postIDs[i].id;
      let data = { post_id: post_id, offset: 0 };
      let replies = await getDataFromAO(AO_TWITTER, 'GetReplies', data);
      // console.log("replies:", replies)

      for (let j = 0; j < replies.length; j++) {
        let reply = replies[j];
        if (reply.address == address) continue;

        let data = {
          reply_id: reply.id,
          post_id: post_id,
          noti_type: 'REPLY',
          address: reply.address,
          avatar: reply.avatar,
          nickname: reply.nickname,
          post: reply.post,
          bounty: 0,
          bounty_type: '',
          time: reply.time,
        };
        // console.log("insert noti data --> ", data)

        let response = await messageToAO(process, data, 'Record-Noti');
      }
    }
  }

  render() {
    return (
      <div className="app-container">
        <NavLink className='app-logo-line' to='/'>
          <img className='app-logo' src='./logo.png' />
          {/* <img className='app-logo' src='/ao.png' /> */}
          {/* <div className='app-logo-text'>Twitter (beta)</div> */}
        </NavLink>

        <div className='app-status-row'>
          <div className='app-status-data'><BsPeopleFill />{this.state.users}</div>
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