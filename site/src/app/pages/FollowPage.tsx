import React from 'react';
import './FollowPage.css';
import { AO_TWITTER, AO_STORY, PAGE_SIZE } from '../util/consts';
import { getDataFromAO, getProfile, shortStr } from '../util/util';
import Loading from '../elements/Loading';
import { NavLink } from 'react-router-dom';
import { Server } from '../../server/server';

interface FollowPageProps {
  type?: string;
}

interface FollowPageState {
  loading: boolean;
  loadNextPage: boolean;
  isAll: boolean;
  followers: any;
  following: any;
  isFollowing: boolean;
  showUnfollow: boolean;
  butDisable: boolean;
}

class FollowPage extends React.Component<FollowPageProps, FollowPageState> {

  id = '';
  filterSelected = 0;

  constructor(props: FollowPageProps) {
    super(props);
    this.state = {
      loading: true,
      loadNextPage: false,
      isAll: false,
      followers: '',
      following: '',
      isFollowing: false,
      showUnfollow: false,
      butDisable: true,
    };

    this.atBottom = this.atBottom.bind(this);

    // subscribe('wallet-events', () => {
    //   this.forceUpdate();
    // });
  }

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

    if (scrollTop + clientHeight + 300 >= scrollHeight)
      setTimeout(() => {
        if (!this.state.loading && !this.state.loadNextPage && !this.state.isAll)
          this.nextPage();
      }, 200);
  }

  async start() {
    let id = window.location.pathname.substring(8);
    console.log("id:", id)
    this.id = id;

    // let address = await isLoggedIn();
    // this.setState({ address: id });

    // await this.isFollowing();
    await this.getProfile();
    await this.getFollows();
    // await this.tempGetFollowsTable();
  }

  async getFollows() {
    let following = await getDataFromAO(AO_TWITTER, 'GetFollowing', { follower: this.id, offset: 0 });
    console.log("following:", following)
    this.setState({ following })

    let followers = await getDataFromAO(AO_TWITTER, 'GetFollowers', { following: this.id, offset: 0 });
    console.log("followers:", followers)
    this.setState({ followers, loading: false })

    // if (following.length < PAGE_SIZE)
    //   this.setState({ isAll: true })
  }

  async nextPage() {
    // this.setState({ loadNextPage: true });

    // let offset = this.state.posts.length.toString();
    // console.log("offset:", offset)

    // let posts = await getDataFromAO(AO_STORY, 'GetStories', offset);
    // console.log("stories:", posts)
    // if (posts.length < PAGE_SIZE)
    //   this.setState({ isAll: true })

    // let total = this.state.posts.concat(posts);

    // // Server.service.addPostsToCache(posts);
    // this.setState({ posts: total, loadNextPage: false });
    // this.getStats(posts);
  }

  onFilter(index: number) {
    if (this.filterSelected === index) return;

    this.filterSelected = index;
    this.renderFilters();
    this.forceUpdate()

    if (index === 0) {
      // this.setState({ posts: [] });
      // setTimeout(() => {
      //   this.getPosts(this.author);
      // }, 10);
    }
  }

  renderFilters() {
    let filters = ['Followers', 'Following'];

    let divs = [];
    for (let i = 0; i < filters.length; i++) {
      divs.push(
        <div
          className={`profile-page-filter ${this.filterSelected == i ? 'selected' : ''}`}
          onClick={() => this.onFilter(i)} key={i}
        >
          {filters[i]}
        </div>
      );
    }

    return divs;
  }

  showUnfollow() {
    this.setState({ showUnfollow: true })
  }

  notShowUnfollow() {
    this.setState({ showUnfollow: false })
  }

  // async follow() {
  //   if (this.state.butDisable) return;
  //   this.setState({ butDisable: true })

  //   let data = { following: this.state.address, follower: Server.service.getActiveAddress(), time: timeOfNow() }
  //   // console.log("follow data:", data)
  //   await messageToAO(AO_TWITTER, data, 'Follow');
  //   await this.isFollowing()

  //   this.setState({ butDisable: false })
  //   await this.getFollows();
  // }

  // async unfollow() {
  //   if (this.state.butDisable) return;
  //   this.setState({ butDisable: true })

  //   let data = { following: this.state.address, follower: Server.service.getActiveAddress() }
  //   // console.log("Unfollow data:", data)
  //   await messageToAO(AO_TWITTER, data, 'Unfollow');
  //   await this.isFollowing()

  //   this.setState({ butDisable: false })
  //   await this.getFollows();
  // }

  renderFollows() {
    if (this.state.loading) return (<Loading />);

    let data;
    if (this.filterSelected === 0)
      data = this.state.followers;
    else
      data = this.state.following;

    // console.log('data',data)
    // console.log('this.filterSelected',this.filterSelected)

    let divs = [];
    for (let i = 0; i < data.length; i++) {
      divs.push(
        <NavLink
          key={i}
          className='follow-page-row'
          to={'/user/' + data[i].address}
        >
          <img
            className='follow-page-portrait'
            src={data[i].avatar}
          />
          <div>
            <div className="follow-page-nickname">
              {data[i].nickname}
            </div>
            <div className="follow-page-addr">{shortStr(data[i].address, 4)}</div>
            <div className="follow-page-bio">{data[i].bio}</div>
          </div>

          {/* {this.state.isFollowing
            ? <div
              className={`profile-page-follow-button ${this.state.showUnfollow ? 'unfollow' : 'following'}`}
              onMouseEnter={() => this.showUnfollow()}
              onMouseLeave={() => this.notShowUnfollow()}
              onClick={() => this.unfollow()}
            >
              {this.state.butDisable
                ? <Loading marginTop='10px' />
                : this.state.showUnfollow ? 'Unfollow' : 'Following'
              }
            </div>
            : <div className='profile-page-follow-button' onClick={() => this.follow()}>
              {this.state.butDisable
                ? <Loading marginTop='10px' />
                : 'Follow'
              }
            </div>
          } */}
        </NavLink>
      );
    }

    return divs;
  }

  async getProfile() {
    let profile = await getProfile(this.id);
    console.log("follow -> profile:", profile)
    Server.service.addProfileToCache(profile[0]);
  }
  
  render() {
    let data = Server.service.getProfile(this.id);

    return (
      <div className='follow-page'>
        {data &&
          <div className='follow-page-header'>
            <img className='follow-page-portrait' src={data.avatar} />
            <div>
              <div className="follow-page-nickname">{data.nickname}</div>
              <div className="follow-page-addr">{shortStr(data.address, 4)}</div>
            </div>
          </div>
        }

        <div className='profile-page-filter-container'>
          {this.renderFilters()}
        </div>

        {this.renderFollows()}

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', fontSize: '18px', color: 'gray' }}>
            No more.
          </div>
        }
      </div>
    )
  }
}

export default FollowPage;