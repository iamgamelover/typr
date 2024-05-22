import React from 'react';
import { BsFillXCircleFill } from 'react-icons/bs';
import './Modal.css'
import './BountyRecordsModal.css'
import { MdOutlineToken } from "react-icons/md";
import { formatTimestamp, shortAddr, shortStr } from '../util/util';
import { TOKEN_ICON } from '../util/consts';
import { NavLink } from 'react-router-dom';

interface BountyRecordsModalProps {
  open: boolean;
  onClose: Function;
  data: any;
}

class BountyRecordsModal extends React.Component<BountyRecordsModalProps, {}> {

  constructor(props: BountyRecordsModalProps) {
    super(props);
    this.onClose = this.onClose.bind(this);
  }

  onClose() {
    this.props.onClose();
  }

  renderRecords() {
    let divs = [];
    let data = this.props.data;
    for (let i = 0; i < data.length; i++) {
      divs.push(
        <div key={i} className='br-modal'>
          <NavLink className='br-modal-user' to={'/user/' + data[i].address}>
            <img className='br-modal-icon' src={data[i].avatar} />
            <div>
              <div>{shortStr(data[i].nickname, 17)}</div>
              <div className="br-modal-address">{shortAddr(data[i].address, 4)}</div>
            </div>
          </NavLink>

          <div className='br-modal-token'>
            <img className='br-modal-icon' src={TOKEN_ICON.get(data[i].token_name)} />
            <div>
              <div className='br-modal-address'>{data[i].token_name}</div>
              <div className='br-modal-quantity'>{data[i].quantity}</div>
            </div>
          </div>

          <div className='home-msg-time'>
            {formatTimestamp(data[i].time)}
          </div>
        </div>
      )
    }

    return divs;
  }

  render() {
    if (!this.props.open)
      return (<div></div>);

    return (
      <div className="modal open">
        <div className="modal-content bounty-modal-content">
          <button className="modal-close-button" onClick={this.onClose}>
            <BsFillXCircleFill />
          </button>

          <div className='bounty-modal-header-row'>
            <div className="bounty-modal-header-title">Bounty Records</div>
            {/* <div className='bounty-modal-header-balance'>
              <MdOutlineToken size={20} />
              {numberWithCommas(Number(Server.service.getBalanceOfAOT()))}
            </div> */}
          </div>

          <div className='bounty-modal-header-line' />

          {this.renderRecords()}
        </div>
      </div>
    )
  }
}

export default BountyRecordsModal;