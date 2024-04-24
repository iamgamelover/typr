import React from 'react';
import './ChatPage.css';
import { createDataItemSigner, message, dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import { formatTimestamp, getDataFromAO, getProfile, getWalletAddress, messageToAO, shortStr, timeOfNow } from '../util/util';
import { AO_TWITTER, CHATROOM } from '../util/consts';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';

declare var window: any;
var msg_timer: any;

interface ChatPageState {
  msg: string;
  messages: any;
  nickname: string;
  question: string;
  alert: string;
  loading: boolean;
  address: string;
  friend: string;
  my_avatar: string;
  my_nickname: string;
  friend_avatar: string;
  friend_nickname: string;
}

class ChatPage extends React.Component<{}, ChatPageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      msg: '',
      messages: '',
      nickname: '',
      question: '',
      alert: '',
      loading: true,
      address: '',
      friend: '',
      my_avatar: '',
      my_nickname: '',
      friend_avatar: '',
      friend_nickname: '',
    };

  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount(): void {
    clearInterval(msg_timer);
  }

  async start() {
    let friend = window.location.pathname.substring(6);
    console.log("friend:", friend)

    let address = await getWalletAddress();
    console.log("me:", address)

    this.setState({ address, friend });

    if (friend) {
      setTimeout(() => {
        this.getProfiles();
      }, 50);
    }
  }

  async getProfiles() {
    //
    let my_profile = await getProfile(this.state.address);
    console.log("my_profile:", my_profile)
    my_profile = my_profile[0];
    if (my_profile)
      this.setState({
        my_avatar: my_profile.avatar,
        my_nickname: my_profile.nickname,
      })

    //
    let friend_profile = await getProfile(this.state.friend);
    console.log("friend_profile:", friend_profile)

    if (friend_profile.length == 0) return;

    friend_profile = friend_profile[0];
    if (friend_profile)
      this.setState({
        friend_avatar: friend_profile.avatar,
        friend_nickname: friend_profile.nickname,
      })

    setTimeout(() => {
      this.getMessages();
    }, 50);

    msg_timer = setInterval(() => this.getMessages(), 2000);

    setTimeout(() => {
      this.scrollToBottom();
    }, 1000);
  }

  async getMessages() {
    console.log("DM messages -->")
    let data = { friend: this.state.friend, address: this.state.address };
    let messages = await getDataFromAO(AO_TWITTER, 'GetMessages', data);
    console.log("messages:", messages)

    this.setState({ messages, loading: false });
    setTimeout(() => {
      this.scrollToBottom();
    }, 1000);
  }

  renderMessages() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];

    for (let i = 0; i < this.state.messages.length; i++) {
      let data = this.state.messages[i];
      let owner = (data.address == this.state.address);

      divs.push(
        <div key={i} className={`chat-msg-line ${owner ? 'my-line' : 'other-line'}`}>
          {!owner && <img className='chat-msg-portrait' src={this.state.friend_avatar} />}
          <div>
            <div className={`chat-msg-header ${owner ? 'my-line' : 'other-line'}`}>
              <div className="chat-msg-nickname">{owner ? this.state.my_nickname : this.state.friend_nickname}</div>
              <div className="chat-msg-address">{shortStr(data.address, 3)}</div>
            </div>
            <div className={`chat-message ${owner ? 'my-message' : 'other-message'}`}>
              {data.message}
            </div>
            <div className={`chat-msg-time ${owner ? 'my-line' : 'other-line'}`}>
              {formatTimestamp(data.time, true)}
            </div>
          </div>
          {owner && <img className='chat-msg-portrait' src={this.state.my_avatar} />}
        </div>
      )
    }

    return divs.length > 0 ? divs : <div>No messages yet.</div>
  }

  async sendMessage() {
    let msg = this.state.msg.trim();
    if (!msg) {
      this.setState({ alert: 'Please input a message.' })
      return;
    } else if (msg.length > 500) {
      this.setState({ alert: 'Message can be up to 500 characters long.' })
      return;
    }

    this.setState({ msg: '' });

    let data = { address: this.state.address, friend: this.state.friend, message: msg, time: timeOfNow() };
    // console.log("data:", data)
    await messageToAO(AO_TWITTER, data, 'SendMessage');

    setTimeout(() => {
      this.scrollToBottom();
    }, 1000);
  }

  handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // prevent the form submit action
      this.sendMessage();
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

  render() {
    return (
      <div className="chat-page">
        {/* <div>AO Public Chatroom</div> */}
        <div id='scrollableDiv' className="chat-chat-container">
          {this.renderMessages()}
        </div>

        {this.state.address &&
          <div>
            <input
              id='input_msg'
              className="chat-input-message"
              placeholder="message"
              value={this.state.msg}
              onChange={(e) => this.setState({ msg: e.target.value })}
              onKeyDown={this.handleKeyDown}
            />
            <button className="chat-send-button" onClick={() => this.sendMessage()}>Send</button>
          </div>
        }

        {/* <MessageModal message={this.state.message} /> */}
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default ChatPage;