import React from 'react';
import { BsFillXCircleFill } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './BountyModal.css'
import MessageModal from './MessageModal';
import { messageToAO, timeOfNow } from '../util/util';
import { AiOutlineFire } from 'react-icons/ai';
import { Server } from '../../server/server';
import { AO_TWITTER } from '../util/consts';
import { CiMail } from 'react-icons/ci';

interface DMModalProps {
  open: boolean;
  onClose: Function;
  friend: string;
}

interface DMModalState {
  message: string;
  alert: string;
  msg: string;
}

class DMModal extends React.Component<DMModalProps, DMModalState> {

  constructor(props: DMModalProps) {
    super(props);

    this.state = {
      message: '',
      alert: '',
      msg: '',
    }

    this.onClose = this.onClose.bind(this);
    this.onChangeMessage = this.onChangeMessage.bind(this);
  }

  onChangeMessage(e: any) {
    this.setState({ msg: e.currentTarget.value });
  }

  onClose(sent?:boolean) {
    this.props.onClose(sent);
  }

  async sendMessage() {
    let msg = this.state.msg.trim();
    if (!msg) {
      this.setState({ alert: 'Please input a message.' })
      return;
    } else if (msg.length > 500) {
      this.setState({ alert: 'Message can be up to 500 characters long.' })
      return;
    }

    this.setState({ message: 'Message...' });

    let data = {
      address: Server.service.getActiveAddress(),
      friend: this.props.friend,
      message: msg,
      time: timeOfNow()
    };

    console.log('dm data ',data)
    await messageToAO(AO_TWITTER, data, 'SendMessage');

    this.setState({ message: '' });
    this.onClose(true);
  }

  handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.sendMessage();
    }
  }

  render() {
    if (!this.props.open)
      return (<div></div>);

    return (
      <div className="modal open" onClick={e => e.stopPropagation()}>
        <div className="modal-content bounty-modal-content">
          <button className="modal-close-button" onClick={()=>this.onClose()}>
            <BsFillXCircleFill />
          </button>

          <div className='bounty-modal-header-row'>
            <div className="bounty-modal-header-title">Message</div>
          </div>

          <div className='bounty-modal-header-line' />
          <div>Send a DM message to friend.</div>

          <div className='bounty-modal-token-row message'>
            <input
              className="bounty-modal-input message"
              placeholder="message"
              value={this.state.msg}
              onChange={this.onChangeMessage}
              onKeyDown={this.handleKeyDown}
            />

            <div className='bounty-modal-token message' onClick={() => this.sendMessage()}>
              <CiMail size={20} />&nbsp;Send
            </div>
          </div>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default DMModal;