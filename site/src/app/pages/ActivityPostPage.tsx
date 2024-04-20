import React from 'react';
import './ActivityPostPage.css'
import 'react-quill/dist/quill.snow.css';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import MessageModal from '../modals/MessageModal';
import AlertModal from '../modals/AlertModal';
import { BsFillArrowLeftCircleFill, BsReply } from 'react-icons/bs';
import { subscribe } from '../util/event';
import { checkContent, getDataFromAO, getWalletAddress, isLoggedIn, timeOfNow, messageToAO, uuid, isBookmarked, getDataViaSQLite } from '../util/util';
import { AO_STORY, AO_TWITTER, TIP_IMG } from '../util/consts';
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
  isLoggedIn: string;
  address: string;
  txid: string;
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
    window.scrollTo(0, 0);
    let address = await isLoggedIn();
    this.setState({ isLoggedIn: address, address });

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
    let post = await getDataViaSQLite(AO_STORY, 'GetStories', '0', this.postId);
    console.log("story:", post)
    if (post.length == 0) {
      this.setState({ alert: 'Story not found.' });
      return;
    }

    let isLiked = await getDataViaSQLite(AO_STORY, 'GetLike', '0', this.postId, Server.service.getActiveAddress());
    console.log("isLiked:", isLiked)
    if (isLiked.length > 0) {
      post[0].isLiked = true;
    }

    this.setState({ post: post[0], loading: false });
    this.getReplies();

    let txid = await getDataViaSQLite(AO_STORY, 'GetTxid', '0', this.postId);
    console.log("txid:", txid)
    if (txid.length > 0)
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

    let txid = await this.getTxidOfPost(this.postId);
    this.setState({ txid });
  }

  checkBookmark(post: any) {
    let bookmarks = [];
    let val = localStorage.getItem('bookmarks');
    if (val) bookmarks = JSON.parse(val);

    let resp = isBookmarked(bookmarks, post.id);
    post.isBookmarked = resp;
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

  async getReplies() {
    let replies;
    let type = this.props.type;
    if (type == 'post')
      replies = await getDataFromAO(AO_TWITTER, 'GetReplies', null, null, this.postId);
    else
      replies = await getDataViaSQLite(AO_STORY, 'GetReplies', '0', this.postId);

    console.log("replies:", replies)

    this.setState({
      replies: replies ? replies : [],
      loading_reply: false
    });

    //
    let address = Server.service.getActiveAddress();
    for (let i = 0; i < replies.length; i++) {
      let isLiked = await getDataViaSQLite(AO_STORY, 'GetLike', '0', replies[i].id, address);
      console.log("reply isLiked:", isLiked)
      if (isLiked.length > 0)
        replies[i].isLiked = true;
      this.forceUpdate()
    }
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
      id: uuid(), post_id: this.postId, address, post,
      likes: 0, replies: 0, coins: 0, time: timeOfNow()
    };

    let response = await messageToAO(this.process, data, 'SendReply');

    if (response) {
      this.quillRef.setText('');
      this.state.post.replies += 1;

      if (this.props.type == 'story')
        this.state.replies.unshift(data);
      else
        this.state.replies.push(JSON.stringify(data));

      this.setState({
        message: '',
        replies: this.state.replies,
        post: this.state.post
      });

      // update the amount of replies
      messageToAO(this.process, this.postId, 'UpdateReply');

      // update the txid of this message
      let idInfo = { id: data.id, txid: response };
      messageToAO(this.process, idInfo, 'SendTxid');
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
          data={this.props.type == 'post' ? JSON.parse(replies[i]) : replies[i]}
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

        {!this.state.loading && this.state.isLoggedIn && !this.state.loading_reply &&
          <div className="activity-post-page-reply-container">
            <SharedQuillEditor
              placeholder='Enter reply...'
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