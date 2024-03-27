import React from 'react';
import './ProfilePage.css';
import AlertModal from '../modals/AlertModal';
import EditProfileModal from '../modals/EditProfileModal';
import MessageModal from '../modals/MessageModal';
import QuestionModal from '../modals/QuestionModal';
import { getBannerImage, getDataFromAO, getDefaultProcess, isLoggedIn } from '../util/util';
import { BsCalendarWeek, BsPencilFill } from 'react-icons/bs';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import { AO_TWITTER } from '../util/consts';
import { Server } from '../../server/server';

interface ProfilePageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  isLoggedIn: string;
  address: string;
  openEditProfile: boolean;
  nickname: string;
  banner: string;
  avatar: string;
  bio: string;
  joined: string;
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
      isLoggedIn: '',
      address: '',
      openEditProfile: false,
      nickname: '',
      banner: '/banner-default.png',
      avatar: '',
      bio: '',
      joined: '',
    };

    this.openEditProfile = this.openEditProfile.bind(this);
    this.onCloseEditProfile = this.onCloseEditProfile.bind(this);
    // this.onQuestionYes = this.onQuestionYes.bind(this);
    // this.onQuestionNo = this.onQuestionNo.bind(this);
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    this.setState({ banner: '/banner-default.png' });

    setTimeout(async () => {
      let address = await isLoggedIn();
      this.setState({ isLoggedIn: address, address });
      this.getDateOfJoined(address);
  
      let profile = JSON.parse(localStorage.getItem('profile'));
      if (profile) {
        this.setState({
          banner: profile.banner,
          avatar: profile.avatar,
          nickname: profile.nickname,
          bio: profile.bio,
          loading: false
        });
      }
      else {
        // the avatar from dicebear.com
        this.createAvatar();
        this.getProfile(address);
      }
    }, 10);
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
      profile = JSON.parse(response[response.length - 1]);
      this.setState({
        banner: profile.banner,
        avatar: profile.avatar,
        nickname: profile.nickname,
        bio: profile.bio,
      })
    }

    localStorage.setItem('profile', JSON.stringify(profile));
    this.setState({ loading: false });
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
        openEditProfile: false
      });
    }
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
    let filters = ['Posts', 'Likes'];

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

  render() {
    let joined = new Date(Number(this.state.joined) * 1000).toLocaleString();
    // let bannerImage = getBannerImage('');
    // let portraitImage = getPortraitImage(this.state.profile);

    let id = this.state.address;
    let shortId = id.substring(0, 6) + '...' + id.substring(id.length - 6);

    return (
      <div className='profile-page'>
        <div className='profile-page-container'>
          {this.state.loading && <div id="loading" />}

          <div className='profile-page-header'>
            <img className="profile-page-banner" src={this.state.banner} />
            <img className="profile-page-portrait" src={this.state.avatar} />
          </div>

          {this.renderActionButtons()}

          {/* <div className="profile-page-name">{localStorage.getItem('nickname')}</div> */}
          <div className="profile-page-name">{this.state.nickname}</div>
          <div className="profile-page-id">{shortId}</div>
          <div className="profile-page-desc">{this.state.bio}</div>
          <div className='profile-page-joined-container'>
            <BsCalendarWeek />
            <div className='profile-page-joined'>Joined {joined}</div>
          </div>

          {/* <div className='profile-page-social-container'>
            <div className='profile-page-social-header'>
              <div style={{ display: 'flex' }}>{this.renderFilters()}</div>
            </div>
          </div> */}
        </div>

        {!this.state.loading &&
          <EditProfileModal open={this.state.openEditProfile} onClose={this.onCloseEditProfile} />
        }

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        {/* <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} /> */}
      </div>
    );
  }
}

export default ProfilePage;