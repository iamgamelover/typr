import React from 'react';
import './HomePage.css';
import { subscribe } from '../util/event';
import { dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import { checkContent, getDataFromAO, getNumOfReplies, msOfNow, timeOfNow, uploadToAO, uuid } from '../util/util';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import { Service } from '../../server/service';
import { TIP_IMG } from '../util/consts';

declare var window: any;

interface HomePageState {
  posts: string[];
  nickname: string;
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  range: string;
}

class HomePage extends React.Component<{}, HomePageState> {

  activeAddress = '';
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
    };

    this.getPosts = this.getPosts.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.start();
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  onRangeChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({ range: element.value });
  }

  async connectWallet(fromConnect: boolean) {
    try {
      // connect to the ArConnect browser extension
      await window.arweaveWallet.connect(
        // request permissions
        ["ACCESS_ADDRESS", "SIGN_TRANSACTION"],
      );
    } catch (error) {
      // this.setState({ alert: 'User canceled the connection.' });
      alert('User canceled the connection.');
      return;
    }

    // obtain the user's wallet address
    const userAddress = await window.arweaveWallet.getActiveAddress();
    if (userAddress) {
      if (fromConnect) alert('You have connected to ArConnect.');
      localStorage.setItem('userAddress', userAddress);
      this.activeAddress = userAddress;
      return userAddress;
    }
  }

  async start() {
    let nickname = localStorage.getItem('nickname');
    let userAddress = localStorage.getItem('userAddress');
    if (nickname) this.setState({ nickname });
    if (userAddress) this.activeAddress = userAddress;
    // console.log("userAddress:", userAddress)

    this.getPosts();
    // const interval = setInterval(this.getPosts, 120000);

    // this.getTokens();
    // await getProcessFromOwner(userAddress)
    // await this.getBalance('Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc')
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

      for (let i = final.length - 1; i >= 0; i--) {
        let num = await getNumOfReplies(final[i].id);
        final[i].replies = num;
      }

      this.setState({ posts: final, loading: false });
      HomePage.service.addPostsToCache(final);
      console.log("caching posts done")
      return;
    }

    this.setState({ posts, loading: false });
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
          activeAddress={this.activeAddress}
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

    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;
    let address = await this.connectWallet(false);
    let nickname = this.state.nickname.trim();
    if (nickname.length > 25) {
      this.setState({ alert: 'Nickname can be up to 25 characters long.' })
      return;
    }

    localStorage.setItem('nickname', nickname);
    if (!nickname) nickname = 'anonymous';

    let data = { id: uuid(), address, nickname, post, range: this.state.range, likes: '0', replies: '0', coins: '0', time: timeOfNow() };
    let response = await uploadToAO(data, 'SendPost');

    if (response) {
      this.quillRef.setText('');
      this.setState({ message: '', alert: 'Post successful.', posts: [], loading: true });
      // this.setState({ message: '' });
      this.getPosts(true);
    }
    else
      this.setState({ message: '', alert: TIP_IMG })
  }

  render() {
    return (
      <div className="testao-page">
        <div style={{ fontSize: 18 }}>This is an AO Twitter for testing</div>

        <div className="testao-nickname-line">
          <button className="testao-connect-button" onClick={() => this.connectWallet(true)}>
            Connect ArConnect
          </button>
          <div>Nickname</div>
          <input
            className="testao-input-message nickname"
            placeholder="nickname"
            value={this.state.nickname}
            onChange={(e) => this.setState({ nickname: e.target.value })}
          />
        </div>

        <div className="testao-input-container">
          <SharedQuillEditor
            placeholder='What is happening?!'
            onChange={this.onContentChange}
            getRef={(ref: any) => this.quillRef = ref}
          />

          <div className='testao-actions'>
            <select
              className="testao-filter"
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

        <div id='scrollableDiv' className="testao-chat-container">
          {this.renderPosts()}
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default HomePage;