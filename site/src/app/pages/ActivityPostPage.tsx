import React from 'react';
import './ActivityPostPage.css'
import 'react-quill/dist/quill.snow.css';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { BsFillArrowLeftCircleFill, BsReply } from 'react-icons/bs';
import { subscribe } from '../util/event';
import {
  checkContent, getDataFromAO, getWalletAddress, isLoggedIn,
  timeOfNow, messageToAO, uuid, isBookmarked
} from '../util/util';
import { AO_STORY, AO_TWITTER, PAGE_SIZE, TIP_IMG } from '../util/consts';
import { Server } from '../../server/server';
import QuestionModal from '../modals/QuestionModal';
import Loading from '../elements/Loading';

interface ActivityPostPageProps {
  type: string;
}

interface ActivityPostPageState {
  post: any;
  replies: any;
  message: string;
  alert: string;
  question: string;
  loading: boolean;
  loading_reply: boolean;
  address: string;
  txid: string;
  loadNextPage: boolean;
  isAll: boolean;
}

class ActivityPostPage extends React.Component<ActivityPostPageProps, ActivityPostPageState> {

  quillRef: any;
  wordCount = 0;
  postId: string;
  process: string;

  constructor(props: ActivityPostPageProps) {
    super(props);
    this.state = {
      post: '',
      replies: '',
      message: '',
      alert: '',
      question: '',
      loading: true,
      loading_reply: true,
      address: '',
      txid: '',
      loadNextPage: false,
      isAll: false,
    };

    this.onContentChange = this.onContentChange.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);
    this.atBottom = this.atBottom.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  componentDidMount() {
    this.start();
    window.addEventListener('scroll', this.atBottom);
  }

  componentWillUnmount(): void {
    window.removeEventListener('scroll', this.atBottom);
  }

