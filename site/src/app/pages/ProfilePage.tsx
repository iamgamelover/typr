import React from 'react';
import './ProfilePage.css';
import AlertModal from '../modals/AlertModal';
import EditProfileModal from '../modals/EditProfileModal';
import MessageModal from '../modals/MessageModal';
import QuestionModal from '../modals/QuestionModal';
import { getBannerImage, getDataFromAO, getDefaultProcess, isBookmarked, isLoggedIn, parsePosts } from '../util/util';
import { BsCalendarWeek, BsPencilFill } from 'react-icons/bs';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import { AO_TWITTER, PAGE_SIZE } from '../util/consts';
import { Server } from '../../server/server';
import Loading from '../elements/Loading';
import ActivityPost from '../elements/ActivityPost';
import { subscribe } from '../util/event';

declare var window: any;

interface ProfilePageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  loadNextPage: boolean;
  isLoggedIn: string;
  address: string;
  openEditProfile: boolean;
  nickname: string;
  banner: string;
  avatar: string;
  bio: string;
  joined: string;
  posts: any;
  isAll: boolean;
}

class ProfilePage extends React.Component<{}, ProfilePageState> {

  filterSelected = 0;

  constructor(props: {}) {
    super(props);
    this.state = {
      question: '',
      alert: '',
      message: '',
      loading: true,
      loadNextPage: false,
      isLoggedIn: '',
      address: '',
      openEditProfile: false,
      nickname: '',
      banner: '/banner-default.png',
      avatar: '',
      bio: '',
      joined: '',
      posts: '',
      isAll: false
    };

    this.openEditProfile = this.openEditProfile.bind(this);
    this.onCloseEditProfile = this.onCloseEditProfile.bind(this);
    this.atBottom = this.atBottom.bind(this);
    this.onPopState = this.onPopState.bind(this);
    // this.onQuestionYes = this.onQuestionYes.bind(this);
    // this.onQuestionNo = this.onQuestionNo.bind(this);

    // subscribe('profile', () => {
    //   this.forceUpdate();
    //   this.start();
    // });
  }

  componentDidMount() {
    this.start();
    window.addEventListener('scroll', this.atBottom);
    window.addEventListener('popstate', this.onPopState);
  }

  componentWillUnmount(): void {
    // clearInterval(this.refresh);
    window.removeEventListener('scroll', this.atBottom);
    window.removeEventListener('popstate', this.onPopState);
    Server.service.addPositionInProfileToCache(window.pageYOffset);
  }

