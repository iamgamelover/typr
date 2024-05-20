import React from 'react';
import './TokenPage.css';
import {
  getTokenBalance, getDefaultProcess, getWalletAddress,
  numberWithCommas, transferToken, evaluate, spawnProcess,
  formatBalance
} from '../util/util';
import { CRED, AOT_TEST, TRUNK, LUA, WAR, AR_DEC, TIP_CONN, ORBT } from '../util/consts';
import { dryrun } from "@permaweb/aoconnect/browser";
import MessageModal from '../modals/MessageModal';
import { Server } from '../../server/server';
import Loading from '../elements/Loading';

declare var window: any;

interface TokenPageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  address: string;
  process: string;
  hasAOT: boolean;
  isLoaded: boolean;
  balOfCRED: number;
  balOfAOT: number;
  balOfTRUNK: number;
  balOfWAR: number;
  balOf0rbit: number;
}

class TokenPage extends React.Component<{}, TokenPageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      question: '',
      alert: '',
      message: '',
      loading: true,
      address: '',
      process: '',
      hasAOT: true,
      isLoaded: false,
      balOfCRED: 0,
      balOfAOT: 0,
      balOfTRUNK: 0,
      balOfWAR: 0,
      balOf0rbit: 0,
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    let address = await getWalletAddress();
    let process = await getDefaultProcess(address);
    this.setState({ address, process });

    if (!process) {
      this.setState({ loading: false });
      return;
    }

    let balOfCRED = await getTokenBalance(CRED, process);
    // balOfCRED = formatBalance(balOfCRED, 3);
    Server.service.setBalanceOfCRED(balOfCRED);

    let balOfTRUNK = await getTokenBalance(TRUNK, process);
    // balOfTRUNK = formatBalance(balOfTRUNK, 3);
    Server.service.setBalanceOfTRUNK(balOfTRUNK);

    let balOfWAR = await getTokenBalance(WAR, process);
    balOfWAR = balOfWAR / AR_DEC;
    // console.log("balOfWAR:", balOfWAR)
    Server.service.setBalanceOfWAR(balOfWAR);

    let balOf0rbit = await getTokenBalance(ORBT, process);
    balOf0rbit = balOf0rbit / AR_DEC;
    // console.log("balOf0rbit:", balOf0rbit)
    Server.service.setBalanceOf0rbit(balOf0rbit);

    this.setState({ balOfCRED, balOfTRUNK, balOfWAR, balOf0rbit });
    this.displayAOT(process);
  }

  async displayAOT(address: string) {
    let balOfAOT = await getTokenBalance(AOT_TEST, address);
    Server.service.setBalanceOfAOT(balOfAOT);
    this.setState({ balOfAOT, loading: false });

    // You can only get token-test once
    let balances = await this.getBalances(AOT_TEST);
    if (balances.indexOf(address) != -1)
      this.setState({ hasAOT: true });
    else
      this.setState({ hasAOT: false });
  }

  async getBalances(process: string) {
    const result = await dryrun({
      process: process,
      tags: [
        { name: 'Action', value: 'Balances' },
      ],
    });

    // console.log("getBalances:", result)
    return result.Messages[0].Data;
  }

  async spawn() {
    this.setState({ message: 'Spawn...' });

    let new_process = await spawnProcess();
    console.log("Spawn --> new_process:", new_process)

    this.setState({ message: '', loading: true });
    this.start();
  }

  async loadCode() {
    this.setState({ message: 'Upload...' });

    // load lua code into user's process
    let messageId = await evaluate(this.state.process, LUA);
    console.log("Upload successfully -->", messageId)
    this.setState({ isLoaded: true, message: '' });
  }

  async getAOT() {
    let address = this.state.process;
    this.setState({ message: 'Get AOT-Test...' });
    await transferToken(AOT_TEST, address, '10000');
    await this.displayAOT(address);
    this.setState({ message: '' });
  }

  renderTokens() {
    let tokens = ['Wrapped AR', 'AOCRED-Test', 'AOT-Test', 'TRUNK', '0rbit'];
    let icons = ['./logo-war.png', './logo-ao.png', './logo.png', './logo-trunk.png', './logo-0rbit.jpg'];
    let bals = [this.state.balOfWAR, this.state.balOfCRED, this.state.balOfAOT, this.state.balOfTRUNK, this.state.balOf0rbit];

    let divs = [];
    for (let i = 0; i < tokens.length; i++) {
      divs.push(
        <div key={i} className='token-page-card'>
          <img className={`token-page-icon ${i !== 2 && 'cred'} ${i == 4 && 'circle'}`} src={icons[i]} />
          <div>
            <div className='token-page-title'>{tokens[i]}</div>
            {this.state.loading
              ? <Loading marginTop='5px' />
              : <div className='token-page-text balance'>{bals[i]}</div>
            }
          </div>
        </div>
      )
    }

    return divs
  }

  render() {
    let isLoggedIn = Server.service.isLoggedIn();
    let process = this.state.process;
    if (!process) process = 'No process yet, tap on the spawn button.';
    if (!isLoggedIn) process = TIP_CONN;

    return (
      <div className='token-page'>
        <div className='token-page-card process'>
          <div className='token-page-title'>Your Process ID</div>
          {this.state.loading
            ? <Loading marginTop='5px' />
            : <div className='token-page-text'>{process}</div>
          }
        </div>

        {!this.state.loading && isLoggedIn &&
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
        }

        {this.state.isLoaded &&
          <div className='token-page-prompt'>Upload the code to your process successfully.</div>
        }

        <div className="token-page-balance-title">Balances</div>
        <div className='token-page-balance-line' />

        <div className='token-page-token-row'>
          {this.renderTokens()}
        </div>

        {!this.state.hasAOT &&
          <div><button onClick={() => this.getAOT()}>Get 10,000 AOT-Test</button></div>
        }

        <MessageModal message={this.state.message} />
      </div>
    )
  }
}

export default TokenPage;