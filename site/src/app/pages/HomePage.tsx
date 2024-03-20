import React from 'react';
import './HomePage.css';
import { subscribe } from '../util/event';
import { dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import { checkContent, connectWallet, getDataFromAO, getNumOfReplies, getWalletAddress, isLoggedIn, timeOfNow, messageToAO, uuid } from '../util/util';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import { Service } from '../../server/service';
import { TIP_IMG } from '../util/consts';
import QuestionModal from '../modals/QuestionModal';
import { getProcessFromOwner } from '../../server/server';

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
}

class HomePage extends React.Component<{}, HomePageState> {

  quillRef: any;
  wordCount = 0;

  static service: Service = new Service();

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
    // TODO: register user, store the message id
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
    // console.log("address:", address)
    this.setState({ isLoggedIn: address, address });

    let nickname = localStorage.getItem('nickname');
    if (nickname) this.setState({ nickname });

    this.getPosts();
  }

  async connectWallet() {
    let connected = await connectWallet();
    if (connected) {
      let address = await getWalletAddress();
      this.setState({ isLoggedIn: 'true', address });
      this.register(address);
    }
  }

  // Register one user
  // This is a temp way, need to search varibale Members
  // to keep one, on browser side or AOS side (in lua code)
  async register(address: string) {
    let registered = localStorage.getItem('registered');
    if (!registered) {
      let data = { address, nickname: this.state.nickname, avatar: '', time: timeOfNow() };
      let resp = await messageToAO(data, 'Register');
      // console.log("register:", resp)
      if (resp) localStorage.setItem('registered', 'Yes');
    }
  }

  async disconnectWallet() {
    await window.arweaveWallet.disconnect();
    this.setState({ isLoggedIn: '', address: '', question: '' });
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

  async getPosts(new_post?: boolean) {
    let posts = HomePage.service.getPostsFromCache();
    // console.log("cached posts:", posts)

    if (!posts || new_post) {
      posts = await getDataFromAO('GetPosts');
      if (!posts) {
        this.setState({ loading: false });
        return;
      }

      let final = [];
      for (let i = posts.length - 1; i >= 0; i--) {
        let data;
        try {
          data = JSON.parse(posts[i]);
          HomePage.service.addPostToCache(data);
        } catch (error) {
          // console.log(error)
          continue;
        }

        final.push(data)
      }

      // for (let i = final.length - 1; i >= 0; i--) {
      //   let num = await getNumOfReplies(final[i].id);
      //   final[i].replies = num;
      // }

      this.setState({ posts: final, loading: false });
      HomePage.service.addPostsToCache(final);
      console.log("caching posts done")

      setTimeout(() => {
        this.renderNumOfReplies();
      }, 500);

      return;
    }

    this.setState({ posts, loading: false });
  }

  async renderNumOfReplies() {
    let posts = this.state.posts;
    for (let i = 0; i < posts.length; i++) {
      let num = await getNumOfReplies(posts[i].id);
      posts[i].replies = num;
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

  scrollToBottom() {
    var scrollableDiv = document.getElementById("scrollableDiv");
    if (scrollableDiv) {
      scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
    } else {
      console.error("Element with id 'scrollableDiv' not found.");
    }
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

    let data = { id: uuid(), address, nickname, post, range: this.state.range, likes: '0', replies: '0', coins: '0', time: timeOfNow() };
    let response = await messageToAO(data, 'SendPost');

    if (response) {
      this.quillRef.setText('');
      this.setState({ message: '', alert: 'Post successful.', posts: [], loading: true });
      this.getPosts(true);
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

              <button onClick={() => this.onPost()}>Post</button>
            </div>
          </div>
        }

        <div id='scrollableDiv' className="home-chat-container">
          {this.renderPosts()}
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    )
  }
}

export default HomePage;