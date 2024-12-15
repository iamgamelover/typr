import React from 'react';
import { BsFillXCircleFill, BsSend } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './PostModal.css'
import MessageModal from './MessageModal';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import { AO_STORY, AO_TWITTER, STORY_INCOME, TIP_CONN, TIP_IMG } from '../util/consts';
import {
  checkContent, getWalletAddress, timeOfNow, uuid, messageToAO,
  numberWithCommas, transferToken, getDefaultProcess,
  shortAddr,
  randomAvatar
} from '../util/util';
import { MdOutlineToken } from 'react-icons/md';
import { Server } from '../../server/server';
import { AiOutlineFire } from 'react-icons/ai';
import QuestionModal from './QuestionModal';

declare var window: any;

interface PostStoryModalProps {
  open: boolean;
  onClose: Function;
}

interface PostStoryModalState {
  message: string;
  alert: string;
  question: string;
  range: string;
  category: string;
  title: string;
}

class PostStoryModal extends React.Component<PostStoryModalProps, PostStoryModalState> {
  quillRef: any;
  wordCount = 0;
  refresh: any;

  constructor(props: PostStoryModalProps) {
    super(props);

    this.state = {
      message: '',
      alert: '',
      question: '',
      range: 'everyone',
      category: 'travel',
      title: '',
    }

    this.onTitleChange = this.onTitleChange.bind(this);
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

  onTitleChange(e: any) {
    this.setState({ title: e.currentTarget.value });
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

  tipTransfer() {
    this.setState({ question: 'Publish a story will spend 100 AOT-Test token.' })
  }

  async onPost() {
    // TEMP CODE 
    // let address2 = Server.service.getActiveAddress();
    // let nickname = shortAddr(address2, 4);
    // let data2 = { address: address2, avatar: randomAvatar(), banner: '', nickname, bio: '', time: timeOfNow() };
    // console.log("data2:", data2)
    // await messageToAO(AO_STORY, data2, 'Register');


    // check the title
    if (!this.state.title.trim()) {
      this.setState({ alert: 'The story title is empty.' });
      return;
    }
    if (this.state.title.length > 100) {
      this.setState({ alert: 'Story title can be up to 100 characters long.' });
      return;
    }

    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result });
      return;
    }

    let address = await getWalletAddress();
    if (!address) {
      this.setState({ alert: TIP_CONN });
      return;
    }

    // if (this.props.isStory) {
    //   let resp = await this.transferFee();
    //   if (!resp) return;
    // }

    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;

    let data = {
      id: uuid(), address, post,
      title: this.state.title,
      range: this.state.range,
      category: this.state.category,
      likes: 0, replies: 0, coins: 0, time: timeOfNow()
    };

    let response = await messageToAO(AO_STORY, data, 'SendStory');

    if (response) {
      this.setState({ message: '' });
      this.props.onClose(data);

      // store the txid of a post. 
      let txid = { id: data.id, txid: response };
      messageToAO(AO_STORY, txid, 'SendTxid');
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

    let bal = Server.service.getBalanceOfAOT();
    console.log("bal:", bal)
    if (bal < 100) {
      this.setState({ alert: 'Insufficient balance.', message: '' });
      return false;
    }

    await transferToken(from, STORY_INCOME, '100');

    this.setState({ message: '' });

    let bal_new = bal - 100;
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

          <div>
            <div className='post-modal-header-row'>
              <div className="post-modal-header-title">New Story</div>
              {/* <div className='post-modal-header-balance'>
                <MdOutlineToken size={20} />
                {numberWithCommas(Number(Server.service.getBalanceOfAOT()))}
              </div> */}
            </div>
            <div className='bounty-modal-header-line' />
          </div>

          <input
            className="story-title-input"
            placeholder="Story title"
            value={this.state.title}
            onChange={this.onTitleChange}
          />

          <div className="home-input-container">

            <SharedQuillEditor
              placeholder={'The first image will be the story cover.'}
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            <div className='post-modal-actions'>
              <select
                className="home-filter"
                value={this.state.category}
                onChange={this.onCategoryChange}
              >
                <option value="travel">Travel</option>
                <option value="learn">Learn</option>
                <option value="fiction">Fiction</option>
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="movies">Movies</option>
              </select>

              <div className="app-icon-button fire-color" onClick={() => this.onPost()}>
                <AiOutlineFire size={20} />New Story
              </div>
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

export default PostStoryModal;