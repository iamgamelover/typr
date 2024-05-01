import React from 'react';
import { BsFillXCircleFill } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './BountyModal.css'
import MessageModal from './MessageModal';
import { getDefaultProcess, messageToAO, numberWithCommas, transferToken } from '../util/util';
import { MdOutlineToken } from "react-icons/md";
import { AiOutlineFire } from 'react-icons/ai';
import { Server } from '../../server/server';
import { AO_STORY, AO_TWITTER } from '../util/consts';

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
}

class BountyModal extends React.Component<BountyModalProps, BountyModalState> {

  constructor(props: BountyModalProps) {
    super(props);

    this.state = {
      message: '',
      alert: '',
      bounty: 1
    }

    this.onClose = this.onClose.bind(this);
    this.onChangeBounty = this.onChangeBounty.bind(this);
  }

  componentDidMount() {
    // this.start();
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

  renderTokenLabel() {
    let divs = [];
    let qty = [2, 5, 10, 50, 100];

    for (let i = 0; i < qty.length; i++) {
      divs.push(
        <div className='bounty-modal-token' onClick={() => this.fillQty(qty[i])}>
          <MdOutlineToken size={20} />{qty[i]}
        </div>
      )
    }

    return divs;
  }

  async onBounty() {
    this.setState({ message: 'Bounty...' });

    // your own process 
    let from = Server.service.getDefaultProcess();
    // console.log("from:", from)

    // the user's process to tranfer a bounty
    let to = await getDefaultProcess(this.props.data.address);
    // console.log("to:", to)

    let alert;
    let bal = Number(Server.service.getBalanceOfAOT());
    let qty = Math.abs(this.state.bounty).toString();
    // console.log("qty:", qty)

    if (!to)
      alert = 'Has not a default process to transfer bounty.';
    if (qty == '0')
      alert = 'Bounty is zero.';
    if (Number(qty) > bal)
      alert = 'Insufficient balance.';

    if (alert) {
      this.setState({ alert, message: '' });
      return;
    }

    await transferToken(from, to, qty);

    this.onClose();
    this.setState({ message: '' });

    // refreshing the number that displayed on the post.
    let quantity = Number(this.props.data.coins) + Number(qty);
    this.props.onBounty(quantity.toString());

    let bal_new = (bal - Number(qty)).toString();
    Server.service.setBalanceOfAOT(bal_new);

    // update the bounty (coins)
    let data = { id: this.props.data.id, coins: qty }
    let action = 'UpdateBounty';
    if (this.props.isReply) action = 'UpdateBountyForReply';
    
    if (this.props.isStory)
      messageToAO(AO_STORY, data, action);
    else
      messageToAO(AO_TWITTER, data, action);
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
            <div className='bounty-modal-header-balance'>
              <MdOutlineToken size={20} />
              {numberWithCommas(Number(Server.service.getBalanceOfAOT()))}
            </div>
          </div>

          <div className='bounty-modal-header-line' />
          <div>If you like these words.</div>
          <div>Do a bounty to inspire more good words.</div>

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

            <div className='bounty-modal-token bounty' onClick={() => this.onBounty()}>
              <AiOutlineFire size={20} />Bounty
            </div>
          </div>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default BountyModal;