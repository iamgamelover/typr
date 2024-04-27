import React from 'react';
import './ProfilePage.css';
import AlertModal from '../modals/AlertModal';
import EditProfileModal from '../modals/EditProfileModal';
import MessageModal from '../modals/MessageModal';
import {
  getDataFromAO, getProfile, isBookmarked,
  isLoggedIn, messageToAO, randomAvatar, shortAddr, timeOfNow,
  uuid
} from '../util/util';
import { BsCalendarWeek } from 'react-icons/bs';
import { AO_TWITTER, PAGE_SIZE } from '../util/consts';
import { Server } from '../../server/server';
import Loading from '../elements/Loading';
import ActivityPost from '../elements/ActivityPost';
import { subscribe } from '../util/event';
import { CiMail } from "react-icons/ci";
import { NavLink, Navigate } from 'react-router-dom';
import DMModal from '../modals/DMModal';

declare var window: any;

interface ProfilePageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  loadNextPage: boolean;
  address: string;
  openEditProfile: boolean;
  openDM: boolean;
  nickname: string;
  banner: string;
  avatar: string;
  bio: string;
  posts: any;
  isAll: boolean;
  profile: any;
  followers: number;
  following: number;
  isFollowing: boolean;
  showUnfollow: boolean;
  butDisable: boolean;
  isFriend: boolean;
  navigate: string;
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
      address: '',
      openEditProfile: false,
      openDM: false,
      nickname: '',
      banner: '/banner-default.png',
      avatar: '',
      bio: '',
      posts: '',
      isAll: false,
      profile: '',
      followers: 0,
      following: 0,
      isFollowing: false,
      showUnfollow: false,
      butDisable: true,
      isFriend: false,
      navigate: '',
    };

    this.openEditProfile = this.openEditProfile.bind(this);
    this.onCloseEditProfile = this.onCloseEditProfile.bind(this);
    this.openDM = this.openDM.bind(this);
    this.onCloseDM = this.onCloseDM.bind(this);
    this.atBottom = this.atBottom.bind(this);
    this.onPopState = this.onPopState.bind(this);
    // this.onQuestionYes = this.onQuestionYes.bind(this);
    // this.onQuestionNo = this.onQuestionNo.bind(this);

    subscribe('click-profile-menu', () => {
      setTimeout(() => {
        this.start();
      }, 50);
    });
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
      setTimeout(() => {
        if (!this.state.loading && !this.state.loadNextPage && !this.state.isAll)
          this.nextPage();
      }, 200);
  }

  onPopState(event: any) {
    this.start();
  }

  async start() {
    let id;
    let my_profile = window.location.pathname;
    // console.log("my_profile:", my_profile)

    if (my_profile == '/profile')
      id = await isLoggedIn();
    else
      id = window.location.pathname.substring(6);

    // console.log("id:", id)

    this.setState({ address: id });

    await this.getPosts(id);
    await this.getProfile(id);
    await this.isFollowing();
    await this.getFollows();
    // await this.tempGetFollowsTable();
  }

  async getPosts(address: string) {
    let posts;
    let position = Server.service.getPositionInProfileFromCache();

    if (!posts) {
      posts = await getDataFromAO(AO_TWITTER, 'GetPosts', { offset: 0, address });
      // console.log("profile-> posts:", posts)
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
    // console.log("offset:", offset)

    let posts = await getDataFromAO(AO_TWITTER, 'GetPosts',
      { offset, address: this.state.address });

    if (posts.length < PAGE_SIZE)
      this.setState({ isAll: true })

    let total = this.state.posts.concat(posts);
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
  }

  async getProfile(address: string) {
    let profile = await getProfile(address);
    // console.log("profile:", profile)

    profile = profile[0];
    if (profile)
      this.setState({
        profile,
        banner: profile.banner,
        avatar: profile.avatar,
        nickname: profile.nickname,
        bio: profile.bio,
      })
  }

  openEditProfile() {
    this.setState({ openEditProfile: true });
  }

  onCloseEditProfile() {
    this.setState({ openEditProfile: false });
    this.getProfile(this.state.address);
  }

  openDM() {
    this.setState({ openDM: true });
  }

  onCloseDM(sent: boolean) {
    this.setState({ openDM: false });
    if (sent)
      this.setState({ navigate: '/chat/' + this.state.address });
  }

  async follow() {
    if (!Server.service.getIsLoggedIn()) {
      this.setState({ alert: 'Please connect to wallet.' });
      return;
    }

    if (this.state.butDisable) return;
    this.setState({ butDisable: true })

    let data = { following: this.state.address, follower: Server.service.getActiveAddress(), time: timeOfNow() }
    // console.log("follow data:", data)
    await messageToAO(AO_TWITTER, data, 'Follow');
    await this.isFollowing()

    this.setState({ butDisable: false })
    await this.getFollows();
  }

  async unfollow() {
    if (this.state.butDisable) return;
    this.setState({ butDisable: true })

    let data = { following: this.state.address, follower: Server.service.getActiveAddress() }
    // console.log("Unfollow data:", data)
    await messageToAO(AO_TWITTER, data, 'Unfollow');
    await this.isFollowing()

    this.setState({ butDisable: false })
    await this.getFollows();
  }

  async tempGetFollowsTable() {
    // TODO: testing...
    let tempGetFollowsTable = await getDataFromAO(AO_TWITTER, 'TempGetFollowsTable');
    console.log("tempGetFollowsTable:", tempGetFollowsTable)
  }

  async getFollows() {
    let following = await getDataFromAO(AO_TWITTER, 'GetFollowing',
      { follower: this.state.address, offset: 0 });
    // console.log("following:", following)
    this.setState({ following: following.length })

    let followers = await getDataFromAO(AO_TWITTER, 'GetFollowers',
      { following: this.state.address, offset: 0 });
    // console.log("followers:", followers)
    this.setState({ followers: followers.length })
  }

  async isFollowing() {
    let data = { follower: Server.service.getActiveAddress(), following: this.state.address, offset: 0 };
    let isFollowing = await getDataFromAO(AO_TWITTER, 'GetFollowing', data);
    // console.log("isFollowing:", isFollowing)

    if (isFollowing.length > 0)
      this.setState({ isFollowing: true, butDisable: false })
    else
      this.setState({ isFollowing: false, butDisable: false })

    //
    data = { follower: this.state.address, following: Server.service.getActiveAddress(), offset: 0 };
    let isFollower = await getDataFromAO(AO_TWITTER, 'GetFollowing', data);
    // console.log("isFollower:", isFollower)

    if (isFollowing.length > 0 && isFollower.length > 0)
      this.setState({ isFriend: true });
    else
      this.setState({ isFriend: false });
  }

  showUnfollow() {
    this.setState({ showUnfollow: true })
  }

  notShowUnfollow() {
    this.setState({ showUnfollow: false })
  }

  // async sayHi() {
  //   let data = { address: Server.service.getActiveAddress(), friend: this.state.address, message: 'Hi', time: timeOfNow() };
  //   console.log("data:", data)
  //   // await messageToAO(AO_TWITTER, data, 'SendMessage');
  // }

  renderActionButtons() {
    if (this.state.loading)
      return (<div className="profile-page-button-container" style={{ height: '42px' }}></div>);

    if (this.state.address !== Server.service.getActiveAddress())
      return (
        <div className="profile-page-button-container">
          {this.state.isFriend &&
            // <NavLink className="profile-page-action-button" to={'/chat/' + this.state.address}>
            //   <CiMail />
            // </NavLink>
            <div className="profile-page-action-button" onClick={() => this.setState({ openDM: true })}>
              <CiMail />
            </div>
          }

          {this.state.isFollowing
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
          }
        </div>
      )

    return (
      <div className="profile-page-button-container">
        <div onClick={this.openEditProfile} className="profile-page-follow-button following">
          Edit
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
          key={uuid()}
          data={this.state.posts[i]}
        />
      )

    return divs;
  }

  render() {
    if (this.state.navigate)
      return <Navigate to={this.state.navigate} />;

    let joined = new Date(this.state.profile.time * 1000).toLocaleString();

    return (
      <div className='profile-page'>
        <div className='profile-page-header'>
          <img className="profile-page-banner" src={this.state.banner ? this.state.banner : '/banner-default.png'} />
          <img className="profile-page-portrait" src={this.state.avatar ? this.state.avatar : randomAvatar()} />
        </div>

        {this.renderActionButtons()}

        <div className="profile-page-name">{this.state.nickname}</div>
        <div className="profile-page-id">{shortAddr(this.state.address, 6)}</div>
        <div className="profile-page-desc">{this.state.bio}</div>
        <div className='profile-page-joined-container'>
          <BsCalendarWeek />
          <div className='profile-page-joined'>Joined&nbsp;&nbsp;&nbsp;{joined}</div>
        </div>

        <div className='profile-page-follow-container'>
          <NavLink className="profile-page-follow-link" to={'/follow/' + this.state.address}>
            <div className='profile-page-follow-number'>{this.state.following}</div>
            <div className='profile-page-follow-text'>Following</div>
          </NavLink>

          <NavLink className="profile-page-follow-link" to={'/follow/' + this.state.address}>
            <div className='profile-page-follow-number'>{this.state.followers}</div>
            <div className='profile-page-follow-text'>Followers</div>
          </NavLink>
        </div>

        <div className='profile-page-filter-container'>
          {this.renderFilters()}
        </div>

        {this.renderPosts()}

        {!this.state.loading && this.state.profile &&
          <EditProfileModal
            open={this.state.openEditProfile}
            onClose={this.onCloseEditProfile}
            data={this.state.profile}
          />
        }

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', fontSize: '18px', color: 'gray' }}>
            No more post.
          </div>
        }

        {this.state.address &&
          <DMModal open={this.state.openDM} onClose={this.onCloseDM} friend={this.state.address} />
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        {/* <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} /> */}
      </div>
    );
  }
}

export default ProfilePage;