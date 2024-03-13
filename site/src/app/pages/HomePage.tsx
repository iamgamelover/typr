import React from 'react';
import './HomePage.css';
import { subscribe } from '../util/event';
import { createDataItemSigner, message, dryrun } from "@permaweb/aoconnect";
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';

declare var window: any;
const CHATROOM = "CAOVqgkWqJRsJYc5JGP7oDbmCjJ-PUzkZtva5s7zrr0";

interface HomePageState {
  msg: string;
  messages: string[];
  nickname: string;
  question: string;
  alert: string;
  loading: boolean;
}

class HomePage extends React.Component<{}, HomePageState> {

  activeAddress = '';

  constructor(props: {}) {
    super(props);
    this.state = {
      msg: '',
      messages: [],
      nickname: '',
      question: '',
      alert: '',
      loading: true,
    };

    this.getMessages = this.getMessages.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.start();
  }

  async connectWallet(fromConnect: boolean) {
    try {
      // connect to the ArConnect browser extension
      await window.arweaveWallet.connect(
        // request permissions
        ["ACCESS_ADDRESS", "SIGN_TRANSACTION"],
      );
    } catch (error) {
      // this.setState({ alert: 'User canceled the connection.' });
      alert('User canceled the connection.');
      return;
    }

    // obtain the user's wallet address
    const userAddress = await window.arweaveWallet.getActiveAddress();
    if (userAddress) {
      if (fromConnect) alert('You have connected to ArConnect.');
      localStorage.setItem('userAddress', userAddress);
      this.activeAddress = userAddress;
      return userAddress;
    }
  }

  start() {
    let nickname = localStorage.getItem('nickname');
    let userAddress = localStorage.getItem('userAddress');
    if (nickname) this.setState({ nickname });
    if (userAddress) this.activeAddress = userAddress;

    const interval = setInterval(this.getMessages, 2000);
    setTimeout(() => {
      this.scrollToBottom();
    }, 4000);
  }

  async getMessages() {
    // console.log("getMessages...")
    const result = await dryrun({
      process: CHATROOM,
      tags: [{ name: 'Action', value: 'GetMessages' }],
    });

    let data = result.Messages[0].Data;
    let messages = data.split("*");
    if (messages.length == 1 && messages[0] == '') return;
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
        <div key={i} className={`testao-msg-line ${data.address == this.activeAddress ? 'my-line' : 'other-line'}`}>
          {data.address != this.activeAddress && <img className='testao-msg-portrait' src='portrait-default.png' />}
          <div>
            <div className={`testao-msg-header ${data.address == this.activeAddress ? 'my-line' : 'other-line'}`}>
              <div className="testao-msg-nickname">{data.nickname}</div>
              <div className="testao-msg-address">{address}</div>
            </div>
            <div className={`testao-message ${data.address == this.activeAddress ? 'my-message' : 'other-message'}`}>
              {data.msg}
            </div>
          </div>
          {data.address == this.activeAddress && <img className='testao-msg-portrait' src='portrait-default.png' />}
        </div>
      )
    }

    return divs.length > 0 ? divs : <div>No messages yet.</div>
  }

  async sendMessage() {
    let address = await this.connectWallet(false);

    let nickname = this.state.nickname.trim();
    if (nickname.length > 25) {
      this.setState({ alert: 'Nickname can be up to 25 characters long.' })
      return;
    }

    let msg = this.state.msg.trim();
    if (!msg) {
      this.setState({ alert: 'Please input a message.' })
      return;
    } else if (msg.length > 500) {
      this.setState({ alert: 'Message can be up to 500 characters long.' })
      return;
    }

    localStorage.setItem('nickname', nickname);

    if (!nickname) nickname = 'anonymous';
    let data = { address, nickname, msg };
    console.log("Message:", data)

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
      <div className="testao-page">
        <div style={{ fontSize: 18 }}>This is an AO Chatroom for testing</div>

        <div className="testao-nickname-line">
          <button className="testao-connect-button" onClick={() => this.connectWallet(true)}>
            Connect ArConnect
          </button>
          <div>Nickname</div>
          <input
            className="testao-input-message nickname"
            placeholder="nickname"
            value={this.state.nickname}
            onChange={(e) => this.setState({ nickname: e.target.value })}
          />
        </div>

        <div id='scrollableDiv' className="testao-chat-container">
          {this.renderMessages()}
        </div>

        <div>
          <input
            id='input_msg'
            className="testao-input-message"
            placeholder="message"
            value={this.state.msg}
            onChange={(e) => this.setState({ msg: e.target.value })}
            onKeyDown={this.handleKeyDown}
          />
          <button className="testao-send-button" onClick={() => this.sendMessage()}>Send</button>
        </div>

        {/* <MessageModal message={this.state.message} /> */}
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default HomePage;