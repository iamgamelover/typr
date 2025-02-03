import React from 'react';
import './HomePage.css';
import { subscribe } from '../util/event';
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import {
  checkContent, getDataFromAO, getWalletAddress, timeOfNow,
  messageToAO, uuid, isBookmarked,
  createArweaveWallet
} from '../util/util';
import ActivityPost from '../elements/ActivityPost';
import { AO_TWITTER, PAGE_SIZE, TIP_CONN, TIP_IMG } from '../util/consts';
import { Server } from '../../server/server';
import Loading from '../elements/Loading';
import PostContent from '../elements/PostContent';

declare var window: any;

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
      isAll: false,
    };

    this.getPosts = this.getPosts.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.atBottom = this.atBottom.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });

    subscribe('new-post', () => {
      this.getPosts(true);
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
    this.getPosts();

    // check the new post every 10 seconds.
    // this.refresh = setInterval(() => this.refreshPosts(), 10000);

    createArweaveWallet();
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
      // console.log("newPosts amt:", newPosts)
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
      if (posts.length < PAGE_SIZE)
        this.setState({ isAll: true })
      else
        this.setState({ isAll: false })
    }

    // console.log("posts:", posts)
    this.checkBookmarks(posts);

    setTimeout(() => {
      window.scrollTo(0, position);
    }, 10);
  }

  async nextPage() {
    this.setState({ loadNextPage: true });

    let offset = this.state.posts.length.toString();
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
    let address = Server.service.getActiveAddress();

    for (let i = 0; i < this.state.posts.length; i++) {
      let data = this.state.posts[i];
      if (data.range === 'everyone' || data.address === address) {
        divs.push(
          <ActivityPost key={uuid()} data={data} />
        )
      }
    }

    return divs;
  }

  postDone() {
    this.getPosts(true);
  }

  render() {
    return (
      <div className="home-page">
        {Server.service.isLoggedIn() &&
          <PostContent onClose={() => this.postDone()} />
        }

        <div className="home-chat-container">
          {this.renderPosts()}
        </div>

        {this.state.newPosts > 0 &&
          <div className='home-page-tip-new-posts' onClick={() => this.showNewPosts()}>
            {this.state.newPosts}&nbsp;&nbsp;New Posts
          </div>
        }

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', color: 'gray' }}>
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