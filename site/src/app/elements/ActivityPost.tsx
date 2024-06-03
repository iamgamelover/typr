import React from 'react';
import { BsBookmark, BsBookmarkFill, BsChat, BsHeart, BsHeartFill } from 'react-icons/bs';
import {
  convertUrlsToLinks, getDataFromAO, getDefaultProcess, getWalletAddress, messageToAO,
  numberWithCommas, randomAvatar, shortAddr, timeOfNow, transferToken
} from '../util/util';
import { formatTimestamp } from '../util/util';
import './ActivityPost.css';
import parse, { attributesToProps } from 'html-react-parser';
import { Navigate } from 'react-router-dom';
import ViewImageModal from '../modals/ViewImageModal';
import AlertModal from '../modals/AlertModal';
import { Service } from '../../server/service';
import { Server } from '../../server/server';
import { subscribe } from '../util/event';
import { Tooltip } from 'react-tooltip'
import BountyModal from '../modals/BountyModal';
import { FaCoins } from 'react-icons/fa';
import { AO_STORY, AO_TWITTER, STORY_INCOME } from '../util/consts';
import MessageModal from '../modals/MessageModal';
import BountyRecordsModal from '../modals/BountyRecordsModal';
import { HiOutlineLockClosed } from "react-icons/hi2";

interface ActivityPostProps {
  data: any;
  isReply?: boolean;
  isPostPage?: boolean;
  isStory?: boolean;
  txid?: string;
}

