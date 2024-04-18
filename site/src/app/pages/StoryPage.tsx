import React from 'react';
import './StoryPage.css';
import StoryCard from '../elements/StoryCard';
import { AiOutlineFire } from 'react-icons/ai';
import PostModal from '../modals/PostModal';
import { getDataViaSQLite } from '../util/util';
import { AO_STORY, PAGE_SIZE } from '../util/consts';
import Loading from '../elements/Loading';

declare var window: any;

interface StoryPageState {
  posts: any;
  nickname: string;
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  loadNextPage: boolean;
  range: string;
  isLoggedIn: string;
  address: string;
  process: string;
  open: boolean;
  isAll: boolean;
}

class StoryPage extends React.Component<{}, StoryPageState> {

  filterSelected = 0;

  constructor(props: {}) {
    super(props);
    this.state = {
      posts: [],
      nickname: '',
      question: '',
      alert: '',
      message: '',
      loading: true,
      loadNextPage: false,
      range: 'everyone',
      isLoggedIn: '',
      address: '',
      process: '',
      open: false,
      isAll: false
    };


    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.atBottom = this.atBottom.bind(this);

    // subscribe('wallet-events', () => {
    //   this.forceUpdate();
    // });
  }

  componentDidMount() {
    // this.start();
    this.getStory();
    window.addEventListener('scroll', this.atBottom);
  }

  componentWillUnmount(): void {
    // clearInterval(this.refresh);
    window.removeEventListener('scroll', this.atBottom);
    // Server.service.addPositionToCache(window.pageYOffset);
  }

  atBottom() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight + 300 >= scrollHeight) {
      setTimeout(() => {
        if (!this.state.loading && !this.state.loadNextPage && !this.state.isAll)
          this.nextPage();
      }, 200);
    }
  }

  onOpen() {
    this.setState({ open: true });
  }

  onClose(data: any) {
    console.log("onClose:", data)
    this.setState({ open: false });
    if (data) {
      this.getStory();
      this.setState({ posts: [], loading: true, isAll: false });
    }
  }

  // async start() {
  //   await this.getStory();
  // }

  async getStory() {
    let posts = await getDataViaSQLite(AO_STORY, 'GetStories', '0');
    console.log("stories:", posts)

    if (posts.length < PAGE_SIZE)
      this.setState({ isAll: true })

    this.setState({ posts, loading: false });
  }

  async nextPage() {
    this.setState({ loadNextPage: true });

    let offset = this.state.posts.length.toString();
    console.log("offset:", offset)

    let posts = await getDataViaSQLite(AO_STORY, 'GetStories', offset);
    console.log("stories:", posts)
    if (posts.length < PAGE_SIZE)
      this.setState({ isAll: true })

    let total = this.state.posts.concat(posts);

    // Server.service.addPostsToCache(posts);
    this.setState({ posts: total, loadNextPage: false });
  }

  renderStories() {
    if (this.state.loading) return (<Loading />);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++) {
      divs.push(
        <StoryCard key={i} data={this.state.posts[i]} />
      )
    }

    return divs.length > 0 ? divs : <div>No story yet.</div>
  }

  onFilter(index: number) {
    if (this.filterSelected === index) return;

    this.filterSelected = index;
    this.renderFilters();
    this.forceUpdate()

    // if (index === 0) { // Activity
    //   this.setState({ posts: [] });
    //   // setTimeout(() => {
    //   //   this.getPosts(this.author);
    //   // }, 10);
    // }
    // else if (index === 1) { // Activity
    //   this.setState({ posts: [] });
    //   // setTimeout(() => {
    //   //   this.getPosts(this.author);
    //   // }, 10);
    // }
  }

  renderFilters() {
    let filters = ['Top Story', 'All New'];

    let divs = [];
    for (let i = 0; i < filters.length; i++) {
      divs.push(
        <div
          className={`story-page-filter ${this.filterSelected == i ? 'selected' : ''}`}
          onClick={() => this.onFilter(i)} key={i}
        >
          {filters[i]}
        </div>
      );
    }

    return divs;
  }

  render() {
    let data = {
      id: 1, publisher: 'ZC', time: '12',
      title: 'A Journey of Train Station Stamp at Tokyo, Japan.'
    }

    return (
      <div className='story-page'>
        <div className='story-page-header'>
          <div className='story-page-title'>Stories</div>
          <div className="app-icon-button fire-color" onClick={this.onOpen}>
            <AiOutlineFire size={20} />New Story
          </div>

          {/* <div className="app-icon-button" onClick={()=>this.getStory()}>
            <AiOutlineFire size={20} />Test Get
          </div> */}
        </div>

        <div className='story-page-filter-row'>
          <div className='story-page-filter-container'>
            {this.renderFilters()}
          </div>

          <select
            className="story-page-category"
            // value={this.state.category}
            // onChange={this.onCategoryChange}
          >
            <option value="travel">Travel</option>
            <option value="travel">Learn</option>
            <option value="normal">Fiction</option>
            <option value="music">Music</option>
            <option value="sports">Sports</option>
            <option value="movies">Movies</option>
          </select>
        </div>

        {this.renderStories()}

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', fontSize: '18px', color: 'gray' }}>
            No more post.
          </div>
        }

        {/* <div className='story-intro-line'>
          Once a post receives enough support. <br/>
          It becomes a featured story. <br/>
          And the author will earn rewards. <br/>
          This will inspire the author to write better stories.
        </div> */}

        {/* <div className='story-intro-line game'>
          This is a platform where amazing stories can be showcased. 
        </div> */}

        <PostModal isStory={true} open={this.state.open} onClose={this.onClose} />
      </div>
    )
  }
}

export default StoryPage;