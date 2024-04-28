import React from 'react';
import './ChatPage.css';
import AlertModal from '../modals/AlertModal';
import { formatTimestamp, getDataFromAO, getProfile, getWalletAddress, 
  messageToAO, shortAddr, shortStr, timeOfNow } from '../util/util';
import { AO_TWITTER } from '../util/consts';
import Loading from '../elements/Loading';
import { Navigate } from 'react-router-dom';
import { publish, subscribe } from '../util/event';

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
  chatList: any;
  navigate: string;
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
      chatList: '',
      navigate: '',
    };

    subscribe('go-chat', () => {
      this.setState({ navigate: '' });
      this.start();
    });
  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount(): void {
    clearInterval(msg_timer);
  }

  async start() {
    clearInterval(msg_timer);
    
    let friend = window.location.pathname.substring(6);
    console.log("friend:", friend)

    let address = await getWalletAddress();
    console.log("me:", address)

    this.setState({ address, friend });

    if (friend) {
      setTimeout(() => {
        this.goDM();
      }, 50);
    }
    else {
      setTimeout(() => {
        this.getChatList();
      }, 50);
    }
  }

  async goDM() {
    this.getChatList();

    //
    let my_profile = await getProfile(this.state.address);
    // console.log("my_profile:", my_profile)
    my_profile = my_profile[0];
    if (my_profile)
      this.setState({
        my_avatar: my_profile.avatar,
        my_nickname: my_profile.nickname,
      })

    //
    let friend_profile = await getProfile(this.state.friend);
    // console.log("friend_profile:", friend_profile)

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
    
    clearInterval(msg_timer);

    setTimeout(() => {
      msg_timer = setInterval(() => this.getMessages(), 2000);
    }, 50);

    setTimeout(() => {
      this.scrollToBottom();
    }, 1000);
  }

  async getChatList() {
    if (this.state.chatList.length > 0) return;

    let data = { address: this.state.address };
    let chatList = await getDataFromAO(AO_TWITTER, 'GetMessages', data);
    console.log("getChatList:", chatList)

    this.setState({ chatList });
    
    if (chatList.length > 0)
      this.goChat(chatList[0].participant);
    else
      this.setState({ loading: false });
  }

  async getMessages() {
    console.log("DM messages -->")
    let data = { friend: this.state.friend, address: this.state.address };
    let messages = await getDataFromAO(AO_TWITTER, 'GetMessages', data);
    // console.log("messages:", messages)

    this.setState({ messages, loading: false });
    setTimeout(() => {
      this.scrollToBottom();
    }, 1000);
  }

  goChat(id: string) {
    this.setState({ navigate: '/chat/' + id, messages: [] });
    setTimeout(() => {
      publish('go-chat');
      // this.setState({ loading: true });
    }, 50);
  }

  renderChatList() {
    // if (this.state.loading)
    //   return (<Loading />);

    let divs = [];
    let list = this.state.chatList;
    for (let i = 0; i < list.length; i++) {
      let data = list[i];
      let selected = (this.state.friend == data.participant);

      divs.push(
        <div
          key={i}
          className={`chat-page-list ${selected && 'selected'}`}
          onClick={() => this.goChat(data.participant)}
        >
          <img className='chat-page-list-portrait' src={data.avatar} />
          <div>
            <div className="chat-page-list-nickname">{shortStr(data.nickname, 15)}</div>
            <div className="chat-page-list-addr">{shortAddr(data.participant, 4)}</div>
          </div>
        </div>
      )
    }

    // return divs.length > 0 ? divs : <div>No chat yet.</div>
    return divs;
  }

  renderMessages() {
    if (this.state.loading)
      return (<Loading />);

    let divs = [];

    for (let i = 0; i < this.state.messages.length; i++) {
      let data = this.state.messages[i];
      let owner = (data.address == this.state.address);

      divs.push(
        <div key={i} className={`chat-msg-line ${owner ? 'my-line' : 'other-line'}`}>
          {!owner && <img className='chat-msg-portrait' src={this.state.friend_avatar} />}

          <div>
            <div className={`chat-msg-header ${owner ? 'my-line' : 'other-line'}`}>
              <div className="chat-msg-nickname">{
                owner
                  ? shortStr(this.state.my_nickname, 15)
                  : shortStr(this.state.friend_nickname, 15)}
              </div>

              <div className="chat-msg-address">{shortAddr(data.address, 3)}</div>
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
    if (this.state.navigate)
      return <Navigate to={this.state.navigate} />;

    return (
      <div className="chat-page">
        {/* <div>AO Public Chatroom</div> */}
        <div className='chat-page-list-container'>
          {this.renderChatList()}
        </div>

        {/* <div className='chat-page-chat-window'> */}
        <div id='scrollableDiv' className="chat-page-messages-container">
          {this.renderMessages()}
        </div>

        {this.state.address && this.state.friend &&
          <div className='chat-page-send-container'>
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
        {/* </div> */}

        {/* <MessageModal message={this.state.message} /> */}
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default ChatPage;