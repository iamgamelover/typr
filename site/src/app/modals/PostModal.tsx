import React from 'react';
import { BsFillXCircleFill } from 'react-icons/bs';
import './Modal.css'
import PostContent from '../elements/PostContent';

interface PostModalProps {
  open: boolean;
  onClose: Function;
  isStory?: boolean;
}

class PostModal extends React.Component<PostModalProps, {}> {
  render() {
    if (!this.props.open)
      return (<div></div>);

    return (
      <div className="modal open">
        <div className="modal-content post-modal-content">
          <button className="modal-close-button" onClick={() => this.props.onClose()}>
            <BsFillXCircleFill />
          </button>

          <PostContent isStory={this.props.isStory} onClose={this.props.onClose} />
        </div>
      </div>
    )
  }
}

export default PostModal;