import React from 'react';
import './HomePage.css';
import { subscribe } from '../util/event';
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import {
  checkContent, getDataFromAO, getWalletAddress, timeOfNow,
  messageToAO, uuid, isBookmarked, storePostInLocal
} from '../util/util';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import ActivityPost from '../elements/ActivityPost';
import { AO_TWITTER, PAGE_SIZE, TIP_IMG } from '../util/consts';
import { Server } from '../../server/server';
import { BsSend } from 'react-icons/bs';
import Loading from '../elements/Loading';

interface HomePageState {
  posts: any;
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  loadNextPage: boolean;
  range: string;
  process: string;
  newPosts: number;
  temp_tip: boolean;
  isAll: boolean;
}

class HomePage extends React.Component<{}, HomePageState> {

  quillRef: any;
  wordCount = 0;
  refresh: any;

  constructor(props: {}) {
    super(props);
    this.state = {
      posts: [],
      question: '',
      alert: '',
      message: '',
      loading: true,
      loadNextPage: false,
      range: 'everyone',
      process: '',
      newPosts: 0,
      temp_tip: false,
      isAll: false,
    };

    this.getPosts = this.getPosts.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.atBottom = this.atBottom.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.start();
    window.addEventListener('scroll', this.atBottom);
  }

  componentWillUnmount(): void {
    // clearInterval(this.refresh);
    window.removeEventListener('scroll', this.atBottom);
    Server.service.addPositionToCache(window.pageYOffset);
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

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

  onRangeChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({ range: element.value });
  }

  async start() {
    await this.getPosts();

    // check the new post every 10 seconds.
    // this.refresh = setInterval(() => this.refreshPosts(), 10000);
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
    let posts_amt = localStorage.getItem('posts_amt');
    if (posts_amt) {
      let posts = await getDataFromAO(AO_TWITTER, 'GetPosts', { id: '0' });
      let newPosts = posts.length - Number(posts_amt);
      localStorage.setItem('posts_amt', posts.length.toString());
      console.log("newPosts amt:", newPosts)
      if (newPosts > 0)
        this.setState({ newPosts });
    }
  }

  async showNewPosts() {
    // let posts = await getDataFromAO(AO_TWITTER, 'GetPosts', null);
    // // let final = parsePosts(posts);
    // // let total = final.concat(this.state.posts);
    // this.setState({ posts: [] });

    // setTimeout(() => {
    //   window.scrollTo(0, 0);
    //   this.setState({ posts: total, newPosts: 0 });
    //   Server.service.addPostsToCache(total);
    // }, 10);
  }

  async getPosts(new_post?: boolean) {
    let posts = Server.service.getPostsFromCache();
    let position = Server.service.getPositionFromCache();
    
    if (!posts || new_post) {
      posts = await getDataFromAO(AO_TWITTER, 'GetPosts', { offset: 0 });
      console.log("posts:", posts)
      if (posts.length < PAGE_SIZE)
        this.setState({ isAll: true })
    }

    this.checkBookmarks(posts);

    setTimeout(() => {
      window.scrollTo(0, position);
    }, 10);
  }

  async nextPage() {
    this.setState({ loadNextPage: true });

    let offset = this.state.posts.length.toString();
    console.log("offset:", offset)

    let posts = await getDataFromAO(AO_TWITTER, 'GetPosts', { offset });

    if (posts.length < PAGE_SIZE)
      this.setState({ isAll: true })

    let total = this.state.posts.concat(posts);
    this.checkBookmarks(total);
  }

  checkBookmarks(posts: any) {
    let bookmarks = [];
    let val = localStorage.getItem('bookmarks');
    if (val) bookmarks = JSON.parse(val);

    for (let i = 0; i < posts.length; i++) {
      let resp = isBookmarked(bookmarks, posts[i].id);
      posts[i].isBookmarked = resp;
    }

    Server.service.addPostsToCache(posts);
    this.setState({ posts, loading: false, loadNextPage: false });
  }

  renderPosts() {
    if (this.state.loading) return (<Loading />);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++) {
      divs.push(
        <ActivityPost
          key={i}
          data={this.state.posts[i]}
        />
      )
    }

    return divs
  }

  async onPost() {
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

    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;

    let data = {
      id: uuid(), address, post, range: this.state.range,
      likes: 0, replies: 0, coins: 0, time: timeOfNow()
    };

    let response = await messageToAO(AO_TWITTER, data, 'SendPost');

    if (response) {
      this.quillRef.setText('');
      // this.setState({ message: '', alert: 'Post successful.', posts: [], loading: true });
      this.setState({ message: ''});
      this.getPosts(true);
      storePostInLocal(data);

      // store the txid of a post. 
      let txid = { id: data.id, txid: response };
      messageToAO(AO_TWITTER, txid, 'SendTxid');
    }
    else
      this.setState({ message: '', alert: TIP_IMG });
  }

  render() {
    return (
      <div className="home-page">
        {Server.service.getIsLoggedIn() &&
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

              <div className="app-icon-button" onClick={() => this.onPost()}>
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

        {/* For testing - Will be removed */}
        {this.state.temp_tip &&
          <div className='home-page-temp-tip'>
            <div style={{ color: 'yellow' }}>MAKE SURE TO GET YOUR PROCESS:</div>
            <div>Your process id is:</div>
            <div style={{ color: 'yellow' }}>{this.state.process}</div>
            <div>Try to run "aos PROCESS_ID_ABOVE --wallet PATH_WALLET_KEY.json".</div>
            <div>And see the handlers via "Handlers.list" in a termianl.</div>
            <button style={{ width: '150px' }} onClick={() => this.setState({ temp_tip: false })}>Close</button>
          </div>
        }

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', fontSize: '18px', color: 'gray' }}>
            No more posts.
          </div>
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default HomePage;