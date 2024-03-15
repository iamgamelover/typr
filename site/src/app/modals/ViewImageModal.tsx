import React from 'react';
import './Modal.css';
import './ViewImageModal.css';
import { BsFillXCircleFill } from 'react-icons/bs';

interface ViewImageModalProps {
  open: boolean;
  src: string;
  onClose: Function;
}

class ViewImageModal extends React.Component<ViewImageModalProps, {}> {
  constructor(props:ViewImageModalProps) {
    super(props);
    this.onClose = this.onClose.bind(this);
  }
  
  componentDidMount() {
    document.addEventListener('keydown', (e) => {
      if (e.keyCode === 27) // Esc key
        this.onClose();
    });
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', (e) => {
      if (e.keyCode === 27)
        this.onClose();
    });
  }

  onClose() {
    this.props.onClose();
  }

  render() {
    if(!this.props.open)
      return (<div></div>);

    return (
      <div className="modal open" onClick={e=>e.stopPropagation()}>
        <div className="modal-content view-image-modal-content">
          <button className="modal-close-button" onClick={this.onClose}>
            <BsFillXCircleFill />
          </button>

          <div>
            <img className='view-image-modal-image' src={this.props.src} />
          </div>
        </div>
      </div>
    )
  }
}

export default ViewImageModal;