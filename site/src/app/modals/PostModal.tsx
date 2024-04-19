import React from 'react';
import { BsFillXCircleFill, BsSend } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './PostModal.css'
import MessageModal from './MessageModal';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import { AO_STORY, AO_TWITTER, STORY_INCOME, TIP_IMG } from '../util/consts';
import { checkContent, getWalletAddress, timeOfNow, uuid, messageToAO, storePostInLocal, numberWithCommas, transferToken, getDefaultProcess } from '../util/util';
import { MdOutlineToken } from 'react-icons/md';
import { Server } from '../../server/server';
import { AiOutlineFire } from 'react-icons/ai';
import QuestionModal from './QuestionModal';

declare var window: any;

interface PostModalProps {
  open: boolean;
  onClose: Function;
  isStory?: boolean;
}

interface PostModalState {
  message: string;
  alert: string;
  question: string;
  title: string;
  range: string;
  category: string;
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
      question: '',
      title: '',
      range: 'everyone',
      category: 'Travel',
    }

    this.onContentChange = this.onContentChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.onCategoryChange = this.onCategoryChange.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);
  }

  onQuestionYes() {
    this.onPost();
    this.setState({ question: '' });
  }

  onQuestionNo() {
    this.setState({ question: '' });
  }

  onContentChange(length: number) {
    this.wordCount = length;
  };

  onRangeChange(e: React.FormEvent<HTMLSelectElement>) {
    const element = e.target as HTMLSelectElement;
    this.setState({ range: element.value });
  }

  onCategoryChange(e: any) {
    this.setState({ category: e.currentTarget.value });
  };

  // onCategoryChange(e: React.FormEvent<HTMLSelectElement>) {
  //   const element = e.target as HTMLSelectElement;
  //   this.setState({ category: element.value });
  // }

  tipTransfer() {
    this.setState({ question: 'Publish a story will spend 100 AOT-Test token.' })
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

    if (this.props.isStory) {
      let resp = await this.transferFee();
      if (!resp) return;
    }

    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;
    let nickname = localStorage.getItem('nickname');
    if (!nickname) nickname = 'anonymous';

    let data = {
      id: uuid(), address, nickname, post, range: this.state.range,
      category: this.state.category,
      likes: 0, replies: 0, coins: 0, time: timeOfNow()
    };

    let response;
    if (this.props.isStory)
      response = await messageToAO(AO_STORY, data, 'SendStory');
    else
      response = await messageToAO(AO_TWITTER, data, 'SendPost');

    if (response) {
      this.setState({ message: '' });
      this.props.onClose(data);

      if (!this.props.isStory)
        storePostInLocal(data);

      if (!this.props.isStory) {
        // This code store the message id to ao. 
        let idInfo = { address, postId: data.id, txid: response, time: data.time };
        messageToAO(AO_TWITTER, idInfo, 'SendPostID');
      }
      else {
        let idInfo = { id: data.id, txid: response };
        messageToAO(AO_STORY, idInfo, 'SendTxid');
      }
    }
    else
      this.setState({ message: '', alert: TIP_IMG });
  }

  async transferFee() {
    this.setState({ message: 'Transfering Fee...' });

    //-------------------
    // TODO: need to update...
    // your own process 
    let from = Server.service.getDefaultProcess();
    console.log("from:", from)
    if (!from) {
      let address = await getWalletAddress();
      from = await getDefaultProcess(address);
      console.log("from 2:", from)
    }

    if (!from) {
      this.setState({ alert: "You haven't a process yet, try to reconnect to wallet.", message: '' });
      return false;
    }
    //-------------------

    let bal = Number(Server.service.getBalanceOfAOT());
    console.log("bal:", bal)
    if (bal < 100) {
      this.setState({ alert: 'Insufficient balance.', message: '' });
      return false;
    }

    await transferToken(from, STORY_INCOME, '100');

    this.setState({ message: '' });

    let bal_new = (bal - 100).toString();
    Server.service.setBalanceOfAOT(bal_new);
    return true;
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

          {this.props.isStory &&
            <div>
              <div className='post-modal-header-row'>
                <div className="post-modal-header-title">New Story</div>
                <div className='post-modal-header-balance'>
                  <MdOutlineToken size={20} />
                  {numberWithCommas(Number(Server.service.getBalanceOfAOT()))}
                </div>
              </div>
              <div className='bounty-modal-header-line' />
            </div>
          }

          <div className="home-input-container">
            <SharedQuillEditor
              placeholder={this.props.isStory ? 'The first text line and image are the story name and cover.' : 'What is happening?!'}
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='post-modal-actions'>
              {this.props.isStory
                ?
                <select
                  className="home-filter"
                  value={this.state.category}
                  onChange={this.onCategoryChange}
                >
                  <option value="travel">Travel</option>
                  <option value="travel">Learn</option>
                  <option value="normal">Fiction</option>
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="movies">Movies</option>
                </select>
                :
                <select
                  className="home-filter"
                  value={this.state.range}
                  onChange={this.onRangeChange}
                >
                  <option value="everyone">Everyone</option>
                  <option value="following">Following</option>
                  <option value="private">Private</option>
                </select>
              }

              {this.props.isStory
                ?
                <div className="app-icon-button fire-color" onClick={() => this.tipTransfer()}>
                  <AiOutlineFire size={20} />New Story
                </div>
                :
                <div className="app-icon-button" onClick={() => this.onPost()}>
                  <BsSend size={20} />Post
                </div>
              }
            </div>
          </div>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    )
  }
}

export default PostModal;