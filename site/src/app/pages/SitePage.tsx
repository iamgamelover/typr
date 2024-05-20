import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import NavBar from '../elements/NavBar';
import {
  BsAward, BsBell, BsBookmark, BsChatText, BsController, BsHouse,
  BsPeopleFill, BsPerson, BsReplyFill, BsSend, BsSendFill
} from 'react-icons/bs';
import {
  formatBalance,
  getDataFromAO, getDefaultProcess,
  getTokenBalance, isLoggedIn,
  messageToAO
} from '../util/util';
import { AOT_TEST, AO_TWITTER, AR_DEC, CRED, ICON_SIZE, ORBT, TRUNK, WAR } from '../util/consts';
import { Server } from '../../server/server';
import PostModal from '../modals/PostModal';
import Portrait from '../elements/Portrait';
import { publish, subscribe } from '../util/event';
import './SitePage.css';
import { AiOutlineFire } from 'react-icons/ai';
import { RiQuillPenLine } from "react-icons/ri";
import { CgMoreO } from "react-icons/cg";

interface SitePageState {
  users: number;
  posts: number;
  replies: number;
  open: boolean;
  address: string;
  openMenu: boolean;
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
      openMenu: false,
    };

    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);

    subscribe('wallet-events', () => {
      let address = Server.service.isLoggedIn();
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

    let bal_war = await getTokenBalance(WAR, process);
    // console.log("bal_war:", bal_war)
    Server.service.setBalanceOfWAR(bal_war / AR_DEC);

    let bal_0rbit = await getTokenBalance(ORBT, process);
    // console.log("bal_0rbit:", bal_0rbit)
    Server.service.setBalanceOf0rbit(bal_0rbit / AR_DEC);

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

  renderToobar() {
    return (
      <div className='site-page-footer'>
        <NavLink className='site-page-icon-button' to='/'>
          <BsHouse size={ICON_SIZE} />
        </NavLink>

        <NavLink className='site-page-icon-button' to='/story'>
          <AiOutlineFire size={ICON_SIZE} />
        </NavLink>

        <div className='site-page-icon-button' onClick={this.onOpen}>
          <RiQuillPenLine size={35} />
        </div>

        <NavLink className='site-page-icon-button' to='/notifications'>
          <BsBell size={ICON_SIZE} />
        </NavLink>

        <div
          className='site-page-icon-button'
          onClick={() => this.setState({ openMenu: true })}
        >
          <CgMoreO size={ICON_SIZE} />
        </div>
      </div>
    )
  }

  renderPopupMenu() {
    return (
      <div
        className='site-page-mobile-menu'
        onClick={() => this.setState({ openMenu: false })}
      >
        <div className='site-page-menu-container'>
          <NavLink className='site-page-menu-item' to='/games'>
            <BsController size={23} />Games
          </NavLink>

          <NavLink className='site-page-menu-item' to='/token'>
            <BsAward size={23} />TokenEco
          </NavLink>

          <NavLink className='site-page-menu-item' to='/chat'>
            <BsChatText size={23} />Chatroom
          </NavLink>

          <NavLink className='site-page-menu-item' to='/bookmarks'>
            <BsBookmark size={23} />Bookmarks
          </NavLink>

          <NavLink className='site-page-menu-item' to='/profile'>
            <BsPerson size={23} />Profile
          </NavLink>

          {/* <div className='site-page-menu-item'>
            <RxExit size={23} />Log out
          </div> */}
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="app-container">
        <div className='site-page-header-pc'>
          <NavLink className='app-logo-line' to='/'>
            <img className='app-logo' src='./logo.png' />
          </NavLink>

          <div className='app-status-row'>
            <div className='app-status-data'><BsPeopleFill />{this.state.users}</div>
            <div className='app-status-data'><BsSendFill />{this.state.posts}</div>
            <div className='app-status-data'><BsReplyFill />{this.state.replies}</div>
          </div>
        </div>

        {/* FOR MOBILE */}
        <div className='site-page-header-mobile'>
          <NavLink to='/'>
            <img className='app-logo' src='./logo.png' />
          </NavLink>
          <Portrait />
        </div>

        <div className="app-content">
          <div className="app-navbar">
            <NavBar />

            {this.state.address &&
              <div className="app-post-button" onClick={this.onOpen}>
                <BsSend size={22} />Post
              </div>
            }

            <Portrait />
          </div>

          <div className="app-page">
            <Outlet />
          </div>
        </div>

        {this.renderToobar()}

        {this.state.openMenu &&
          this.renderPopupMenu()
        }

        <PostModal open={this.state.open} onClose={this.onClose} />
      </div>
    );
  }
}

export default SitePage;