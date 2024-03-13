import React from 'react';
import { BsFillXCircleFill } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './LoginModal.css'
import { ethers } from 'ethers';
import { publish } from '../util/event';
import { browserDetect } from '../util/util';
import MessageModal from './MessageModal';

declare var window: any;

interface LoginModalProps {
  open: boolean;
  onClose: Function;
}

interface LoginModalState {
  message: string;
  alert: string;
}

class LoginModal extends React.Component<LoginModalProps, LoginModalState> {
  constructor(props:LoginModalProps) {
    super(props);

    this.state = {
      message: '',
      alert: '',
    }
  }
  
  render() {
    if(!this.props.open)
      return (<div></div>);

    return (
      <div className="modal open">
        <div className="login-modal-content">
          <button className="modal-close-button" onClick={() => this.props.onClose()}>
            <BsFillXCircleFill />
          </button>

          <div className='login-modal-button-mm'>
            <img className="login-modal-icon" src='/icon/mm.png' /> 
            {/* <button style={{width: '170px'}} onClick={()=>this.onMetamask()}>Meta Mask</button> */}
          </div>
          <br/>

          <div className='login-modal-button-wc'>
            <img className="login-modal-icon" src='/icon/wc.png' /> 
            {/* <button style={{width: '170px'}} onClick={()=>this.onWallectConnect()}>Wallet Connect</button> */}
          </div>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.setState({alert: ''})}/>
      </div>
    )
  }
}

export default LoginModal;