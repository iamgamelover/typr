import React from 'react';
import './TokenPage.css';
import { getWalletAddress, updateTokenBalances } from '../util/util';
import { TIP_CONN, TOKEN_NAME, TOKEN_ICON } from '../util/consts';
import MessageModal from '../modals/MessageModal';
import { Server } from '../../server/server';
import { subscribe } from '../util/event';
import Loading from '../elements/Loading';

declare var window: any;

interface TokenPageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  address: string;
  balOfAO: number;
  balOfTRUNK: number;
  balOfWAR: number;
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
      balOfAO: 0,
      balOfWAR: 0,
      balOfTRUNK: 0,
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
    console.log("address:", address)
    this.setState({ address, loading: true });

    if (!Server.service.getBalanceOfTRUNK()) {
      await updateTokenBalances(address);
    }

    let balOfAO = Number(Server.service.getBalanceOfAO().toFixed(5));
    let balOfWAR = Number(Server.service.getBalanceOfWAR().toFixed(5));
    let balOfTRUNK = Server.service.getBalanceOfTRUNK();

    this.setState({ balOfAO, balOfWAR, balOfTRUNK, loading: false });
  }

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
            {this.state.loading
              ? <Loading marginTop='3px' />
              : <div className='token-page-text balance'>{balances[i]}</div>
            }
          </div>
        </div>
      )
    }

    return divs;
  }

  render() {
    let isLoggedIn = Server.service.isLoggedIn();
    let address = this.state.address;
    if (!isLoggedIn) address = TIP_CONN;

    return (
      <div className='token-page'>
        <div className='token-page-card process'>
          <div className='token-page-title'>Active wallet address</div>
          <div className='token-page-text'>{address}</div>
        </div>

        <div className="token-page-balance-title">Balances</div>
        <div className='token-page-balance-line' />

        <div className='token-page-token-row'>
          {this.renderTokens()}
        </div>

        <MessageModal message={this.state.message} />
      </div>
    )
  }
}

export default TokenPage;