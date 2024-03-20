import React from 'react';
import './ActivityPostPage.css'
import 'react-quill/dist/quill.snow.css';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { BsClock, BsFillArrowLeftCircleFill } from 'react-icons/bs';
import { subscribe } from '../util/event';
import HomePage from './HomePage';
import { dryrun } from '@permaweb/aoconnect/browser';
import { checkContent, getDataFromAO, getNumOfReplies, getWalletAddress, isLoggedIn, timeOfNow, messageToAO, uuid } from '../util/util';
import { AO_TWITTER, TIP_IMG } from '../util/consts';

interface ActivityPostPageState {
  post: any;
  replies: any;
  message: string;
  alert: string;
  loading: boolean;
  loading_reply: boolean;
  isLoggedIn: string;
  address: string;
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
      loading: true,
      loading_reply: true,
      isLoggedIn: '',
      address: '',
    };

    this.onContentChange = this.onContentChange.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  componentDidMount() {
    document.getElementById('id-app-page').scrollTo(0, 0);
    this.start();
  }

  async start() {
    let address = await isLoggedIn();
    this.setState({ isLoggedIn: address, address });
    this.getPost();
  }
  
  async getPost() {
    this.postId = window.location.pathname.substring(15);
    let post = HomePage.service.getPostFromCache(this.postId);

    if (!post) {
      post = await this.getPostById(this.postId)
      if (!post) {
        this.setState({ alert: 'Post not found.' });
        return;
      }

      post.replies = await getNumOfReplies(post.id);
    }

    this.setState({ post, loading: false });

    this.getReplies(this.postId);
  }

  async getPostById(id: string) {
    let resp = await getDataFromAO('GetPosts');
    if (!resp) this.setState({ loading: false });

    for (let i = 0; i < resp.length; i++) {
      let data;
      try {
        data = JSON.parse(resp[i]);
        HomePage.service.addPostToCache(data);
        if (data.id == id) return data;
      } catch (error) {
        // console.log(error)
        continue;
      }
    }
  }

  async getReplies(postId: string) {
    let resp = await getDataFromAO('GetReplies');
    if (!resp) this.setState({ loading: false, loading_reply: false });

    let replies = [];
    for (let i = 0; i < resp.length; i++) {
      let data;
      try {
        data = JSON.parse(resp[i]);
        // HomePage.service.addPostToCache(data);
        if (data.postId == postId) replies.push(data);
      } catch (error) {
        // console.log(error)
        continue;
      }
    }

    this.setState({ replies, loading_reply: false });
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

    let data = { id: uuid(), postId: this.state.post.id, address, nickname, post, likes: '0', replies: '0', coins: '0', time: timeOfNow() };
    let response = await messageToAO(data, 'SendReply');

    if (response) {
      this.quillRef.setText('');
      // this.setState({ message: '', alert: 'Reply successful.' });
      this.setState({ message: '' });
      this.getReplies(this.state.post.id);
    }
    else
      this.setState({ message: '', alert: TIP_IMG })
  }

  onAlertClose() {
    this.setState({ alert: '' });
  }

  renderReplies() {
    if (this.state.loading_reply)
      return (<div>Loading...</div>);

    let divs = [];
    let replies = this.state.replies;

    for (let i = replies.length - 1; i >= 0; i--)
      divs.push(<ActivityPost key={i} data={replies[i]} isReply={true} />)

    return divs;
    // return divs.length > 0 ? divs : <div>No post yet.</div>
  }

  onBack() {
    window.history.back();
  }

  render() {
    let date = new Date(this.state.post.time * 1000).toLocaleString();

    return (
      <div className="activity-post-page">
        <div className="activity-post-page-header" onClick={() => this.onBack()}>
          <div className="activity-post-page-back-button"><BsFillArrowLeftCircleFill /></div>
          <div>{this.state.loading ? 'Loading...' : 'Post'}</div>
          {date != 'Invalid Date' && <div className='activity-post-time'>{date}</div>}
        </div>

        {!this.state.loading &&
          <ActivityPost data={this.state.post} isPostPage={true} />
        }

        {/* {!this.state.loading &&
          <div className='mission-page-block-time'><BsClock />{date}</div>
        } */}

        {!this.state.loading && this.state.isLoggedIn &&
          <div className="activity-post-page-reply-container">
            <SharedQuillEditor
              placeholder='Enter reply...'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='activity-post-page-action'>
              <button onClick={() => this.onReply()}>Reply</button>
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
      </div>
    );
  }
}

export default ActivityPostPage;