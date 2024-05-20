import React from 'react';
import { BsFillXCircleFill } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './BountyModal.css'
import MessageModal from './MessageModal';
import { formatBalance, getDefaultProcess, getTokenBalance, messageToAO, numberWithCommas, timeOfNow, transferToken, trimDecimal } from '../util/util';
import { MdOutlineToken } from "react-icons/md";
import { AiOutlineFire } from 'react-icons/ai';
import { Server } from '../../server/server';
import { AO_STORY, AO_TWITTER, AR_DEC, TOKEN_NAME, TOKEN_PID, TRUNK } from '../util/consts';
import Loading from '../elements/Loading';
import { subscribe } from '../util/event';

interface BountyModalProps {
  open: boolean;
  onClose: Function;
  onBounty: Function;
  data: any;
  isReply?: boolean;
  isStory?: boolean;
}

interface BountyModalState {
  message: string;
  alert: string;
  bounty: number;
  loading: boolean;
  balOfCRED: number;
  balOfAOT: number;
  balOfTRUNK: number;
  unit: string;
}

class BountyModal extends React.Component<BountyModalProps, BountyModalState> {

  tokenPicked = 0;

  constructor(props: BountyModalProps) {
    super(props);

    this.state = {
      message: '',
      alert: '',
      bounty: 1,
      loading: false,
      balOfCRED: 0,
      balOfAOT: 0,
      balOfTRUNK: 0,
      unit: 'winston'
    }

    this.onClose = this.onClose.bind(this);
    this.onChangeBounty = this.onChangeBounty.bind(this);

    subscribe('get-bal-done', () => {
      this.setState({ loading: false });
    });
  }

  componentDidMount() {
    // this.start();
    if (!Server.service.getBalanceOfTRUNK())
      this.setState({ loading: true });
  }

  onChangeBounty(e: any) {
    this.setState({ bounty: e.currentTarget.value });
  }

  // async start() {
  // }

  onClose() {
    this.props.onClose();
  }

  fillQty(qty: number) {
    this.setState({ bounty: qty });
  }

  onFilter(index: number) {
    if (this.tokenPicked === index) return;

    this.tokenPicked = index;
    this.renderTokens();
    // this.forceUpdate();
    if (index == 0)
      this.setState({ unit: 'winston' });
    else
      this.setState({ unit: 'unit' });
  }

  renderTokens() {
    let tokens = ['Wrapped AR', 'TRUNK', 'AOCRED-Test', 'AOT-Test', '0rbit'];
    let icons = ['./logo-war.png', './logo-trunk.png', './logo-ao.png', './logo.png', './logo-0rbit.jpg'];

    let bal_war = Server.service.getBalanceOfWAR();
    let bal_trunk = Server.service.getBalanceOfTRUNK();
    let bal_cred = Server.service.getBalanceOfCRED();
    let bal_aot = Server.service.getBalanceOfAOT();
    let bal_0rbit = Server.service.getBalanceOf0rbit();

    if (!this.state.loading) {
      bal_war = Number(trimDecimal(bal_war, 5));
      bal_0rbit = Number(trimDecimal(bal_0rbit, 5));
    }

    let balances = [bal_war, bal_trunk, bal_cred, bal_aot, bal_0rbit];

    let divs = [];
    for (let i = 0; i < tokens.length; i++) {
      divs.push(
        <div
          key={i}
          className={`bounty-modal-token-card ${this.tokenPicked == i ? 'picked' : ''}`}
          onClick={() => this.onFilter(i)}
        >
          <img className={`bounty-modal-token-icon ${(i == 2 || i == 3) && 'cred'} ${i == 4 && 'circle'}`} src={icons[i]} />
          <div>
            {/* <div className='bounty-modal-token-name'>{tokens[i]}</div> */}
            {this.state.loading
              ? <Loading marginTop='10px' />
              : <div className='bounty-modal-token-balance'>{balances[i]}</div>
            }
          </div>
        </div>
      )
    }

    return divs
  }

  renderTokenLabel() {
    let divs = [];
    let qty = [2, 5, 10, 50, 100];

    for (let i = 0; i < qty.length; i++) {
      divs.push(
        <div key={i} className='bounty-modal-token' onClick={() => this.fillQty(qty[i])}>
          <MdOutlineToken size={20} />{qty[i]}
        </div>
      )
    }

    return divs;
  }