  atBottom() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight + 300 >= scrollHeight)
      if (!this.state.loading && !this.state.loadNextPage && !this.state.isAll)
        this.nextPage();
  }

  onPopState(event: any) {
    this.start();
  }

  async start() {
    // let id = window.location.pathname.substring(6);
    // console.log("id:", id)

    let address = await isLoggedIn();
    this.setState({ isLoggedIn: address, address });

    this.getDateOfJoined(address);
    this.getPosts(address);

    let profile = JSON.parse(localStorage.getItem('profile'));
    if (profile) {
      this.setState({
        banner: profile.banner,
        avatar: profile.avatar,
        nickname: profile.nickname,
        bio: profile.bio,
      });
    }
    else {
      // the avatar from dicebear.com
      this.createAvatar();
      this.getProfile(address);
    }
  }

  async getPosts(address: string) {
    let posts;
    let val = localStorage.getItem('your_posts');
    if (val && val != '[]') posts = JSON.parse(val);
    // let posts = Server.service.getPostsInProfileFromCache(address);
    
    let position = Server.service.getPositionInProfileFromCache();

    if (!posts) {
      posts = await getDataFromAO(AO_TWITTER, 'GetOwnerPosts', 1, PAGE_SIZE, null, address);
      if (posts.length < PAGE_SIZE)
        this.setState({ isAll: true })

      this.checkBookmarks(parsePosts(posts));
      return;
    }

    this.checkBookmarks(posts);
    this.setState({ posts, loading: false });

    setTimeout(() => {
      window.scrollTo(0, position);
    }, 10);
  }

  async nextPage() {
    this.setState({ loadNextPage: true });

    let pageNo = Server.service.getPageNoInProfile();
    pageNo += 1;
    Server.service.setPageNoInProfile(pageNo);

    let posts = await getDataFromAO(AO_TWITTER, 'GetOwnerPosts', pageNo, PAGE_SIZE, null, this.state.address);

    if (posts.length < PAGE_SIZE)
      this.setState({ isAll: true })

    let total = this.state.posts.concat(parsePosts(posts));
    this.checkBookmarks(total);
  }

  async checkBookmarks(posts: any) {
    let bookmarks = [];
    let val = localStorage.getItem('bookmarks');
    if (val) bookmarks = JSON.parse(val);

    for (let i = 0; i < posts.length; i++) {
      let resp = isBookmarked(bookmarks, posts[i].id);
      posts[i].isBookmarked = resp;
    }

    this.setState({ posts, loading: false, loadNextPage: false });
    // Server.service.addPostsInProfileToCache(this.state.address, posts);
    localStorage.setItem('your_posts', JSON.stringify(posts))
  }

  // load profile from the process of user's
  async getProfile(address: string) {
    let process = await getDefaultProcess(address);
    let response = await getDataFromAO(process, 'AOTwitter.getProfile');

    let profile = {
      banner: this.state.banner,
      avatar: this.state.avatar,
      nickname: this.state.nickname,
      bio: this.state.bio,
    };

    if (response) {
      profile = JSON.parse(response[0]);
      this.setState({
        banner: profile.banner,
        avatar: profile.avatar,
        nickname: profile.nickname,
        bio: profile.bio,
      })
    }

    localStorage.setItem('profile', JSON.stringify(profile));
  }

  async getDateOfJoined(address: string) {
    let members = await getDataFromAO(AO_TWITTER, 'GetMembers');
    for (let i = 0; i < members.length; i++) {
      let data = JSON.parse(members[i]);
      if (data.address == address) {
        this.setState({ joined: data.time });
        return;
      }
    }
  }

  createAvatar() {
    let nickname = localStorage.getItem('nickname');
    let random = localStorage.getItem('avatar');
    const resp = createAvatar(micah, {
      seed: nickname + random,
    });

    const avatar = resp.toDataUriSync();
    this.setState({ nickname, avatar });
  }

  openEditProfile() {
    this.setState({ openEditProfile: true });
  }

  onCloseEditProfile() {
    let profile = JSON.parse(localStorage.getItem('profile'));
    if (profile) {
      this.setState({
        banner: profile.banner,
        avatar: profile.avatar,
        nickname: profile.nickname,
        bio: profile.bio,
      });
    }

    this.setState({ openEditProfile: false });
  }

  renderActionButtons() {
    if (this.state.loading)
      return (<div className="profile-page-button-container" style={{ height: '42px' }}></div>);

    return (
      <div className="profile-page-button-container">
        <div onClick={this.openEditProfile} className="profile-page-action-button">
          <BsPencilFill />
        </div>
      </div>
    )
  }

  onFilter(index: number) {
    if (this.filterSelected === index) return;

    this.filterSelected = index;
    this.renderFilters();

    if (index === 0) { // Activity
      // this.setState({ posts: [] });
      // setTimeout(() => {
      //   this.getPosts(this.author);
      // }, 10);
    }
  }

  renderFilters() {
    let filters = ['Posts'];

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

  renderPosts() {
    if (this.state.loading) return (<Loading />);

    let divs = [];
    for (let i = 0; i < this.state.posts.length; i++)
      divs.push(
        <ActivityPost
          key={i}
          data={this.state.posts[i]}
        />
      )

    return divs;
  }

  render() {
    let joined = new Date(Number(this.state.joined) * 1000).toLocaleString();
    // let bannerImage = getBannerImage('');
    // let portraitImage = getPortraitImage(this.state.profile);

    let id = this.state.address;
    let shortId = id.substring(0, 6) + '...' + id.substring(id.length - 6);

    return (
      <div className='profile-page'>
        <div className='profile-page-header'>
          <img className="profile-page-banner" src={this.state.banner} />
          <img className="profile-page-portrait" src={this.state.avatar} />
        </div>

        {this.renderActionButtons()}

        <div className="profile-page-name">{this.state.nickname}</div>
        <div className="profile-page-id">{shortId}</div>
        <div className="profile-page-desc">{this.state.bio}</div>
        <div className='profile-page-joined-container'>
          <BsCalendarWeek />
          <div className='profile-page-joined'>Joined {joined}</div>
        </div>

        <div className='profile-page-filter-container'>
          {this.renderFilters()}
        </div>

        {this.renderPosts()}

        {!this.state.loading &&
          <EditProfileModal open={this.state.openEditProfile} onClose={this.onCloseEditProfile} />
        }

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', fontSize: '18px', color: 'gray' }}>
            No more post.
          </div>
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        {/* <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} /> */}
      </div>
    );
  }
}

export default ProfilePage;