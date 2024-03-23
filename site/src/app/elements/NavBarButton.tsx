import React from 'react';
import { NavLink } from 'react-router-dom';
import { publish } from '../util/event';
import './NavBar.css';
import { BsAward, BsBell, BsBookmark, BsChatText, BsController, BsHouse, BsPerson } from 'react-icons/bs';
import { ICON_SIZE } from '../util/consts';
import { AiOutlineFire } from 'react-icons/ai';

interface NavBarButtonProps {
  // icon:string,
  text:string,
  to:string,
  beta:string,
  new:string,
  align?:string
}

interface NavBarButtonState {
  isMessagesButton: boolean;
  isMessagesPage: boolean;
  isFriendUpdated: boolean;
  isFriendButton: boolean;
}

class NavBarButton extends React.Component<NavBarButtonProps, NavBarButtonState> {

  constructor(props: NavBarButtonProps) {
    super(props);
    this.state = {
      isFriendUpdated: false,
      isMessagesPage: false,
      isMessagesButton: (this.props.text == 'Messages'),
      isFriendButton: (this.props.text == 'Friends'),
    };

    this.onChatUpdated  = this.onChatUpdated.bind(this);
    this.onFriendUpdated  = this.onFriendUpdated.bind(this);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  onChatUpdated(data: any) {
    this.forceUpdate();
  }

  onFriendUpdated(data: any) {
    if(data.action == 'connect' || data.action == 'disconnect' || data.action == 'presence')
      return;

    if (window.location.pathname != '/friends' && this.state.isFriendButton) 
      this.setState({ isFriendUpdated: true });
  }

  onClickButton() {
    if (this.props.text == 'Messages') {
      publish('clicked-messages-navbar-button');
    }

    if (this.props.text == 'Friends') {
      this.setState({ isFriendUpdated: false });
    }
  }

  renderIcon() {
    if (this.props.text == 'Home')
      return <BsHouse size={ICON_SIZE}/>
    else if (this.props.text == 'Story')
      return <AiOutlineFire size={ICON_SIZE}/>
    else if (this.props.text == 'Games')
      return <BsController size={ICON_SIZE}/>
    else if (this.props.text == 'TokenEco')
      return <BsAward size={ICON_SIZE}/>
    else if (this.props.text == 'Notifications')
      return <BsBell size={ICON_SIZE}/>
    else if (this.props.text == 'Bookmark')
      return <BsBookmark size={ICON_SIZE}/>
    else if (this.props.text == 'Chatroom')
      return <BsChatText size={ICON_SIZE}/>
    else if (this.props.text == 'Profile')
      return <BsPerson size={ICON_SIZE}/>
  }

  render() {
    return (
      <NavLink className={({ isActive }) => (isActive ? "navbar-link-active" : "navbar-link")} to={this.props.to}>
        <div className="navbar-button" onClick={() => this.onClickButton()}>
          {this.renderIcon()}
          <div className="navbar-text">{this.props.text}</div>
          {this.props.beta &&
            <div className="navbar-label-beta">beta</div>
          }
          {this.props.new &&
            <div className="navbar-label-beta new">new</div>
          }
        </div>
      </NavLink>
    );
  }
}

export default NavBarButton;