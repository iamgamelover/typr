import React from 'react';
import { BsBookmark, BsBookmarkFill, BsChat, BsCoin, BsHeart } from 'react-icons/bs';
import { convertUrls, getDataFromAO, getDefaultProcess, getWalletAddress, messageToAO, numberWithCommas, uuid } from '../util/util';
import { formatTimestamp } from '../util/util';
import './ActivityPost.css';
import parse, { attributesToProps } from 'html-react-parser';
import { Navigate } from 'react-router-dom';
import ViewImageModal from '../modals/ViewImageModal';
import AlertModal from '../modals/AlertModal';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import { Service } from '../../server/service';
import { Server } from '../../server/server';
import { subscribe } from '../util/event';
import { Tooltip } from 'react-tooltip'

interface ActivityPostProps {
  data: any;
  afterRepost?: Function;
  beforeJump?: Function;
  isReply?: boolean;
  isPostPage?: boolean;
  txid?: string;
}

interface ActivityPostState {
  openImage: boolean;
  navigate: string;
  content: string;
  alert: string;
  avatar: string;
  nickname: string;
  address: string;
  isBookmarked: boolean;
}

class ActivityPost extends React.Component<ActivityPostProps, ActivityPostState> {

  id: string;
  imgUrl: string;
  loading: boolean = false;

  static service: Service = new Service();

  parseOptions = {
    replace: (domNode: any) => {
      if (domNode.attribs && domNode.name === 'img') {
        const props = attributesToProps(domNode.attribs);
        return <img className='ql-editor-image' onClick={(e) => this.tapImage(e, props.src)} {...props} />;
      }
    }
  };

  constructor(props: ActivityPostProps) {
    super(props);
    this.state = {
      openImage: false,
      navigate: '',
      content: '',
      alert: '',
      avatar: '',
      nickname: '',
      address: '',
      isBookmarked: false
    };

    this.onClose = this.onClose.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.getPostContent();
    this.start();

    const links = document.querySelectorAll("[id^='url']");
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }

