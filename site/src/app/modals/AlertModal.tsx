import React from 'react';
import './Modal.css'

interface AlertModalProps {
  message: string;
  button: string;
  onClose: Function;
}

class AlertModal extends React.Component<AlertModalProps, {}> {
  constructor(props:AlertModalProps) {
    super(props);
    this.onClose = this.onClose.bind(this);
  }
  
  onClose(e: any) {
    e.stopPropagation();
    this.props.onClose();
  }

  render() {
    if(this.props.message == '')
      return (null);

    return (
      <div className="modal open">
        <div className="modal-content" style={{width: '250px', textAlign: 'center'}}>
          <div>{this.props.message}</div>
          <div>
            <button style={{marginTop: '25px'}} onClick={this.onClose}>{this.props.button}</button>
          </div>
        </div>
      </div>
    )
  }
}

export default AlertModal;