  async onBounty() {
    let bal_tokens = new Map([
      [0, Server.service.getBalanceOfWAR()],
      [1, Server.service.getBalanceOfTRUNK()],
      [2, Server.service.getBalanceOfCRED()],
      [3, Server.service.getBalanceOfAOT()],
      [4, Server.service.getBalanceOf0rbit()]
    ]);

    this.setState({ message: 'Bounty...' });

    // your own process 
    let from = Server.service.getDefaultProcess();
    console.log("from:", from)

    // the user's process to tranfer a bounty
    let to = await getDefaultProcess(this.props.data.address);
    console.log("to:", to)

    let alert;
    let bal = bal_tokens.get(this.tokenPicked);

    // Wrapped AR or 0rbit
    if (this.tokenPicked == 0 || this.tokenPicked == 4) {
      bal = bal * AR_DEC;
    }
    console.log("bal:", bal)

    let qty = Math.abs(this.state.bounty).toString();
    console.log("qty:", qty)

    if (!to)
      alert = 'Has not a default process to transfer bounty.';
    if (qty == '0')
      alert = 'Bounty is zero.';
    if (!Number.isInteger(Number(qty)))
      alert = 'Must be an integer and > 1.';
    if (Number(qty) > bal)
      alert = 'Insufficient balance.';

    if (alert) {
      this.setState({ alert, message: '' });
      return;
    }

    let target = TOKEN_PID.get(this.tokenPicked);
    console.log("target:", target)

    await transferToken(from, to, qty, target);

    this.onClose();
    this.setState({ message: '' });

    // refreshing the number that displayed on the post.
    let quantity = Number(this.props.data.coins) + Number(qty);
    this.props.onBounty(quantity.toString());

    let bal_new = bal - Number(qty);
    switch (this.tokenPicked) {
      case 0:
        bal_new = bal_new / AR_DEC;
        Server.service.setBalanceOfWAR(bal_new);
        break;
      case 1:
        Server.service.setBalanceOfTRUNK(bal_new);
        break;
      case 2:
        Server.service.setBalanceOfCRED(bal_new);
        break;
      case 3:
        Server.service.setBalanceOfAOT(bal_new);
        break;
      case 4:
        bal_new = bal_new / AR_DEC;
        console.log("bal_new:", bal_new)
        Server.service.setBalanceOf0rbit(bal_new);
        break;
    }

    // update the bounty (coins)
    let data = { id: this.props.data.id, coins: qty };
    let action = 'UpdateBounty';
    if (this.props.isReply) action = 'UpdateBountyForReply';

    if (this.props.isStory)
      await messageToAO(AO_STORY, data, action);
    else
      await messageToAO(AO_TWITTER, data, action);

    // add the record of a bounty
    let records = {
      id: data.id,
      address: Server.service.getActiveAddress(),
      token_name: TOKEN_NAME.get(this.tokenPicked),
      quantity: Number(qty),
      time: timeOfNow()
    };
    // console.log("records:", records)
    messageToAO(AO_TWITTER, records, 'Records-Bounty');
  }

  render() {
    if (!this.props.open)
      return (<div></div>);

    return (
      <div className="modal open" onClick={e => e.stopPropagation()}>
        <div className="modal-content bounty-modal-content">
          <button className="modal-close-button" onClick={this.onClose}>
            <BsFillXCircleFill />
          </button>

          <div className='bounty-modal-header-row'>
            <div className="bounty-modal-header-title">Bounty</div>
            {/* <div className='bounty-modal-header-balance'>
              <MdOutlineToken size={20} />
              {numberWithCommas(Number(Server.service.getBalanceOfAOT()))}
            </div> */}
          </div>

          <div className='bounty-modal-header-line' />
          <div>If you like these words.</div>
          <div>Do a bounty to inspire more good words.</div>

          <div className='bounty-modal-tokens-title'>Pick a token</div>
          <div className='bounty-modal-header-line tokens' />
          <div className='bounty-modal-token-row choose'>
            {this.renderTokens()}
          </div>

          <div className='bounty-modal-token-row'>
            {this.renderTokenLabel()}
          </div>

          <div className='bounty-modal-token-row bounty'>
            <input
              id='bounty-input'
              className="bounty-modal-input"
              placeholder="0"
              type="number"
              value={this.state.bounty}
              onChange={this.onChangeBounty}
            />

            <div className='bounty-modal-label-unit'>{this.state.unit}</div>

            {!this.state.loading &&
              <div className='bounty-modal-token bounty' onClick={() => this.onBounty()}>
                <AiOutlineFire size={20} />Bounty
              </div>
            }
          </div>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default BountyModal;