  componentWillUnmount() {
    const links = document.querySelectorAll("[id^='url']");
    for (let i = 0; i < links.length; i++) {
      links[i].removeEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }

  async start() {
    // for testing
    this.setState({ isBookmarked: this.props.data.isBookmarked });

    let address = await getWalletAddress();
    this.setState({ address });

    let avatar = '';
    if (this.props.data.address == address) {
      avatar = localStorage.getItem('avatar');
      if (!avatar) avatar = '';
    }

    this.createAvatar(avatar);
    this.getProfile(this.props.data.address);
  }

  // load profile from the process of user's
  async getProfile(address: string) {
    let process = await getDefaultProcess(address);
    if (!process) return;

    let response = await getDataFromAO(process, 'AOTwitter.getProfile');
    if (response) {
      let profile = JSON.parse(response[response.length - 1]);
      this.setState({
        avatar: profile.avatar,
        nickname: profile.nickname,
      })
    }
  }

  createAvatar(random: string) {
    const resp = createAvatar(micah, {
      seed: this.props.data.nickname + random,
    });

    const avatar = resp.toDataUriSync();
    this.setState({ avatar });
  }

  newAvatar(e: any) {
    if (this.props.data.address !== this.state.address) return;
    e.stopPropagation();

    let random = uuid();
    localStorage.setItem('avatar', random);
    this.createAvatar(random);
  }

  async getPostContent() {
    let content = this.props.data.post;
    // content = convertHashTag(content);
    content = convertUrls(content);
    this.setState({ content });
  }

  tapImage(e: any, src: string) {
    e.stopPropagation();
    this.imgUrl = src;
    this.setState({ openImage: true })
  }

  async onLike(e: any) {
    e.stopPropagation();
    this.setState({ alert: 'Like a Post with CRED ^_^' })
  }

  async onCoin(e: any) {
    e.stopPropagation();
    this.setState({ alert: 'See the earned CRED ^_^' })
  }

  async onBookmark(e: any) {
    e.stopPropagation();
    this.setState({ isBookmarked: true });

    let process = await getDefaultProcess(Server.service.getActiveAddress());
    let resp = await messageToAO(
      process,
      { data: this.props.data },
      'AOTwitter.setBookmark'
    );

    // testing
    this.props.data.isBookmarked = true;
    Server.service.addPostToCache(this.props.data);
  }

  goProfilePage(e: any, id: string) {
    e.stopPropagation();
    if (window.location.pathname.indexOf('/user/') == 0)
      return;

    this.setState({ navigate: '/user/' + id });
  }

  goPostPage(id: string) {
    if (window.location.pathname.indexOf('/activity/post/') == 0)
      return;

    this.setState({ navigate: "/activity/post/" + id });

    // if (this.props.beforeJump)
    //   this.props.beforeJump();
  }

  onClose() {
    this.setState({ openImage: false });
  }

  renderActionsRow(data: any) {
    return (
      <div className='activity-post-action-row'>
        {!this.props.isReply &&
          <div className='activity-post-action'>
            <div className='activity-post-action-icon'>
              <BsChat />
            </div>
            <div className='activity-post-action-number'>
              {numberWithCommas(data.replies)}
            </div>
          </div>
        }

        <div className='activity-post-action' onClick={(e) => this.onLike(e)}>
          <div className='activity-post-action-icon'>
            <BsHeart />
          </div>
          <div className='activity-post-action-number'>
            {numberWithCommas(data.likes)}
          </div>
        </div>

        <div className='activity-post-action' onClick={(e) => this.onCoin(e)}>
          <div className='activity-post-action-icon'>
            <BsCoin />
          </div>
          <div className='activity-post-action-number'>
            {numberWithCommas(data.coins)}
          </div>
        </div>

        {Server.service.getIsLoggedIn() && !this.props.isReply &&
          <div className='activity-post-action'>
            <div className='activity-post-action-icon'>
              {data.isBookmarked || this.state.isBookmarked
                ?
                <BsBookmarkFill
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Can't be removed now"
                  color='rgb(114, 114, 234)'
                />
                :
                <BsBookmark
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Bookmark"
                  onClick={(e) => this.onBookmark(e)}
                />
              }
            </div>
          </div>
        }
      </div>
    )
  }

  openLink(txid: string) {
    window.open('https://www.ao.link/message/' + txid);
  }

  render() {
    let owner = (this.props.data.address == this.state.address);

    let avatar, nickname;
    let profile = JSON.parse(localStorage.getItem('profile'));
    if (profile) {
      avatar = profile.avatar
      nickname = profile.nickname
    }

    let data = this.props.data;
    let address = data.address;
    if (address)
      address = address.substring(0, 4) + '...' + address.substring(address.length - 4);

    if (this.state.navigate)
      return <Navigate to={this.state.navigate} />;

    return (
      <div
        className={`home-msg-line ${this.props.isReply || this.props.isPostPage ? 'no_hover' : ''}`}
        style={{ cursor: this.state.openImage || this.props.isReply || this.props.isPostPage ? 'auto' : 'pointer' }}
        onClick={() => this.goPostPage(data.id)}
      >
        <div className='home-msg-header'>
          <img
            className='home-msg-portrait'
            src={owner ? avatar : this.state.avatar}
            // onClick={(e) => this.goProfilePage(e, data.address)}
            // title={owner ? 'Click to change your avatar' : ''}
          />
          <div className="home-msg-nickname">
            {owner ? nickname : this.state.nickname ? this.state.nickname : data.nickname}
          </div>

          <div className="home-msg-address">{address}</div>
          <div className='home-msg-time'>
            &#x2022;&nbsp;&nbsp;{formatTimestamp(data.time)}
          </div>

          {this.props.isPostPage && this.props.txid &&
            <img
              className='activity-post-arweave-icon'
              src='/ar.svg'
              onClick={() => this.openLink(this.props.txid)}
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Go to ao.link"
            />
          }
        </div>

        <div className='home-message'>
          {parse(this.state.content, this.parseOptions)}
        </div>

        {this.renderActionsRow(data)}

        <Tooltip id="my-tooltip" />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    )
  }
}

export default ActivityPost;