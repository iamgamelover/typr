import React from 'react';
import './HomePage.css';
import { subscribe } from '../util/event';
import { createDataItemSigner, message, dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import { checkContent, formatTimestamp, uuid } from '../util/util';
import { getProcessFromOwner } from '../../server/server';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';

declare var window: any;
const AO_TWITTER = "Y4ZXUT9jFoHFg3K2XH5MVFf4_mXKHAcCsqgLta1au2U";

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

    // this.getPosts();
    const interval = setInterval(this.getPosts, 5000);

    // setTimeout(() => {
    //   this.scrollToBottom();
    // }, 5000);

    // this.getTokens();
    // await getProcessFromOwner(userAddress)
    // await this.getBalance('Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc')
  }

  async getBalance(process: string) {
    const result = await dryrun({
      process: 'Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc',
      tags: [
        { name: 'Action', value: 'Balance' },
        // { name: 'Tags', value: `{Target = 'rN1B9kLV3ilqMQSd0bqc-sjrvMXzQkKB-JtfUeUUnl8'}` }
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

  async getPosts() {
    let result;
    try {
      result = await dryrun({
        process: AO_TWITTER,
        tags: [{ name: 'Action', value: 'GetPosts' }],
      });
    } catch (error) {
      this.setState({ alert: 'There is an AO issue.' });
      return;
    }

    if (result.Messages.length == 0) {
      this.setState({ loading: false });
      return;
    }

    // console.log("result:", result)
    // return;
    
    let data = result.Messages[0].Data;
    let posts = data.split("▲");
    // console.log("posts:", posts)

    if (posts.length == 1 && posts[0] == '') {
      this.setState({ loading: false });
      return;
    }

    this.setState({ posts, loading: false });
  }

  renderPosts() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];

    // for (let i = 0; i < this.state.posts.length; i++) {
    for (let i = this.state.posts.length - 1; i >= 0; i--) {
      let data;
      try {
        data = JSON.parse(this.state.posts[i]);
      } catch (error) {
        console.log(error)
        continue;
      }

      // console.log("data:", data)
      divs.push(
        <ActivityPost
          key={i}
          data={data}
          activeAddress={this.activeAddress}
        />
      )
    }

    return divs.length > 0 ? divs : <div>No post yet.</div>
  }

  async uploadToAO(post: string, range: string) {
    let address = await this.connectWallet(false);

    let nickname = this.state.nickname.trim();
    if (nickname.length > 25) {
      this.setState({ alert: 'Nickname can be up to 25 characters long.' })
      return;
    }

    localStorage.setItem('nickname', nickname);
    if (!nickname) nickname = 'anonymous';

    let now = Math.floor(Date.now() / 1000);
    let time = now.toString();

    let data = { id: uuid(), address, nickname, post, range, time };
    // console.log("Post:", data)

    try {
      const messageId = await message({
        process: AO_TWITTER,
        signer: createDataItemSigner(window.arweaveWallet),
        // data: JSON.stringify(data),
        tags: [
          { name: 'Action', value: 'SendPost' },
          // { name: 'Data', value: 'This is a testing post.' }
          { name: 'Data', value: JSON.stringify(data) }
        ],
      });
      console.log("messageId:", messageId)
      return true;
    } catch (error) {
      console.log("error:", error)
      return false;
    }
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
    let response = await this.uploadToAO(post, this.state.range);

    if (response) {
      this.quillRef.setText('');
      this.setState({ message: '', alert: 'Post successful.' });
    }
    else
      this.setState({ message: '', alert: 'Is there a picture in the post? Size just up to 4KB for now.' })
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