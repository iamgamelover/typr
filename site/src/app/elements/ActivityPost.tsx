import React from 'react';
import { BsChat, BsChatSquareText, BsCoin, BsEyeglasses, BsHeart, BsPersonFillLock } from 'react-icons/bs';
import { capitalizeFirstLetter, convertHashTag, convertUrls, getPortraitImage, numberWithCommas } from '../util/util';
import { formatTimestamp } from '../util/util';
import './ActivityPost.css';
import parse, { attributesToProps } from 'html-react-parser';
import { NavLink, Navigate } from 'react-router-dom';
import ViewImageModal from '../modals/ViewImageModal';

interface ActivityPostProps {
  data: any;
  activeAddress: string;
  afterRepost?: Function;
  beforeJump?: Function;
  isReply?: boolean;
  isPostPage?: boolean;
}

interface ActivityPostState {
  openImage: boolean;
  navigate: string;
  content: string;
  author: any;
}

class ActivityPost extends React.Component<ActivityPostProps, ActivityPostState> {

  id: string;
  imgUrl: string;
  loading: boolean = false;

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
    // let data  = this.props.data;
    // this.id  = data.id;

    this.state = {
      openImage: false,
      navigate: '',
      content: '',
      author: ''
    };

    this.onClose = this.onClose.bind(this);
  }

  componentDidMount() {
    // this.getProfile();
    this.getPostContent();

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

  async getPostContent() {
    let content = this.props.data.post;
    content = convertHashTag(content);
    content = convertUrls(content);
    this.setState({ content });
  }

  async getProfile() {
    // let author = Server.public.getProfile(this.props.data.author);
    // if (!author) {
    //   await Server.public.cacheProfiles([this.props.data]);
    //   author = Server.public.getProfile(this.props.data.author);
    // }

    // this.setState({ author });
  }

  tapImage(e: any, src: string) {
    e.stopPropagation();
    this.imgUrl = src;
    this.setState({ openImage: true })
  }

  async onCoins(e: any) {
    e.stopPropagation();
  }

  goProfilePage(e: any, id: string) {
    e.stopPropagation();
    if (window.location.pathname.indexOf('/profile/') == 0)
      return;

    this.setState({ navigate: '/profile/' + id });
  }

  onJump(id: string) {
    // if (this.props.isMission)
    //   this.goMissionPage(id);
    // else
    //   this.goPostPage(id);
  }

  goPostPage(id: string) {
    if (window.location.pathname.indexOf('/activity/post/') == 0)
      return;

    this.setState({ navigate: "/activity/post/" + id });

    if (this.props.beforeJump)
      this.props.beforeJump();
  }

  goMissionPage(id: string) {
    if (window.location.pathname.indexOf('/mission/') == 0)
      return;

    this.setState({ navigate: "/mission/" + id });

    if (this.props.beforeJump)
      this.props.beforeJump();
  }

  onClose() {
    this.setState({ openImage: false });
  }

  renderActionsRow(data: any) {
    let value = Number(data.replies);
    value = 0;
    return (
      <div className='activity-post-action-row'>
        {!this.props.isReply &&
          <div className='activity-post-action'>
            <div className='activity-post-action-icon'>
              <BsChat />
            </div>
            <div className='activity-post-action-number'>
              {numberWithCommas(value)}
            </div>
          </div>
        }

        <div className='activity-post-action' onClick={(e)=>this.onCoins(e)}>
          <div className='activity-post-action-icon'>
            <BsHeart />
          </div>
          <div className='activity-post-action-number'>
            {numberWithCommas(value)}
          </div>
        </div>

        <div className='activity-post-action' onClick={(e)=>this.onCoins(e)}>
          <div className='activity-post-action-icon'>
            <BsCoin />
          </div>
          <div className='activity-post-action-number'>
            {numberWithCommas(value)}
          </div>
        </div>
      </div>
    )
  }

  render() {
    let data = this.props.data;
    // let author  = this.state.author;
    let date = formatTimestamp(data.created_at / 1000, true);
    let path = window.location.pathname.substring(1, 6);

    let address = data.address;
    address = address.substring(0, 4) + '...' + address.substring(address.length - 4);

    if (this.state.navigate)
      return <Navigate to={this.state.navigate} />;

    return (
      <div
        className='testao-msg-line'
        style={{ cursor: this.state.openImage || this.props.isReply || this.props.isPostPage ? 'auto' : 'pointer' }}
        onClick={() => this.onJump(data.id)}
      >
        <div className='testao-msg-header'>
          <img className='testao-msg-portrait' src='portrait-default.png' />
          <div className="testao-msg-nickname">{data.nickname}</div>
          <div className="testao-msg-address">{address}</div>
          <div className='testao-msg-time'>&#9679; {formatTimestamp(data.time, true)}</div>
        </div>

        <div className={`testao-message ${data.address == this.props.activeAddress ? 'my-post' : ''}`}>
          {parse(this.state.content, this.parseOptions)}
        </div>

        {this.renderActionsRow(data)}

        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    )
  }
}

export default ActivityPost;