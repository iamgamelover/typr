import React from 'react';
import './TokenPage.css';
import {
  getTokenBalance, getWalletAddress,
  uploadCodeToProcess, spawnProcess,
  getTokenDenomination
} from '../util/util';
import { TRUNK, LUA, WAR, TIP_CONN, AO } from '../util/consts';
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
  balOfAO: number;
  balOfTRUNK: number;
  balOfWAR: number;
  balOf0rbit: number;
  balOfUSDA: number;
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
      balOfAO: 0,
      balOfTRUNK: 0,
      balOfWAR: 0,
      balOf0rbit: 0,
      balOfUSDA: 0,
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {

    // Connect to the extension and request access to the ACCESS_TOKENS permission
// await window.arweaveWallet.connect(["ACCESS_TOKENS"]);

// Retrieve the list of tokens owned by the user
// const tokens = await window.arweaveWallet.userTokens();
// console.log("Tokens owned by the user:", tokens);

// try {
//   // Retrieve the balance of a user token
//   const tokenId = tokens[0].processId
//   const balance = await window.arweaveWallet.tokenBalance(tokenId);
//   console.log(`Balance of the token with ID ${tokenId}:`, balance);
// } catch (error) {
//   console.error("Error fetching token balance:", error);
// }


    let address = await getWalletAddress();
    console.log("address:", address)
    this.setState({ address });
    // let process = await getDefaultProcess(address);
    // this.setState({ address, process });

    // if (!process) {
    //   this.setState({ loading: false });
    //   return;
    // }

    let balOfAO = await getTokenBalance(AO, address);
    let deno = await getTokenDenomination(AO);
    console.log("deno:", deno)
    balOfAO = balOfAO / 10 ** deno;
    Server.service.setBalanceOfAO(balOfAO);

    let balOfTRUNK = await getTokenBalance(TRUNK, address);
    deno = await getTokenDenomination(TRUNK);
    balOfTRUNK = balOfTRUNK / 10 ** deno;
    // console.log("balOfTRUNK:", balOfTRUNK)
    Server.service.setBalanceOfTRUNK(balOfTRUNK);

    let balOfWAR = await getTokenBalance(WAR, address);
    deno = await getTokenDenomination(WAR);
    balOfWAR = balOfWAR / 10 ** deno;
    // console.log("balOfWAR:", balOfWAR)
    Server.service.setBalanceOfWAR(balOfWAR);

    this.setState({ balOfAO, balOfTRUNK, balOfWAR, loading: false });
    // this.displayAOT(process);
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

    this.setState({ message: '', loading: true });
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
    let tokens = ['AO', 'wAR', 'TRUNK'];
    let icons = ['./logo-ao-token.png', './logo-war.png', './logo-trunk.png'];
    let bals = [this.state.balOfAO, this.state.balOfWAR, this.state.balOfTRUNK];

    let divs = [];
    for (let i = 0; i < tokens.length; i++) {
      divs.push(
        <div key={i} className='token-page-card'>
          <img className='token-page-icon' src={icons[i]} />
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
    let address = this.state.address;
    // if (!process) process = 'No process yet, tap on the spawn button.';
    if (!isLoggedIn) address = TIP_CONN;

    return (
      <div className='token-page'>
        <div className='token-page-card process'>
          <div className='token-page-title'>Active wallet address</div>
          {this.state.loading
            ? <Loading marginTop='5px' />
            : <div className='token-page-text'>{address}</div>
          }
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