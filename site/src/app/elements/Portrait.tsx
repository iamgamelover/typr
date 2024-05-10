import React from 'react';
import './Portrait.css';
import { publish, subscribe } from '../util/event';
import { AOT_TEST, AO_STORY, AO_TWITTER, LUA } from '../util/consts';
import {
  connectWallet, evaluate, getDefaultProcess, getProfile, getTokenBalance,
  getWalletAddress, isLoggedIn, messageToAO, randomAvatar, shortAddr, shortStr, spawnProcess, timeOfNow
} from '../util/util';
import { Server } from '../../server/server';
import { Tooltip } from 'react-tooltip';
import QuestionModal from '../modals/QuestionModal';
import { BsToggleOn, BsWallet2 } from 'react-icons/bs';
import * as Othent from "@othent/kms";
import MessageModal from '../modals/MessageModal';

import {
  connect,
  disconnect,
  getActiveAddress,
} from "@othent/kms";

declare var window: any;

interface PortraitProps {
  // address: string;
}

interface PortraitState {
  avatar: string;
  nickname: string;
  address: string;
  question: string;
  message: string;
}

class Portrait extends React.Component<PortraitProps, PortraitState> {

  constructor(props: PortraitProps) {
    super(props);
    this.state = {
      avatar: '',
      nickname: '',
      address: '',
      question: '',
      message: '',
    };

    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });

    subscribe('profile-updated', () => {
      this.isExisted(this.state.address);
    });
  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount(): void {
  }

  async start() {
    let address = await isLoggedIn();
    // console.log("portrait -> address:", address)
    this.setState({ address })
    this.isExisted(address)
  }

  async connect2Othent() {
    try {
      this.setState({ message: 'Connecting...' });
      let res = await connect();
      // let res = await Othent.connect();
      console.log("res:", res)

      window.arweaveWallet = Othent;
      this.afterConnected(res.walletAddress, res);
    } catch (error) {
      console.log(error)
      this.setState({ message: '' });
    }
  }

  async connect2ArConnect() {
    let connected = await connectWallet();
    if (connected) {
      let address = await getWalletAddress();
      this.afterConnected(address);
    }
  }

  async afterConnected(address: string, othent?: any) {
    Server.service.setIsLoggedIn(address);
    Server.service.setActiveAddress(address);
    publish('wallet-events');

    if (othent)
      this.setState({ avatar: othent.picture, nickname: othent.name });

    this.setState({ address, message: '' });

    if (await this.isExisted(address) == false)
      this.register(address, othent);

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

    let bal_aot = await getTokenBalance(AOT_TEST, process);
    console.log("bal_aot:", bal_aot)
    Server.service.setBalanceOfAOT(bal_aot);
  }

  async register(address: string, othent?: any) {
    console.log('--> register')

    let nickname = shortAddr(address, 4);
    let data = { address, avatar: randomAvatar(), banner: '', nickname, bio: '', time: timeOfNow() };

    if (othent) {
      data = { address, avatar: othent.picture, banner: '', nickname: othent.name, bio: '', time: timeOfNow() };
    }

    messageToAO(AO_TWITTER, data, 'Register');
    messageToAO(AO_STORY, data, 'Register');
  }

  async disconnectWallet() {
    this.setState({ message: 'Disconnect...' });

    await window.arweaveWallet.disconnect();

    Server.service.setIsLoggedIn('');
    Server.service.setActiveAddress('');
    localStorage.removeItem('id_token');
    publish('wallet-events');

    this.setState({ address: '', question: '', message: '' });
  }

  onQuestionYes() {
    this.disconnectWallet();
  }

  onQuestionNo() {
    this.setState({ question: '' });
  }

  async isExisted(address: string) {
    let profile = Server.service.getProfile(address);
    // console.log("cached profile:", profile)

    if (!profile) { // no cache
      profile = await getProfile(address);
      // console.log("portrait -> profile:", profile)

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
    let shortAddress = shortAddr(address, 4);

    return (
      <div>
        {address
          ?
          <div
            className='portrait-div-container'
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
                {this.state.nickname ? shortStr(this.state.nickname, 15) : shortAddress}
              </div>
              <div className="site-page-addr">{shortAddress}</div>
            </div>
          </div>
          :
          <div>
            <div className='portrait-conn-pc'>
              <div className="app-icon-button connect" onClick={() => this.connect2ArConnect()}>
                <BsWallet2 size={20} />ArConnect
              </div>
              <div className='portrait-div-or'>- OR -</div>
              <div className="app-icon-button connect othent" onClick={() => this.connect2Othent()}>
                <BsToggleOn size={25} />Othent
              </div>
              <div className='portrait-label'>Google or others</div>
            </div>

            <div className='portrait-conn-mobile'>
              <div className="app-icon-button connect othent" onClick={() => this.connect2Othent()}>
                <BsToggleOn size={25} />Connect
              </div>
            </div>
          </div>
        }

        <Tooltip id="my-tooltip" />
        <MessageModal message={this.state.message} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    );
  }
}

export default Portrait;