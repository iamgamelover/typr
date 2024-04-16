import React from 'react';
import { BsFillXCircleFill, BsSend } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './PostModal.css'
import MessageModal from './MessageModal';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import { AO_TWITTER, TIP_IMG } from '../util/consts';
import { checkContent, getWalletAddress, timeOfNow, uuid, messageToAO, storePostInLocal } from '../util/util';

declare var window: any;

interface PostModalProps {
  open: boolean;
  onClose: Function;
}

interface PostModalState {
  message: string;
  alert: string;
  range: string;
}

class PostModal extends React.Component<PostModalProps, PostModalState> {
  quillRef: any;
  wordCount = 0;
  refresh: any;

  constructor(props: PostModalProps) {
    super(props);

    this.state = {
      message: '',
      alert: '',
      range: 'everyone',
    }

    this.onContentChange = this.onContentChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  onRangeChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({ range: element.value });
  }

  async onPost() {
    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    let address = await getWalletAddress();
    if (!address) {
      this.setState({ alert: 'You should connect to wallet first.' });
      return;
    }

    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;
    let nickname = localStorage.getItem('nickname');
    if (!nickname) nickname = 'anonymous';

    let data = {
      id: uuid(), address, nickname, post, range: this.state.range,
      likes: 0, replies: 0, coins: 0, time: timeOfNow()
    };

    let response = await messageToAO(AO_TWITTER, data, 'SendPost');

    if (response) {
      // this.quillRef.setText('');
      this.setState({ message: '' });
      this.props.onClose();
      storePostInLocal(data);
      
      // This code store the post id. 
      let idInfo = { address, postId: data.id, txid: response, time: data.time };
      messageToAO(AO_TWITTER, idInfo, 'SendPostID');
    }
    else
      this.setState({ message: '', alert: TIP_IMG });
  }

  render() {
    if (!this.props.open)
      return (<div></div>);

    return (
      <div className="modal open">
        <div className="modal-content post-modal-content">
          <button className="modal-close-button" onClick={() => this.props.onClose()}>
            <BsFillXCircleFill />
          </button>

          <div className="home-input-container">
            <SharedQuillEditor
              placeholder='What is happening?!'
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='post-modal-actions'>
              <select
                className="home-filter"
                value={this.state.range}
                onChange={this.onRangeChange}
              >
                <option value="everyone">Everyone</option>
                <option value="following">Following</option>
                <option value="private">Private</option>
              </select>

              <div className="app-post-button story post reply" onClick={() => this.onPost()}>
                <BsSend size={20} />
                <div>Post</div>
              </div>
            </div>
          </div>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
      </div>
    )
  }
}

export default PostModal;