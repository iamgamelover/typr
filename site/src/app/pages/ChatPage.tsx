import React from 'react';
import './ChatPage.css';
import { createDataItemSigner, message, dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import { formatTimestamp, getWalletAddress, timeOfNow } from '../util/util';
import { CHATROOM } from '../util/consts';

declare var window: any;
var msg_timer: any;

interface ChatPageState {
  msg: string;
  messages: string[];
  nickname: string;
  question: string;
  alert: string;
  address: string;
  loading: boolean;
}

class ChatPage extends React.Component<{}, ChatPageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      msg: '',
      messages: [],
      nickname: '',
      question: '',
      alert: '',
      address: '',
      loading: true,
    };

    this.getMessages = this.getMessages.bind(this);
  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount(): void {
    clearInterval(msg_timer);
  }

  async start() {
    let address = await getWalletAddress();
    // console.log("Chat Page --> address:", address)
    let nickname = localStorage.getItem('nickname');
    // console.log("Chat Page --> nickname:", nickname)

    this.setState({ address, nickname });
    msg_timer = setInterval(this.getMessages, 2000);
    setTimeout(() => {
      this.scrollToBottom();
    }, 5000);
  }

  async getMessages() {
    console.log("Chat Page -->")

    const result = await dryrun({
      process: CHATROOM,
      tags: [{ name: 'Action', value: 'GetMessages' }],
    });

    if (result.Messages.length == 0) {
      this.setState({ loading: false });
      return;
    }

    let data = result.Messages[0].Data;
    let messages = data.split("▲");

    if (messages.length == 1 && messages[0] == '') {
      this.setState({ loading: false });
      return;
    }

    this.setState({ messages, loading: false });
  }

  renderMessages() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];

    for (let i = 0; i < this.state.messages.length; i++) {
      let data = JSON.parse(this.state.messages[i]);
      let address = data.address;
      address = address.substring(0, 4) + '...' + address.substring(address.length - 4);

      divs.push(
        <div key={i} className={`chat-msg-line ${data.address == this.state.address ? 'my-line' : 'other-line'}`}>
          {data.address != this.state.address && <img className='chat-msg-portrait' src='portrait-default.png' />}
          <div>
            <div className={`chat-msg-header ${data.address == this.state.address ? 'my-line' : 'other-line'}`}>
              <div className="chat-msg-nickname">{data.nickname}</div>
              <div className="chat-msg-address">{address}</div>
            </div>
            <div className={`chat-message ${data.address == this.state.address ? 'my-message' : 'other-message'}`}>
              {data.msg}
            </div>
            <div className={`chat-msg-time ${data.address == this.state.address ? 'my-line' : 'other-line'}`}>
              {data.time ? formatTimestamp(data.time, true) : 'old msg'}
            </div>
          </div>
          {data.address == this.state.address && <img className='chat-msg-portrait' src='portrait-default.png' />}
        </div>
      )
    }

    return divs.length > 0 ? divs : <div>No messages yet.</div>
  }

  async sendMessage() {
    let nickname = this.state.nickname;
    if (!nickname) nickname = 'anonymous';

    let msg = this.state.msg.trim();
    if (!msg) {
      this.setState({ alert: 'Please input a message.' })
      return;
    } else if (msg.length > 500) {
      this.setState({ alert: 'Message can be up to 500 characters long.' })
      return;
    }

    let data = { address: this.state.address, nickname, msg, time: timeOfNow() };
    // console.log("Chat Page --> message:", JSON.stringify(data))

    this.setState({ msg: '' });

    const messageId = await message({
      process: CHATROOM,
      signer: createDataItemSigner(window.arweaveWallet),
      tags: [
        { name: 'Action', value: 'SendMessage' },
        { name: 'Data', value: JSON.stringify(data) }
      ],
    });
    console.log("messageId:", messageId)

    setTimeout(() => {
      this.scrollToBottom();
    }, 2000);
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
        <div>AO Public Chatroom</div>
        <div id='scrollableDiv' className="chat-chat-container">
          {this.renderMessages()}
        </div>

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

        {/* <MessageModal message={this.state.message} /> */}
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default ChatPage;