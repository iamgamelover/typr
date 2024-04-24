import React from 'react';
import './Portrait.css';
import { publish, subscribe } from '../util/event';
import { AOT_TEST, AO_TWITTER, LUA } from '../util/consts';
import {
  connectWallet, evaluate, getDefaultProcess, getProfile, getTokenBalance,
  getWalletAddress, isLoggedIn, messageToAO, randomAvatar, shortStr, spawnProcess, timeOfNow
} from '../util/util';
import { Server } from '../../server/server';
import { Tooltip } from 'react-tooltip';
import QuestionModal from '../modals/QuestionModal';
import { BsWallet2 } from 'react-icons/bs';

declare var window: any;

interface PortraitProps {
  // address: string;
}

interface PortraitState {
  avatar: string;
  nickname: string;
  address: string;
  question: string;
}

class Portrait extends React.Component<PortraitProps, PortraitState> {


  constructor(props: PortraitProps) {
    super(props);
    this.state = {
      avatar: '',
      nickname: '',
      address: '',
      question: '',
    };

    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });

    subscribe('profile-updated', () => {
      this.getProfile(this.state.address);
    });
  }

  componentDidMount() {
    this.start();
    // window.addEventListener('scroll', this.atBottom);
  }

  componentWillUnmount(): void {
  }

  async start() {
    let address = await isLoggedIn();
    console.log("portrait -> address:", address)
    this.setState({ address })
    this.getProfile(address)
  }

  async connectWallet() {
    let connected = await connectWallet();
    if (connected) {
      let address = await getWalletAddress();
      console.log("connectWallet -> address:", address)
      // this.setState({ isLoggedIn: 'true', address });

      Server.service.setIsLoggedIn(address);
      Server.service.setActiveAddress(address);
      publish('wallet-events');

      this.setState({ address });

      if (await this.getProfile(address) == false)
        this.register(address);

      // your own process 
      let process = await getDefaultProcess(address);
      console.log("Your process:", process)

      // Spawn a new process
      if (!process) {
        process = await spawnProcess();
        console.log("Spawn --> processId:", process)
      }

      setTimeout(async () => {
        // load lua code into the process
        let messageId = await evaluate(process, LUA);
        console.log("evaluate -->", messageId)
      }, 10000);

      // for testing - will be removed
      // this.setState({ temp_tip: true, process });

      let bal_aot = await getTokenBalance(AOT_TEST, process);
      console.log("bal_aot:", bal_aot)
      Server.service.setBalanceOfAOT(bal_aot);
    }
  }

  // Register one user
  // This is a temp way, need to search varibale Members
  // to keep one, on browser side or AOS side (in lua code)
  async register(address: string) {
    console.log('--> register')
    let nickname = shortStr(address, 4);
    let data = { address, avatar: randomAvatar(), banner: '', nickname, bio: '', time: timeOfNow() };
    messageToAO(AO_TWITTER, data, 'Register');
  }

  async disconnectWallet() {
    await window.arweaveWallet.disconnect();
    this.setState({ address: '', question: '' });

    Server.service.setIsLoggedIn('');
    Server.service.setActiveAddress('');
    publish('wallet-events');
  }

  onQuestionYes() {
    this.disconnectWallet();
  }

  onQuestionNo() {
    this.setState({ question: '' });
  }

  async getProfile(address: string) {
    let profile = Server.service.getProfile(address);
    console.log("cached profile:", profile)

    if (!profile) { // no cache
      profile = await getProfile(address);
      console.log("portrait -> profile:", profile)

      if (profile.length > 0) {
        profile = profile[0];
        Server.service.addProfileToCache(profile);
        // return true;
      }
      else
        return false;
    }

    this.setState({ address, avatar: profile.avatar, nickname: profile.nickname });
    return true;
  }

  render() {
    let address = this.state.address;
    let avatar = this.state.avatar;
    let shortAddr = shortStr(address, 4);

    return (
      <div>
        {/* {address ? avatar && */}
        {address
          ?
          <div
            className='site-page-portrait-container'
            data-tooltip-id="my-tooltip"
            data-tooltip-content="Disconnect from wallet"
            onClick={() => this.disconnectWallet()}
          // onClick={() => this.setState({ question: 'Disconnect?' })}
          >
            <img
              className='site-page-portrait'
              src={avatar ? avatar : randomAvatar()}
            />
            <div>
              <div className="site-page-nickname">
                {this.state.nickname ? this.state.nickname : shortAddr}
              </div>
              <div className="site-page-addr">{shortAddr}</div>
            </div>
          </div>
          :
          <div className="app-icon-button connect" onClick={() => this.connectWallet()}>
            <BsWallet2 size={20} />Connect
          </div>
        }

        <Tooltip id="my-tooltip" />
        {/* <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} /> */}
      </div>
    );
  }
}

export default Portrait;