  atBottom() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight + 300 >= scrollHeight)
      setTimeout(() => {
        if (!this.state.loading && !this.state.loadNextPage && !this.state.isAll)
          this.nextPage();
      }, 200);
  }

  onQuestionYes() {
    this.setState({ question: '' });
  }

  onQuestionNo() {
    this.setState({ question: '' });
  }

  async start() {
    window.scrollTo(0, 0);
    let address = await isLoggedIn();
    this.setState({ address });

    let type = this.props.type;
    if (type == 'post') {
      this.postId = window.location.pathname.substring(6);
      this.process = AO_TWITTER;
      this.getPost();
    }
    else if (type == 'story') {
      this.postId = window.location.pathname.substring(7);
      this.process = AO_STORY;
      this.getStory();
    }
  }

  async getStory() {
    let post = await getDataFromAO(this.process, 'GetStories', { id: this.postId });
    console.log("story:", post)
    if (post.length == 0) {
      this.setState({ alert: 'Story not found.' });
      return;
    }

    let data = { id: this.postId, address: this.state.address }
    let isLiked = await getDataFromAO(this.process, 'GetLike', data);
    if (isLiked.length > 0) {
      post[0].isLiked = true;
    }

    this.setState({ post: post[0], loading: false });
    this.getReplies();

    let txid = await getDataFromAO(this.process, 'GetTxid', { id: this.postId });
    this.setState({ txid: txid[0].txid });
  }

  async getPost() {
    let post = Server.service.getPostFromCache(this.postId);

    if (!post) {
      post = await this.getPostById(this.postId)
      if (!post) {
        this.setState({ alert: 'Post not found.' });
        return;
      }

      this.checkBookmark(post);
    }

    this.setState({ post, loading: false });
    this.getReplies();

    let txid = await getDataFromAO(AO_TWITTER, 'GetTxid', { id: this.postId });
    this.setState({ txid: txid[0].txid });
  }

  checkBookmark(post: any) {
    let bookmarks = [];
    let val = localStorage.getItem('bookmarks');
    if (val) bookmarks = JSON.parse(val);

    let resp = isBookmarked(bookmarks, post.id);
    post.isBookmarked = resp;
  }

  async getPostById(id: string) {
    let resp = await getDataFromAO(AO_TWITTER, 'GetPosts', { id });
    if (resp.length == 0) return;

    Server.service.addPostToCache(resp[0]);
    return resp[0];
  }

  async getReplies() {
    let data = { post_id: this.postId, offset: 0 };
    let replies = await getDataFromAO(this.process, 'GetReplies', data);

    this.setState({ replies, loading_reply: false });

    // for story page
    if (this.props.type == 'story') {
      let address = Server.service.getActiveAddress();
      for (let i = 0; i < replies.length; i++) {
        let data = { id: replies[i].id, address };
        let isLiked = await getDataFromAO(AO_STORY, 'GetLike', data);
        if (isLiked.length > 0)
          replies[i].isLiked = true;
        this.forceUpdate();
      }
    }
  }

  async nextPage() {
    this.setState({ loadNextPage: true });

    let offset = this.state.replies.length.toString();
    let data = { post_id: this.postId, offset };
    let replies = await getDataFromAO(this.process, 'GetReplies', data);

    if (replies.length < PAGE_SIZE)
      this.setState({ isAll: true })
    // else
    //   this.setState({ isAll: false })

    let total = this.state.replies.concat(replies);
    this.setState({ replies: total, loadNextPage: false });
  }

  async onReply() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    let address = await getWalletAddress();
    if (!address) {
      this.setState({ alert: 'You should connect to wallet first.' });
      return;
    }

    this.setState({ message: 'Replying...' });

    let post = this.quillRef.root.innerHTML;
    let data = {
      id: uuid(), post_id: this.postId, address, post,
      likes: 0, replies: 0, coins: 0, time: timeOfNow()
    };

    let response = await messageToAO(this.process, data, 'SendReply');

    if (response) {
      this.quillRef.setText('');
      this.state.post.replies += 1;

      // will works after cache the profile
      // this.state.replies.unshift(data);
      this.getReplies();
      this.setState({
        message: '',
        // replies: this.state.replies,
        post: this.state.post,
        isAll: false,
        // loading_reply: true
      });

      // update the amount of replies
      messageToAO(this.process, this.postId, 'UpdateReply');

      // store the txid of this message
      let txid = { id: data.id, txid: response };
      messageToAO(this.process, txid, 'SendTxid');
    }
    else
      this.setState({ message: '', alert: TIP_IMG })
  }

  onAlertClose() {
    this.setState({ alert: '' });
  }

  renderReplies() {
    if (this.state.loading_reply) return (<Loading />);

    let divs = [];
    let replies = this.state.replies;

    for (let i = 0; i < replies.length; i++)
      divs.push(
        <ActivityPost
          key={uuid()}
          data={replies[i]}
          isReply={true}
        />
      )

    return divs;
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
          <div>
            {this.state.loading ? 'Loading...' :
              this.props.type == 'post' ? 'Post' : 'Story'}
          </div>
          {date != 'Invalid Date' && <div className='activity-post-time'>&#x2022;&nbsp;&nbsp;{date}</div>}
        </div>

        {!this.state.loading &&
          <ActivityPost data={this.state.post} isPostPage={true} txid={this.state.txid} />
        }

        {!this.state.loading && this.state.address && !this.state.loading_reply &&
          <div className="activity-post-page-reply-container">
            <SharedQuillEditor
              placeholder='Post your reply'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='activity-post-page-action'>
              <div className="app-icon-button" onClick={() => this.onReply()}>
                <BsReply size={20} />Reply
              </div>
            </div>
          </div>
        }

        {!this.state.loading && !this.state.loading_reply &&
          <div className='activity-post-page-reply-header'>
            {this.state.post.replies} Replies
          </div>
        }

        {!this.state.loading &&
          this.renderReplies()
        }

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', color: 'gray' }}>
            No more replies.
          </div>
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.onAlertClose()} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    );
  }
}

export default ActivityPostPage;