interface ActivityPostState {
  openImage: boolean;
  openBounty: boolean;
  openBountyRecords: boolean;
  bountyRecords: any;
  navigate: string;
  content: string;
  message: string;
  alert: string;
  question: string;
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
      openBounty: false,
      openBountyRecords: false,
      bountyRecords: '',
      navigate: '',
      content: '',
      message: '',
      alert: '',
      question: '',
      address: '',
      isBookmarked: false,
    };

    this.onBounty = this.onBounty.bind(this);
    this.openBounty = this.openBounty.bind(this);
    this.onClose = this.onClose.bind(this);
    // this.onQuestionYes = this.onQuestionYes.bind(this);
    // this.onQuestionNo = this.onQuestionNo.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
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

  // onQuestionYes() {
  //   this.onLike();
  //   this.setState({ question: '' });
  // }

  // onQuestionNo() {
  //   this.setState({ question: '' });
  // }

  async start() {
    this.getPostContent();

    // for testing
    this.setState({ isBookmarked: this.props.data.isBookmarked });

    let address = await getWalletAddress();
    this.setState({ address });
  }

  async getPostContent() {
    let content = this.props.data.post;
    // content = convertHashTag(content);
    content = convertUrlsToLinks(content);
    this.setState({ content });
  }

  tapImage(e: any, src: string) {
    e.stopPropagation();
    this.imgUrl = src;
    this.setState({ openImage: true })
  }

  async openBounty(e: any) {
    e.stopPropagation();

    let alert;
    if (!Server.service.isLoggedIn())
      alert = 'Please connect to wallet.';

    // Yourself
    if (this.props.data.address == Server.service.getActiveAddress()) {
      // alert = "You can't bounty to yourself.";
      this.setState({ message: 'Loading...' });
      let bountyRecords = await getDataFromAO(AO_TWITTER, 'Get-Records-Bounty', { id: this.props.data.id });
      // console.log("bountyRecords:", bountyRecords)
      this.setState({ message: '', openBountyRecords: true, bountyRecords });
      return;
    }

    if (alert) {
      this.setState({ alert });
      return;
    }

    this.setState({ openBounty: true })
  }

  onBounty(qty: string) {
    // console.log('onBounty -> qty: ', qty)
    this.props.data.coins = qty;
  }

  async onLike() {
    if (!Server.service.isLoggedIn()) {
      this.setState({ alert: 'Please connect to wallet.' });
      return;
    }

    this.setState({ message: 'Liking the story...' });

    let id = this.props.data.id;
    let action = 'UpdateLike';
    if (this.props.isReply) action = 'UpdateLikeForReply';

    await messageToAO(AO_STORY, id, action);

    // record the list of liked to ao
    let data = { id, address: this.state.address, time: timeOfNow() }
    await messageToAO(AO_STORY, data, 'SendLike');

    // this.onTransfer()

    this.props.data.likes += 1;
    this.props.data.isLiked = true;
    this.setState({ message: '' });
  }

  async onTransfer() {
    // the user's process to tranfer a bounty
    let to = await getDefaultProcess(this.props.data.address);
    console.log("to:", to)

    let alert;
    if (!to)
      alert = 'He/She has not a default process to transfer bounty.';

    if (alert) {
      this.setState({ alert, message: '' });
      return;
    }

    await transferToken(STORY_INCOME, to, '1');

    this.setState({ message: '' });

    // refreshing the number that displayed on the post.
    // this.props.data.coins += 1;

    // TODO: update the bounty (coins)
    // let data = { id: this.props.data.id, coins: '1' }
    // console.log("data:", data)
    // messageToAO(AO_STORY, data, 'UpdateBounty');
  }

  async onBookmark(e: any) {
    e.stopPropagation();
    this.setState({ isBookmarked: true });

    let data = this.props.data;

    // stored in localStorage
    let list = [];
    let val = localStorage.getItem('bookmarks');
    if (val) list = JSON.parse(val);
    list.push(data);

    localStorage.setItem('bookmarks', JSON.stringify(list))

    data.isBookmarked = true;
    Server.service.addPostToCache(data);
  }

  async removeBookmark(e: any, id: string) {
    e.stopPropagation();
    this.setState({ isBookmarked: false });

    let data = this.props.data;

    // get from localStorage
    let list = [];
    let val = localStorage.getItem('bookmarks');
    list = JSON.parse(val);

    let result = list.filter((item: any) => {
      return item.id !== id;
    });

    localStorage.setItem('bookmarks', JSON.stringify(result))
    data.isBookmarked = false;
    Server.service.addPostToCache(data);
  }

  goProfilePage(e: any, id: string) {
    e.stopPropagation();
    let path = window.location.hash.slice(1);
    if (path.indexOf('/user/') == 0 || path.indexOf('/profile') == 0)
      return;

    this.setState({ navigate: '/user/' + id });
  }

  goPostPage(id: string) {
    let path = window.location.hash.slice(1);
    if (path.indexOf('/post/') == 0 || path.indexOf('/story/') == 0)
      return;

    this.setState({ navigate: "/post/" + id });
  }

  onClose() {
    this.setState({ openImage: false, openBounty: false, openBountyRecords: false });
  }

  renderActionsRow(data: any) {
    let isStory = false;
    let path = window.location.hash.slice(1);
    if (path.indexOf('/story/') == 0)
      isStory = true;

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

        {(isStory || !this.props.isReply) &&
          <div
            className='activity-post-action'
            data-tooltip-id="my-tooltip"
            data-tooltip-content="Bounty"
            onClick={(e) => this.openBounty(e)}
          >
            <div className='activity-post-action-icon'>
              <FaCoins />
            </div>
            <div className='activity-post-action-number'>
              {numberWithCommas(data.coins)}
            </div>
          </div>
        }

        {isStory &&
          <div>
            {data.isLiked
              ?
              <div
                className='activity-post-action'
                data-tooltip-id="my-tooltip"
                data-tooltip-content="Liked!"
              >
                <div className='activity-post-action-icon'>
                  <BsHeartFill color='red' />
                </div>
                <div className='activity-post-action-number'>
                  {numberWithCommas(data.likes)}
                </div>
              </div>
              :
              <div
                className='activity-post-action'
                data-tooltip-id="my-tooltip"
                data-tooltip-content="Like the story and that will get a reward from Life."
                onClick={() => this.onLike()}
              >
                <div className='activity-post-action-icon'>
                  <BsHeart />
                </div>
                <div className='activity-post-action-number'>
                  {numberWithCommas(data.likes)}
                </div>
              </div>}
          </div>
        }

        {Server.service.isLoggedIn() && !this.props.isReply && !isStory &&
          <div className='activity-post-action'>
            <div className='activity-post-action-icon'>
              {data.isBookmarked || this.state.isBookmarked
                ?
                <BsBookmarkFill
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Remove from bookmarks"
                  color='rgb(114, 114, 234)'
                  onClick={(e) => this.removeBookmark(e, data.id)}
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
    let data = this.props.data;

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
            // data-tooltip-id="my-tooltip"
            // data-tooltip-content="Go to the profile page"
            src={data.avatar ? data.avatar : randomAvatar()}
            onClick={(e) => this.goProfilePage(e, data.address)}
            title='Show Profile'
          // onMouseEnter={()=>this.openPopup()}
          // onMouseLeave={(e)=>this.closePopup(e)}
          />
          <div className="activity-post-nickname">
            {data.nickname}
          </div>

          <div className="home-msg-address">{shortAddr(data.address, 4)}</div>
          <div className='home-msg-time'>
            ·&nbsp;&nbsp;{formatTimestamp(data.time)}
          </div>

          {data.range === 'private' &&
            <div><HiOutlineLockClosed /></div>
          }

          {this.props.isPostPage && this.props.txid &&
            <img
              className='activity-post-arweave-icon'
              src='./ar.svg'
              onClick={() => this.openLink(this.props.txid)}
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Go to ao.link"
            />
          }
        </div>

        <div className='activity-post-content'>
          {parse(this.state.content, this.parseOptions)}
        </div>

        {this.renderActionsRow(data)}

        <BountyModal
          open={this.state.openBounty}
          onClose={this.onClose}
          onBounty={this.onBounty}
          data={this.props.data}
          isReply={this.props.isReply}
          isStory={this.props.isStory}
        />

        {this.state.openBountyRecords &&
          <BountyRecordsModal
            open={this.state.openBountyRecords}
            onClose={this.onClose}
            data={this.state.bountyRecords}
          />
        }

        <Tooltip id="my-tooltip" />
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        {/* <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} /> */}
        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    )
  }
}

export default ActivityPost;