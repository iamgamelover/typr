import React from 'react';
import { BsFillXCircleFill, BsSend } from 'react-icons/bs';
import AlertModal from './AlertModal';
import './Modal.css'
import './PostModal.css'
import './PostStoryModal.css'
import MessageModal from './MessageModal';
import SharedQuillEditor from '../elements/SharedQuillEditor';
import { AO_STORY, AO_TWITTER, STORY_INCOME, TIP_CONN, TIP_IMG } from '../util/consts';
import {
  checkContent, getWalletAddress, timeOfNow, uuid, messageToAO,
  numberWithCommas, transferToken, getDefaultProcess,
  shortAddr,
  randomAvatar,
  calculateDeadlineTimestamp
} from '../util/util';
import { MdOutlineToken } from 'react-icons/md';
import { Server } from '../../server/server';
import { AiOutlineFire } from 'react-icons/ai';
import QuestionModal from './QuestionModal';
import { FaPollH } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip'
import { IoIosAddCircleOutline } from 'react-icons/io';

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
  openPoll: boolean;
  poll_options: string[];
  days: string;
  hours: string;
  minutes: string;
  poll_token_process: string;
  poll_token_amount: string;
  poll_bonus: string;
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
      category: 'project',
      title: '',
      openPoll: false,
      poll_options: ['', ''],
      days: '1',
      hours: '0',
      minutes: '0',
      poll_token_process: '',
      poll_token_amount: '',
      poll_bonus: '',
    }

    this.onTitleChange = this.onTitleChange.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onCategoryChange = this.onCategoryChange.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);
    this.onDaysChange = this.onDaysChange.bind(this);
    this.onHoursChange = this.onHoursChange.bind(this);
    this.onMinutesChange = this.onMinutesChange.bind(this);
    this.onPollTokenProcessChange = this.onPollTokenProcessChange.bind(this);
    this.onPollTokenAmountChange = this.onPollTokenAmountChange.bind(this);
    this.onPollBonusChange = this.onPollBonusChange.bind(this);
  }

  onPollOptionChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const updatedOptions = [...this.state.poll_options];
    updatedOptions[index] = e.target.value;
    this.setState({ poll_options: updatedOptions });
  };

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

  onCategoryChange(e: any) {
    this.setState({ category: e.currentTarget.value });
  };

  onDaysChange(e: any) {
    this.setState({ days: e.currentTarget.value });
  };

  onHoursChange(e: any) {
    this.setState({ hours: e.currentTarget.value });
  };

  onMinutesChange(e: any) {
    this.setState({ minutes: e.currentTarget.value });
  };

  onPollTokenProcessChange(e: any) {
    this.setState({ poll_token_process: e.currentTarget.value });
  };

  onPollTokenAmountChange(e: any) {
    this.setState({ poll_token_amount: e.currentTarget.value });
  };

  onPollBonusChange(e: any) {
    this.setState({ poll_bonus: e.currentTarget.value });
  };

  tipTransfer() {
    this.setState({ question: 'Publish a story will spend 100 AOT-Test token.' })
  }

  async onPost() {
    // messageToAO(AO_STORY, {}, 'AlterTable');
    // return

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

    // check for poll
    let option_count = 0;
    let option_texts: string[] = [];
    let expires_at = 0;

    if (this.state.openPoll) {
      for (let i = 0; i < this.state.poll_options.length; i++) {
        const poll_option = this.state.poll_options[i].trim();
        console.log("poll_option:", poll_option)

        if (i == 0 || i == 1) { // must give the options
          if (!poll_option) {
            this.setState({ alert: "Poll option is empty." });
            return
          }
        }

        if (poll_option) {
          option_count++;
          option_texts.push(poll_option);
        }
      }

      expires_at = calculateDeadlineTimestamp(
        Number(this.state.days),
        Number(this.state.hours),
        Number(this.state.minutes)
      )
    }

    // Start to post the story...
    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;

    // data of stories table
    let dataOfStory = {
      id: uuid(),
      address,
      post,
      title: this.state.title,
      range: this.state.range,
      category: this.state.category,
      likes: 0,
      replies: 0,
      coins: 0,
      time: timeOfNow(),
      option_count,
      expires_at,
      updated_at: timeOfNow()
    };
    console.log("dataOfStory:", dataOfStory)

    let response = await messageToAO(AO_STORY, dataOfStory, 'SendStory');

    if (response) {
      // store the txid of a story. 
      let txid = { id: dataOfStory.id, txid: response };
      messageToAO(AO_STORY, txid, 'SendTxid');

      if (option_count == 0) {
        this.setState({ message: '' });
        this.props.onClose(dataOfStory);
        return;
      }
    }
    else {
      this.setState({ message: '', alert: TIP_IMG });
      return;
    }

    // Start to post the poll...
    if (this.state.openPoll) {
      // data of poll_options table
      for (let i = 0; i < option_texts.length; i++) {
        let data = {
          option_id: uuid(),
          story_id: dataOfStory.id,
          option_text: option_texts[i],
          vote_count: 0
        };
        console.log("dataOfPollOption:", data)

        let response = await messageToAO(AO_STORY, data, 'AddPollOption');
        if (!response) {
          this.setState({ message: '', alert: TIP_IMG });
          return;
        }
      }
    }

    // Post successful
    this.setState({ message: '' });
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

  onPoll() {
    this.setState({ openPoll: true });
  }

  offPoll() {
    this.setState({ openPoll: false });
  }

  // offPoll() {
  //   this.setState({
  //     openPoll: false,
  //     poll_options: ['', ''],
  //     days: '1',
  //     hours: '0',
  //     minutes: '0',
  //     poll_token_process: '',
  //     poll_token_amount: '',
  //     poll_bonus: ''
  //   });
  // }

  renderPollOptions() {
    return this.state.poll_options.map((option, index) => (
      <div key={index} className="poll-option-container">
        <input
          className="post-story-modal-poll-option"
          placeholder={`Choice ${index + 1} ${index > 1 ? '(optional)' : ''}`}
          value={option}
          onChange={(e) => this.onPollOptionChange(index, e)}
        />

        {index === this.state.poll_options.length - 1 &&
          this.state.poll_options.length < 4 &&
          <div
            className="add-poll-option-icon"
            data-tooltip-id="my-tooltip"
            data-tooltip-content="Add"
            onClick={() => this.addPollOption()}
          >
            <IoIosAddCircleOutline size={30} />
          </div>
        }
      </div>
    ));
  }

  addPollOption() {
    this.setState((prevState) => ({
      poll_options: [...prevState.poll_options, '']
    }));
  };

  renderPollLength() {
    return (
      <div>
        <select
          className="poll-length-input"
          value={this.state.days}
          onChange={this.onDaysChange}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <option key={i} value={i}>
              {i} days
            </option>
          ))}
        </select>

        <select
          className="poll-length-input"
          value={this.state.hours}
          onChange={this.onHoursChange}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {i} hours
            </option>
          ))}
        </select>

        <select
          className="poll-length-input"
          value={this.state.minutes}
          onChange={this.onMinutesChange}
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i}>
              {i} minutes
            </option>
          ))}
        </select>
      </div>
    )
  }

  renderPollToken() {
    return (
      <div className="poll-token-containe">
        <input
          className="poll-token-process"
          placeholder='poll token process'
          value={this.state.poll_token_process}
          onChange={this.onPollTokenProcessChange}
        />

        <input
          className="poll-token-amount"
          placeholder='amount'
          value={this.state.poll_token_amount}
          onChange={this.onPollTokenAmountChange}
        />

        <select
          className="poll-token-send"
          value={this.state.poll_bonus}
          onChange={this.onPollBonusChange}
        >
          <option value="1">1 / user</option>
          <option value="2">2 / user</option>
          <option value="3">3 / user</option>
        </select>
      </div>
    );
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
            {/* <div className='bounty-modal-header-line' /> */}
          </div>

          <input
            className="post-story-modal-story-title"
            placeholder="Title"
            value={this.state.title}
            onChange={this.onTitleChange}
          />

          <div className="home-input-container">

            <SharedQuillEditor
              placeholder={'The first image will be the story cover.'}
              onChange={this.onContentChange}
              getRef={(ref: any) => this.quillRef = ref}
            />

            {this.state.openPoll &&
              <div className='post-story-modal-poll-container'>
                <div>Poll options</div>
                <div>{this.renderPollOptions()}</div>
                <div>Poll length</div>
                <div>{this.renderPollLength()}</div>
                <div>Poll token (optional)</div>
                <div>{this.renderPollToken()}</div>
              </div>
            }

            <div className='post-modal-actions'>
              <div className='post-story-modal-left-actions'>
                <select
                  className="home-filter"
                  value={this.state.category}
                  onChange={this.onCategoryChange}
                >
                  <option value="project">Project</option>
                  <option value="travel">Travel</option>
                  <option value="learn">Learn</option>
                  <option value="fiction">Fiction</option>
                  <option value="music">Music</option>
                  <option value="sports">Sport</option>
                  <option value="movie">Movie</option>
                </select>

                {this.state.openPoll
                  ? <button className="button-remove-poll"
                    onClick={() => this.offPoll()}>Remove Poll</button>
                  : <div
                    className="post-story-modal-poll-icon"
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content="Poll"
                    onClick={() => this.onPoll()}
                  >
                    <FaPollH size={35} />
                  </div>
                }
              </div>

              <div className="app-icon-button fire-color" onClick={() => this.onPost()}>
                <AiOutlineFire size={20} />New Story
              </div>
            </div>
          </div>
        </div>

        <Tooltip id="my-tooltip" />
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div>
    )
  }
}

export default PostStoryModal;