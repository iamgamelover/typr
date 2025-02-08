import React from 'react';
import './TokenPage.css';
import {
  getTokenBalance, getWalletAddress,
  uploadCodeToProcess, spawnProcess,
  getTokenDenomination,
  getTokenBalanceWithWalletApi
} from '../util/util';
import { TRUNK, LUA, WAR, TIP_CONN, AO, TOKEN_NAME, TOKEN_ICON } from '../util/consts';
import MessageModal from '../modals/MessageModal';
import { Server } from '../../server/server';
import Loading from '../elements/Loading';
import { subscribe } from '../util/event';

declare var window: any;

interface TokenPageState {
  question: string;
  alert: string;
  message: string;
  // loading: boolean;
  address: string;
  process: string;
  hasAOT: boolean;
  isLoaded: boolean;
  balOfAO: string;
  balOfTRUNK: string;
  balOfWAR: string;
  balOf0rbit: string;
  balOfUSDA: string;
}

class TokenPage extends React.Component<{}, TokenPageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      question: '',
      alert: '',
      message: '',
      // loading: false,
      address: '',
      process: '',
      hasAOT: true,
      isLoaded: false,
      balOfAO: '--',
      balOfTRUNK: '--',
      balOfWAR: '--',
      balOf0rbit: '--',
      balOfUSDA: '--',
    };

    subscribe('wallet-events', () => {
      this.start();
    });
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    let address = await getWalletAddress();
    // console.log("address:", address)
    this.setState({ address });

    let balOfTRUNK = await getTokenBalance(TRUNK, address);
    Server.service.setBalanceOfTRUNK(balOfTRUNK);

    let balOfWAR = await getTokenBalance(WAR, address);
    Server.service.setBalanceOfWAR(balOfWAR);

    // temp for ao token
    let balOfAO = await getTokenBalanceWithWalletApi(AO);
    console.log("balOfAO:", balOfAO)
    Server.service.setBalanceOfAO(Number(balOfAO));
    // --> should use this way
    // let balOfAO = await getTokenBalance(AO, address);

    this.setState({ balOfAO, balOfTRUNK, balOfWAR });
  }

  // async displayAOT(address: string) {
  //   let balOfAOT = await getTokenBalance(AOT_TEST, address);
  //   // console.log("balOfAOT:", balOfAOT)
  //   Server.service.setBalanceOfAOT(balOfAOT);
  //   this.setState({ balOfAOT, loading: false });

  //   // You can only get token-test once
  //   let balances = await this.getBalances(AOT_TEST);
  //   if (balances.indexOf(address) != -1)
  //     this.setState({ hasAOT: true });
  //   else
  //     this.setState({ hasAOT: false });
  // }

  // async getBalances(process: string) {
  //   const result = await dryrun({
  //     process: process,
  //     tags: [
  //       { name: 'Action', value: 'Balances' },
  //     ],
  //   });

  //   // console.log("getBalances:", result)
  //   return result.Messages[0].Data;
  // }

  async spawn() {
    this.setState({ message: 'Spawn...' });

    let new_process = await spawnProcess();
    // console.log("Spawn --> new_process:", new_process)

    this.setState({ message: '' });
    this.start();
  }

  async loadCode() {
    this.setState({ message: 'Upload...' });

    // load lua code into user's process
    let messageId = await uploadCodeToProcess(this.state.process, LUA);
    // console.log("Upload successfully -->", messageId)
    this.setState({ isLoaded: true, message: '' });
  }

  // async getAOT() {
  //   let address = this.state.process;
  //   this.setState({ message: 'Get AOT-Test...' });
  //   await transferToken(AOT_TEST, address, '10000');
  //   await this.displayAOT(address);
  //   this.setState({ message: '' });
  // }

  renderTokens() {
    let divs = [];
    let balances = [this.state.balOfAO, this.state.balOfWAR, this.state.balOfTRUNK];

    for (let i = 0; i < balances.length; i++) {
      let tokenName = TOKEN_NAME.get(i);
      let tokenIcon = TOKEN_ICON.get(tokenName);
      divs.push(
        <div key={i} className='token-page-card'>
          <img className='token-page-icon' src={tokenIcon} />
          <div>
            <div className='token-page-title'>{tokenName}</div>
            <div className='token-page-text balance'>{balances[i]}</div>
          </div>
        </div>
      )
    }

    return divs;
  }

  render() {
    let isLoggedIn = Server.service.isLoggedIn();
    let address = this.state.address;
    // if (!process) process = 'No process yet, tap on the spawn button.';
    if (!isLoggedIn) address = TIP_CONN;

    return (
      <div className='token-page'>
        <div className='token-page-card process'>
          <div className='token-page-title'>Active wallet address</div>
          <div className='token-page-text'>{address}</div>
        </div>

        {/* {!this.state.loading && isLoggedIn &&
          <div>
            <button onClick={() => this.loadCode()}>Upload the code</button>

            {!this.state.process &&
              <button
                className='token-page-button-spawn'
                onClick={() => this.spawn()}
              >
                Spawn a process
              </button>
            }
          </div>
        } */}

        {/* {this.state.isLoaded &&
          <div className='token-page-prompt'>Upload the code to your process successfully.</div>
        } */}

        <div className="token-page-balance-title">Balances</div>
        <div className='token-page-balance-line' />

        <div className='token-page-token-row'>
          {this.renderTokens()}
        </div>

        {/* {!this.state.hasAOT &&
          <div><button onClick={() => this.getAOT()}>Get 10,000 AOT-Test</button></div>
        } */}

        <MessageModal message={this.state.message} />
      </div>
    )
  }
}

export default TokenPage;