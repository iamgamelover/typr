import React from 'react';
import './ActivityPostPage.css'
import 'react-quill/dist/quill.snow.css';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { BsFillArrowLeftCircleFill, BsPlugin, BsReply } from 'react-icons/bs';
import { subscribe } from '../util/event';
import { checkContent, getDataFromAO, getWalletAddress, isLoggedIn, timeOfNow, messageToAO, uuid, getDefaultProcess, isBookmarked } from '../util/util';
import { AO_TWITTER, TIP_IMG } from '../util/consts';
import { Server } from '../../server/server';
import { AiOutlineFire } from "react-icons/ai";
import QuestionModal from '../modals/QuestionModal';

interface ActivityPostPageState {
  post: any;
  replies: any;
  message: string;
  alert: string;
  question: string;
  loading: boolean;
  loading_reply: boolean;
  isLoggedIn: string;
  address: string;
  txid: string;
}

class ActivityPostPage extends React.Component<{}, ActivityPostPageState> {

  quillRef: any;
  wordCount = 0;
  postId: string;

  constructor(props: {}) {
    super(props);
    this.state = {
      post: '',
      replies: '',
      message: '',
      alert: '',
      question: '',
      loading: true,
      loading_reply: true,
      isLoggedIn: '',
      address: '',
      txid: '',
    };

    this.onContentChange = this.onContentChange.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  componentDidMount() {
    this.start();
  }

  onQuestionYes() {
    this.setState({ question: '' });
  }

  onQuestionNo() {
    this.setState({ question: '' });
  }

  async start() {
    let address = await isLoggedIn();
    this.setState({ isLoggedIn: address, address });
    this.getPost();
  }

  async getPost() {
    this.postId = window.location.pathname.substring(15);
    let post = Server.service.getPostFromCache(this.postId);

    if (!post) {
      post = await this.getPostById(this.postId)
      if (!post) {
        this.setState({ alert: 'Post not found.' });
        return;
      }
    }

    this.setState({ post, loading: false });
    this.getReplies(this.postId);

    let txid = await this.getTxidOfPost(this.postId);
    this.setState({ txid });

    // TEMP WAY -- to check the state of bookmark
    let process = await getDefaultProcess(this.state.address);
    let bookmarks = await getDataFromAO(process, 'AOTwitter.getBookmarks');
    let resp = isBookmarked(bookmarks, post.id);
    post.isBookmarked = resp;
    this.setState({ post });
  }

  async getTxidOfPost(postId: string) {
    let resp = await getDataFromAO(AO_TWITTER, 'GetPostIDs');

    for (let i = 0; i < resp.length; i++) {
      let data;
      try {
        data = JSON.parse(resp[i]);
        if (data.postId == postId) return data.txid;
      } catch (error) {
        continue;
      }
    }

    return '';
  }

  async getPostById(id: string) {
    let resp = await getDataFromAO(AO_TWITTER, 'GetPosts', null, null, id);
    let data = JSON.parse(resp[0]);
    Server.service.addPostToCache(data);
    return data;
  }

  async getReplies(postId: string) {
    let replies = await getDataFromAO(AO_TWITTER, 'GetReplies', null, null, postId);
    this.setState({
      replies: replies ? replies : [],
      loading_reply: false
    });
  }

  async onReply() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    let address = await getWalletAddress();
    if (!address) {
      this.setState({ isLoggedIn: '', alert: 'You should connect to wallet first.' });
      return;
    }

    this.setState({ message: 'Replying...' });

    let post = this.quillRef.root.innerHTML;
    let nickname = localStorage.getItem('nickname');
    if (!nickname) nickname = 'anonymous';

    let data = {
      id: uuid(), postId: this.postId, address, nickname, post,
      likes: 0, replies: 0, coins: 0, time: timeOfNow()
    };

    let response = await messageToAO(AO_TWITTER, data, 'SendReply');

    if (response) {
      this.quillRef.setText('');
      this.state.post.replies += 1;
      this.state.replies.push(JSON.stringify(data));
      this.setState({ message: '', replies: this.state.replies, post: this.state.post });

      // update the amount of replies
      messageToAO(AO_TWITTER, this.postId, 'UpdateReply');
    }
    else
      this.setState({ message: '', alert: TIP_IMG })
  }

  onAlertClose() {
    this.setState({ alert: '' });
  }

  renderReplies() {
    if (this.state.loading_reply)
      return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div id="loading" />
        </div>
      );

    let divs = [];
    let replies = this.state.replies;

    for (let i = replies.length - 1; i >= 0; i--)
      divs.push(
        <ActivityPost
          key={i}
          data={JSON.parse(replies[i])}
          isReply={true}
        />
      )

    return divs;
  }

  onBack() {
    window.history.back();
  }

  toStory() {
    this.setState({ question: "Why don't you turn the post into a story? Show your support for the author!" });
  }

  render() {
    let date = new Date(this.state.post.time * 1000).toLocaleString();

    return (
      <div className="activity-post-page">
        <div className="activity-post-page-header" onClick={() => this.onBack()}>
          <div className="activity-post-page-back-button"><BsFillArrowLeftCircleFill /></div>
          <div>{this.state.loading ? 'Loading...' : 'Post'}</div>
          {date != 'Invalid Date' && <div className='activity-post-time'>&#x2022;&nbsp;&nbsp;{date}</div>}
        </div>

        {!this.state.loading &&
          <ActivityPost data={this.state.post} isPostPage={true} txid={this.state.txid} />
        }

        {!this.state.loading &&
          <div className='activity-post-page-story-row'>
            <div className="app-post-button story" onClick={() => this.toStory()}>
              <AiOutlineFire size={23} />
              <div>To Story</div>
            </div>
            <div><BsPlugin size={18} />&nbsp;&nbsp;&nbsp;1 / 100</div>
          </div>
        }

        {!this.state.loading && this.state.isLoggedIn && !this.state.loading_reply &&
          <div className="activity-post-page-reply-container">
            <SharedQuillEditor
              placeholder='Enter reply...'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='activity-post-page-action'>
              <div className="app-post-button story reply" onClick={() => this.onReply()}>
                <BsReply size={23} />
                <div>Reply</div>
              </div>
            </div>
          </div>
        }

        {!this.state.loading && !this.state.loading_reply &&
          <div className='activity-post-page-reply-header'>
            {this.state.replies.length} Replies
          </div>
        }

        {!this.state.loading &&
          this.renderReplies()
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.onAlertClose()} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    );
  }
}

export default ActivityPostPage;