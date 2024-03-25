import React from 'react';
import './HomePage.css';
import { publish, subscribe } from '../util/event';
import { dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import { checkContent, connectWallet, getDataFromAO, getNumOfReplies, getWalletAddress, isLoggedIn, timeOfNow, messageToAO, uuid, getDefaultProcess, spawnProcess, evaluate, isBookmarked } from '../util/util';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import { AO_TWITTER, LUA, TIP_IMG } from '../util/consts';
import QuestionModal from '../modals/QuestionModal';
import { Server } from '../../server/server';
import { BsSend } from 'react-icons/bs';

declare var window: any;

interface HomePageState {
  posts: any;
  nickname: string;
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  range: string;
  isLoggedIn: string;
  address: string;
  newPosts: number;
}

class HomePage extends React.Component<{}, HomePageState> {

  quillRef: any;
  wordCount = 0;
  refresh: any;
  newPosts: any;

  constructor(props: {}) {
    super(props);
    this.state = {
      posts: [],
      nickname: '',
      question: '',
      alert: '',
      message: '',
      loading: true,
      range: 'everyone',
      isLoggedIn: '',
      address: '',
      newPosts: 0,
    };

    this.getPosts = this.getPosts.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount(): void {
    Server.service.addPositionToCache(window.pageYOffset);
    clearInterval(this.refresh);
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  onRangeChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({ range: element.value });
  }

  async start() {
    let address = await isLoggedIn();
    this.setState({ isLoggedIn: address, address });

    let nickname = localStorage.getItem('nickname');
    if (nickname) this.setState({ nickname });

    await this.getPosts();
    this.refresh = setInterval(() => this.refreshPosts(), 10000); // 10 seconds
  }

  async connectWallet() {
    let connected = await connectWallet();
    if (connected) {
      let address = await getWalletAddress();
      this.setState({ isLoggedIn: 'true', address });
      this.register(address);

      // for testing
      Server.service.setIsLoggedIn(address);
      Server.service.setActiveAddress(address);
      publish('wallet-events');

      // for testing - load lua code into the process of users
      let process = await getDefaultProcess(address);

      // Spawn a new process
      if (!process) {
        let processId = await spawnProcess(LUA);
        console.log("Spawn --> processId:", processId)
      }

      // load lua
      let messageId = await evaluate(process, LUA);
      // console.log("evaluate -->", messageId)
    }
  }

  // Register one user
  // This is a temp way, need to search varibale Members
  // to keep one, on browser side or AOS side (in lua code)
  register(address: string) {
    let data = { address, nickname: this.state.nickname, avatar: '', time: timeOfNow() };
    messageToAO(AO_TWITTER, JSON.stringify(data), 'Register');
  }

  async disconnectWallet() {
    await window.arweaveWallet.disconnect();
    this.setState({ isLoggedIn: '', address: '', question: '' });

    // for testing
    Server.service.setIsLoggedIn('');
    Server.service.setActiveAddress('');
    publish('wallet-events');
  }

  onQuestionYes() {
    this.disconnectWallet();
  }

  onQuestionNo() {
    this.setState({ question: '' });
  }

  async getBalance(process: string) {
    const result = await dryrun({
      process: 'Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc',
      tags: [
        { name: 'Action', value: 'Balance' },
        { name: 'Target', value: 'rN1B9kLV3ilqMQSd0bqc-sjrvMXzQkKB-JtfUeUUnl8' }
      ],
    });

    console.log("getBalance:", result)
  }

  async getTokens() {
    // the ID of the token
    const tokenID = "rN1B9kLV3ilqMQSd0bqc-sjrvMXzQkKB-JtfUeUUnl8";

    // check if the token has been added
    // const isAdded = await window.arweaveWallet.isTokenAdded(tokenID);
    // console.log("isAdded:", isAdded)

    // add token if it hasn't been added yet
    // if (!isAdded) {
    //   await window.arweaveWallet.addToken(tokenID);
    // }
  }

  async refreshPosts() {
    this.newPosts = await getDataFromAO(AO_TWITTER, 'GetPosts');
    let posts_amt = localStorage.getItem('posts_amt');
    let newPosts = this.newPosts.length - Number(posts_amt);
    console.log("newPosts amt:", newPosts)
    if (newPosts > 0)
      this.setState({ newPosts });
  }

  showNewPosts() {
    let posts = this.parsePosts(this.newPosts);
    this.setState({ posts: [] });

    setTimeout(() => {
      window.scrollTo(0, 0);
      this.setState({ posts, newPosts: 0 });
      Server.service.addPostsToCache(posts);
      localStorage.setItem('posts_amt', posts.length.toString());
    }, 10);
  }

  parsePosts(posts: any) {
    let result = [];
    for (let i = posts.length - 1; i >= 0; i--) {
      let data;
      try {
        data = JSON.parse(posts[i]);
        Server.service.addPostToCache(data);
      } catch (error) {
        // console.log(error)
        continue;
      }

      result.push(data)
    }

    return result;
  }

  async getPosts(new_post?: boolean) {
    let posts = Server.service.getPostsFromCache();
    let position = Server.service.getPositionFromCache();

    // console.log("cached posts:", posts)

    if (!posts || new_post) {
      posts = await getDataFromAO(AO_TWITTER, 'GetPosts');
      if (!posts) {
        this.setState({ loading: false });
        return;
      }

      let final = this.parsePosts(posts);
      this.setState({ posts: final, loading: false });
      Server.service.addPostsToCache(final);
      localStorage.setItem('posts_amt', final.length.toString());
      console.log("caching posts done")

      setTimeout(() => {
        this.renderNumOfReplies();
      }, 500);

      return;
    }

    this.setState({ posts, loading: false });
    setTimeout(() => {
      window.scrollTo(0, position);
    }, 10);
  }

  async renderNumOfReplies() {
    // to check the state of bookmark
    let process = await getDefaultProcess(this.state.address);
    let bookmarks = await getDataFromAO(process, 'AOTwitter.getBookmarks');

    let posts = this.state.posts;
    for (let i = 0; i < posts.length; i++) {
      let num = await getNumOfReplies(posts[i].id);
      posts[i].replies = num;
      
      let resp = isBookmarked(bookmarks, posts[i].id);
      posts[i].isBookmarked = resp;

      this.setState({ posts });
    }
  }

  renderPosts() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    // for (let i = this.state.posts.length - 1; i >= 0; i--) {
    for (let i = 0; i < this.state.posts.length; i++) {
      divs.push(
        <ActivityPost
          key={i}
          data={this.state.posts[i]}
        />
      )
    }

    return divs.length > 0 ? divs : <div>No post yet.</div>
  }

  async onPost() {
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

    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;
    let nickname = this.state.nickname.trim();
    if (nickname.length > 25) {
      this.setState({ alert: 'Nickname can be up to 25 characters long.' })
      return;
    }

    localStorage.setItem('nickname', nickname);
    if (!nickname) nickname = 'anonymous';
    let time = timeOfNow();
    let postId = uuid();

    let data = {
      id: postId, address, nickname, post, range: this.state.range,
      likes: '0', replies: '0', coins: '0', time
    };

    let response = await messageToAO(AO_TWITTER, JSON.stringify(data), 'SendPost');

    if (response) {
      this.quillRef.setText('');
      this.setState({ message: '', alert: 'Post successful.', posts: [], loading: true });
      this.getPosts(true);

      // This code store the post id. 
      // When loading huge data is very slow, 
      // just load post id and download content of a post from arweave.
      let data = { address, postId, txid: response, time };
      messageToAO(AO_TWITTER, JSON.stringify(data), 'SendPostID');
    }
    else
      this.setState({ message: '', alert: TIP_IMG });
  }

  render() {
    let address = this.state.address;
    if (this.state.isLoggedIn)
      address = address.substring(0, 6) + ' ... ' + address.substring(address.length - 6);

    return (
      <div className="home-page">
        <div className="home-nickname-line">
          {this.state.isLoggedIn
            ?
            <button className="home-connect-button connected" onClick={() => this.setState({ question: 'Disconnect?' })}>
              {address}
            </button>
            :
            <button className="home-connect-button" onClick={() => this.connectWallet()}>
              Connect ArConnect
            </button>
          }

          <div>Nickname</div>
          <input
            className="home-input-message nickname"
            placeholder="nickname"
            value={this.state.nickname}
            onChange={(e) => this.setState({ nickname: e.target.value })}
          />
        </div>

        {this.state.isLoggedIn &&
          <div className="home-input-container">
            <SharedQuillEditor
              placeholder='What is happening?!'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='home-actions'>
              <select
                className="home-filter"
                value={this.state.range}
                onChange={this.onRangeChange}
              >
                <option value="everyone">Everyone</option>
                <option value="following">Following</option>
                <option value="private">Private</option>
              </select>

              {/* <button onClick={() => this.onPost()}>Post</button> */}
              <div className="app-post-button story post reply" onClick={() => this.onPost()}>
                <BsSend size={20} />
                <div>Post</div>
              </div>
            </div>
          </div>
        }

        <div className="home-chat-container">
          {this.renderPosts()}
        </div>

        {this.state.newPosts > 0 &&
          <div className='home-page-tip-new-posts' onClick={() => this.showNewPosts()}>
            {this.state.newPosts}&nbsp;&nbsp;New Posts
          </div>
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    )
  }
}

export default HomePage;