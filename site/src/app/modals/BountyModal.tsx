import React from 'react';
import { BsFillXCircleFill } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './BountyModal.css'
import MessageModal from './MessageModal';
import { formatBalance, getDefaultProcess, getTokenBalance, messageToAO, numberWithCommas, updateTokenBalances, timeOfNow, transferToken, transferTokenAward, trimDecimal } from '../util/util';
import { MdOutlineToken } from "react-icons/md";
import { AiOutlineFire } from 'react-icons/ai';
import { Server } from '../../server/server';
import { AO_STORY, AO_TWITTER, AR_DEC, TOKEN_DENO, TOKEN_ICON, TOKEN_NAME, TOKEN_PID } from '../util/consts';
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
}

class BountyModal extends React.Component<BountyModalProps, BountyModalState> {

  tokenPicked = 0;
  balances: any[] = [];

  constructor(props: BountyModalProps) {
    super(props);
    this.state = {
      message: '',
      alert: '',
      bounty: 1,
      loading: false,
    }

    this.onClose = this.onClose.bind(this);
    this.onChangeBounty = this.onChangeBounty.bind(this);

    subscribe('get-bal-done', () => {
      this.setState({ loading: false });
    });
  }

  componentDidMount() {
    if (!Server.service.getBalanceOfTRUNK())
      this.setState({ loading: true });
  }

  onChangeBounty(e: any) {
    this.setState({ bounty: e.currentTarget.value });
  }

  onClose() {
    this.props.onClose();
  }

  fillQty(qty: number) {
    this.setState({ bounty: qty });
  }

  onFilter(index: number) {
    if (this.tokenPicked === index) return;
    this.tokenPicked = index;
    // this.renderTokens();
    this.forceUpdate();
  }

  renderTokens() {
    let bal_ao = Server.service.getBalanceOfAO();
    let bal_war = Server.service.getBalanceOfWAR();
    let bal_trunk = Server.service.getBalanceOfTRUNK();

    if (!this.state.loading) {
      bal_ao = Number(trimDecimal(bal_ao, 5));
      bal_war = Number(trimDecimal(bal_war, 5));
      bal_trunk = Number(trimDecimal(bal_trunk, 5));
    }

    this.balances = [bal_ao, bal_war, bal_trunk];

    let divs = [];
    for (let i = 0; i < this.balances.length; i++) {
      let tokenName = TOKEN_NAME.get(i);
      let tokenIcon = TOKEN_ICON.get(tokenName);

      divs.push(
        <div
          key={i}
          className={`bounty-modal-token-card ${this.tokenPicked == i ? 'picked' : ''}`}
          onClick={() => this.onFilter(i)}
        >
          <img className='bounty-modal-token-icon' src={tokenIcon} />
          <div>
            <div className='bounty-modal-token-name'>{tokenName}</div>
            {this.state.loading
              ? <Loading marginTop='2px' />
              : <div className='bounty-modal-token-balance'>{this.balances[i]}</div>
            }
          </div>
        </div>
      )
    }

    return divs
  }

  renderTokenLabel() {
    let divs = [];
    let qty = [0.1, 0.5, 1, 2, 5, 10];

    for (let i = 0; i < qty.length; i++) {
      divs.push(
        <div key={i} className='bounty-modal-token' onClick={() => this.fillQty(qty[i])}>
          {/* <MdOutlineToken size={20} />{qty[i]} */}
          {qty[i]}
        </div>
      )
    }

    return divs;
  }

  async onBounty() {
    this.setState({ message: 'Bounty...' });

    // your own active address 
    let from = Server.service.getActiveAddress();
    console.log("from:", from)

    // the wallet address of post to tranfer a bounty
    let to = this.props.data.address;
    console.log("to:", to)

    let alert;
    let bal = this.balances[this.tokenPicked];
    console.log("bal:", bal)
    if (!bal) bal = 0;

    let qty = Math.abs(this.state.bounty);
    console.log("qty:", qty)

    if (qty == 0)
      alert = 'Bounty is zero.';
    if (qty > bal)
      alert = 'Insufficient balance.';

    if (alert) {
      this.setState({ alert, message: '' });
      return;
    }

    let target = TOKEN_PID.get(this.tokenPicked);
    console.log("target:", target)

    // formating the qty
    let fQty = qty * 10 ** TOKEN_DENO.get(this.tokenPicked);
    console.log("formating qty:", fQty)

    // await transferToken(from, to, qty, target);
    let response = await transferTokenAward(target, to, fQty.toString());
    if (!response) {
      this.setState({ alert: 'You cancelled the bounty.', message: '' });
      return;
    }

    this.onClose();
    this.setState({ message: '' });
    updateTokenBalances(from);

    // refreshing the number that displayed on the post.
    let quantity = Number(this.props.data.coins) + qty;
    this.props.onBounty(quantity.toString());

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
      address: from,
      token_name: TOKEN_NAME.get(this.tokenPicked),
      quantity: qty,
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