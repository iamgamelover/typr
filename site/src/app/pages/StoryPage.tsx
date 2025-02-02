import React from 'react';
import './StoryPage.css';
import StoryCard from '../elements/StoryCard';
import { AiOutlineFire } from 'react-icons/ai';
import { getDataFromAO, messageToAO, uuid, wait } from '../util/util';
import { AO_STORY, PAGE_SIZE } from '../util/consts';
import Loading from '../elements/Loading';
import { Server } from '../../server/server';
import PostModal from '../modals/PostModal';

declare var window: any;

interface StoryPageState {
  posts: any;
  loading: boolean;
  loadNextPage: boolean;
  open: boolean;
  isAll: boolean;
  category: string;
}

class StoryPage extends React.Component<{}, StoryPageState> {

  filterSelected = 0;

  constructor(props: {}) {
    super(props);
    this.state = {
      posts: [],
      loading: true,
      loadNextPage: false,
      open: false,
      isAll: false,
      category: 'project',
    };

    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.atBottom = this.atBottom.bind(this);
    this.onCategoryChange = this.onCategoryChange.bind(this);

    // subscribe('wallet-events', () => {
    //   this.forceUpdate();
    // });
  }

  componentDidMount() {
    let tab = Server.service.getStoryTab();
    this.onFilter(tab, true);
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

  onCategoryChange(e: any) {
    let category = e.currentTarget.value;
    this.setState({ category });
    if (category == 'all')
      category = null;
    this.getStory(category);
  };

  onOpen() {
    // TEMP
    // messageToAO(AO_STORY, {}, 'AlterTable');
    // messageToAO(AO_STORY, '40b17e5a-c36a-409d-8fa6-c3085f8190fb', 'UpdateRecord');
    // return

    this.setState({ open: true });
  }

  onClose(data: any) {
    this.setState({ open: false });
    if (data) {
      this.filterSelected = 2; // All New tab
      Server.service.setStoryTab(2);
      this.getStory();
      this.setState({ isAll: false });
    }
  }

  async getStory(category?: string) {
    this.setState({ loading: true, isAll: false });

    let data = { category, offset: 0 };
    let posts = await getDataFromAO(AO_STORY, 'GetStories', data);
    // console.log("stories:", posts)

    if (posts.length < PAGE_SIZE)
      this.setState({ isAll: true })

    this.setState({ posts, loading: false });
    this.getStats(posts);
  }

  async nextPage() {
    this.setState({ loadNextPage: true });
    let offset = this.state.posts.length.toString();
    let data;
    switch (this.filterSelected) {
      case 0:
        data = { category: 'project', offset };
        break;
      case 1:
        data = { category: 'top', offset };
        break;
      case 2:
        data = { category: null, offset };
        break;
    }

    let posts = await getDataFromAO(AO_STORY, 'GetStories', data);
    // console.log("nextPage --> stories:", posts)
    if (posts.length < PAGE_SIZE)
      this.setState({ isAll: true })

    let total = this.state.posts.concat(posts);

    // Server.service.addPostsToCache(posts);
    this.setState({ posts: total, loadNextPage: false });
    this.getStats(posts);
  }

  async getStats(posts: any) {
    for (let i = 0; i < posts.length; i++) {
      let stats = await getDataFromAO(AO_STORY, 'GetStats', { post_id: posts[i].id });
      if (stats[0].total_coins || stats[0].total_likes) {
        posts[i].coins += stats[0].total_coins;
        posts[i].likes += stats[0].total_likes;
      }
    }

    this.forceUpdate();
  }

  renderStories() {
    if (this.state.loading) return (<Loading />);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++) {
      let story = this.state.posts[i]
      divs.push(
        <StoryCard key={uuid()} data={story} />
      )
    }

    return divs
  }

  onFilter(index: number, init?: boolean) {
    if (!init) {
      if (this.state.loading) return;
      if (this.filterSelected === index) return;
    }

    this.filterSelected = index;
    Server.service.setStoryTab(index);
    this.renderFilters();

    if (index === 0) { // Hot Projects
      this.getStory('project');
    }
    else if (index === 1) { // Top Story
      this.getStory('top');
    }
    else if (index === 2) { // All New
      this.getStory();
    }
  }

  renderFilters() {
    let filters = ['Hot Projects', 'Top Story', 'All New'];

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
    return (
      <div className='story-page'>
        <div className='story-page-header'>
          <div className='story-page-title'>Story</div>
          {Server.service.isLoggedIn() &&
            <div className="app-icon-button fire-color" onClick={this.onOpen}>
              <AiOutlineFire size={20} />New Story
            </div>
          }
        </div>

        <div className='story-page-filter-row'>
          <div className='story-page-filter-container'>
            {this.renderFilters()}
          </div>

          {this.filterSelected != 0 &&
            <select
              className="story-page-category"
              value={this.state.category}
              onChange={this.onCategoryChange}
            >
              <option value="all">All</option>
              {/* <option value="project">Project</option> */}
              <option value="travel">Travel</option>
              <option value="learn">Learn</option>
              <option value="fiction">Fiction</option>
              <option value="music">Music</option>
              <option value="sports">Sport</option>
              <option value="movie">Movie</option>
            </select>
          }
        </div>

        {this.renderStories()}

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', color: 'gray' }}>
            No more story.
          </div>
        }

        <PostModal isStory={true} open={this.state.open} onClose={this.onClose} />
      </div>
    )
  }
}

export default StoryPage;