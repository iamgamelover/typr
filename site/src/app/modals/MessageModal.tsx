import React from 'react';
import './Modal.css'

interface MessageModalProps {
  message: string;
}

class MessageModal extends React.Component<MessageModalProps, {}> {
  render() {
    if(this.props.message == '')
      return (null);

    return (
      <div className="modal open">
        <div className="modal-content" style={{width: '250px', textAlign: 'center'}}>
          {this.props.message}
        </div>
      </div>
    )
  }
}

export default MessageModal;