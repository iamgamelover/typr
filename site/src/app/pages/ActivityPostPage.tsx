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
  timeOfNow, messageToAO, uuid, isBookmarked,
  getFirstLine
} from '../util/util';
import { AO_STORY, AO_TWITTER, PAGE_SIZE, TIP_CONN, TIP_IMG } from '../util/consts';
import { Server } from '../../server/server';
import QuestionModal from '../modals/QuestionModal';
import Loading from '../elements/Loading';
import parse from 'html-react-parser';

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
  // address: string;
  txid: string;
  loadNextPage: boolean;
  isAll: boolean;
  poll_options: any;
}

class ActivityPostPage extends React.Component<ActivityPostPageProps, ActivityPostPageState> {

  quillRef: any;
  wordCount = 0;
  postId: string;
  process: string;
  address: string;
  votedOptionId: string;

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
      // address: '',
      txid: '',
      loadNextPage: false,
      isAll: false,
      poll_options: ''
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

    if (scrollTop + clientHeight >= scrollHeight)
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
    this.address = await isLoggedIn();
    // this.setState({ address });

    let type = this.props.type;
    let path = window.location.hash.slice(1);
    if (type == 'post') {
      this.postId = path.substring(6);
      this.process = AO_TWITTER;
      this.getPost();
    }
    else if (type == 'story') {
      this.postId = path.substring(7);
      this.process = AO_STORY;
      this.getStory();
    }
  }

  voteDone() {
    this.setState({ message: 'Voting...' });
    this.getStory()
  }

  async getStory() {
    let post = await getDataFromAO(this.process, 'GetStories', { id: this.postId });
    // console.log("post:", post)
    if (post.length == 0) {
      this.setState({ alert: 'Story not found.' });
      return;
    }

    // let data = { id: this.postId, address: this.state.address }
    let data = { id: this.postId, address: this.address }
    let isLiked = await getDataFromAO(this.process, 'GetLike', data);
    if (isLiked.length > 0) {
      post[0].isLiked = true;
    }

    await this.getPollOptions(post);

    this.setState({ post: post[0], loading: false, message: '' });
    this.getReplies();

    let txid = await getDataFromAO(this.process, 'GetTxid', { id: this.postId });
    this.setState({ txid: txid[0].txid });
  }

  async getPollOptions(post: any) {
    if (post[0].option_count > 0) {
      let story_id = { id: this.postId };
      let poll_options = await getDataFromAO(this.process, 'GetPollOptions', story_id);
      // console.log("pollOptions:", poll_options);
      this.setState({ poll_options });

      // get voting
      for (let i = 0; i < poll_options.length; i++) {
        let data = {
          option_id: poll_options[i].option_id,
          address: this.address
        };
        // console.log("get vote data:", data);
        let response = await getDataFromAO(AO_STORY, 'GetVotes', data);
        if (response.length > 0) {
          this.votedOptionId = data.option_id;
          break;
        }
      }
    }
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

    // console.log("post page:", post)
    let address = Server.service.getActiveAddress();

    if (post.range === 'everyone' || post.address === address) {
      this.setState({ post, loading: false });
      this.getReplies();
      let txid = await getDataFromAO(AO_TWITTER, 'GetTxid', { id: this.postId });
      this.setState({ txid: txid[0].txid });
    }
    else {
      this.setState({ alert: 'This is a private post.' });
    }
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
      this.setState({ alert: TIP_CONN });
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
      await this.getReplies();
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

    // About the story title - compatible the previous version
    let title;
    let post = this.state.post.post;
    if (post) {
      title = this.state.post.title;
      if (!title) {
        title = getFirstLine(post);
        if (!title) title = 'A Fine Stroy!';
      }
    }

    return (
      <div className="activity-post-page">
        <div className="activity-post-page-header" onClick={() => this.onBack()}>
          <div className="activity-post-page-back-button"><BsFillArrowLeftCircleFill /></div>
          <div>
            {this.state.loading ? 'Loading...' :
              this.props.type == 'post' ? 'Post' :
                <div className="activity-post-page-story-title">
                  {parse(title)}
                </div>
            }
          </div>
          {this.props.type == 'post' && date != 'Invalid Date' && <div className='activity-post-time'>&#x2022;&nbsp;&nbsp;{date}</div>}
        </div>

        {!this.state.loading &&
          <ActivityPost
            data={this.state.post}
            isPostPage={true}
            isStory={this.props.type == 'story' && true}
            txid={this.state.txid}
            pollOptions={this.state.poll_options}
            votedOptionId={this.votedOptionId}
            voteDone={() => this.voteDone()}
          />
        }

        {/* {!this.state.loading && this.state.address && !this.state.loading_reply && */}
        {!this.state.loading && this.address && !this.state.loading_reply &&
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