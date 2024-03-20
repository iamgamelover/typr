import React from 'react';
import './TokenPage.css';
import { getProcess, getWalletAddress } from '../util/util';


interface TokenPageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  address: string;
  process: string;
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
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    let address = await getWalletAddress();
    console.log("address:", address)

    let process = await getProcess(address);
    console.log("process:", process)
    this.setState({ process });
  }

  render() {
    return (
      <div className='token-page'>
        <div className='token-page-card'>
          <div className='token-page-process-id'>Your Process ID</div>
          <div className='token-page-text'>{this.state.process}</div>
        </div>

        <div className='token-page-card'>
          <div className='token-page-process-id'>CRED</div>
          <div className='token-page-text balance'>10,000.000</div>
        </div>

        <div className='token-page-card'>
          <div className='token-page-header'>
            <div className='token-page-process-id'>AOT</div>
            <div className='token-page-text-small'>A community governance token</div>
          </div>
          <div className='token-page-text balance'>20,000.000</div>
        </div>

        <div className='token-page-card'>
          <div className='token-page-process-id'>Staking</div>
          <div className='token-page-text balance'>1000.000</div>
        </div>

        <div className='token-page-card'>
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
        </div>
      </div>
    )
  }
}

export default TokenPage;