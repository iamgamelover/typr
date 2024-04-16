import React from 'react';
import './TokenPage.css';
import { getTokenBalance, getDefaultProcess, getWalletAddress, numberWithCommas, transferToken } from '../util/util';
import { CRED, AOT_TEST } from '../util/consts';
import { dryrun } from "@permaweb/aoconnect/browser";
import MessageModal from '../modals/MessageModal';
import { Server } from '../../server/server';

declare var window: any;

interface TokenPageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  address: string;
  process: string;
  balOfCRED: number;
  balOfAOT: number;
  hasAOT: boolean;
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
      balOfCRED: 0,
      balOfAOT: 0,
      hasAOT: true,
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    let address = await getWalletAddress();
    let process = await getDefaultProcess(address);
    this.setState({ address, process });

    let balOfCRED = await getTokenBalance(CRED, process);
    if (balOfCRED.length > 3) {
      const length = balOfCRED.length;
      balOfCRED = balOfCRED.slice(0, length - 3) + '.' + balOfCRED.slice(length - 3);
    }

    this.setState({ balOfCRED });
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

  async getAOT() {
    let address = this.state.process;
    this.setState({ message: 'Get AOT-Test...' });
    await transferToken(AOT_TEST, address, '10000');
    await this.displayAOT(address);
    this.setState({ message: '' });
  }

  render() {
    return (
      <div className='token-page'>
        {/* <div className='token-page-card'>
          <div className='token-page-title'>Your wallet address</div>
          <div className='token-page-text'>{this.state.address}</div>
        </div> */}

        <div className='token-page-card'>
          <div className='token-page-title'>Your Process ID</div>
          <div className='token-page-text'>{this.state.process}</div>
        </div>

        <div className='token-page-card'>
          <div className='token-page-title'>AOCRED-Test &nbsp;&nbsp;&nbsp; (AO testnet token)</div>
          {this.state.loading
            ? <div id="loading" />
            : <div className='token-page-text balance'>{this.state.balOfCRED}</div>
          }
        </div>

        <div className='token-page-card'>
          <div className='token-page-title'>AOT-Test &nbsp;&nbsp;&nbsp; (AO Twitter testnet token)</div>
          {this.state.loading
            ? <div id="loading" />
            : <div className='token-page-text balance'>{numberWithCommas(this.state.balOfAOT)}</div>
          }
        </div>

        {/* <div className='token-page-label'>Name</div>
        <input
          className="token-page-input"
          placeholder="nickname"
          value={this.state.nickname}
          onChange={this.onChangeName}
        /> */}

        {!this.state.hasAOT &&
          <div><button onClick={() => this.getAOT()}>Get 10,000 AOT-Test</button></div>
        }

        {/* <div className='token-page-card'>
          <div className='token-page-process-id'>Staking</div>
          <div className='token-page-text balance'>1000.000</div>
        </div> */}

        {/* <div className='token-page-card'>
          <div className='token-page-header'>
            <div className='token-page-process-id'>Voting</div>
            <div className='token-page-text-small'>which one feature should be put in.</div>
          </div>
          <div className='token-page-vote'>
            (10) A profile page which updating avatar and nickname.
          </div>
          <div className='token-page-vote'>
            (20) Like function: the clickable heart icon.
          </div>
          <div className='token-page-vote'>
            (30) A Big Plan: The Token Economic System.
          </div>
        </div> */}

        <MessageModal message={this.state.message} />
      </div>
    )
  }
}

export default TokenPage;