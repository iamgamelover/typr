import React from 'react';
import {
  calculateDeadlineTimestamp, checkContent, createTokenAwardProcess,
  getTokenBalance, getTokenInfo, getWalletAddress, isValidPositiveNumber,
  messageToAO, monitorCronProcess, timeOfNow, transferTokenAward, uuid
} from '../util/util';
import './PostContent.css';
import { BsSend } from 'react-icons/bs';
import { FaPollH } from "react-icons/fa";
import { IoIosAddCircleOutline } from "react-icons/io";
import { AiOutlineFire } from 'react-icons/ai';
import { Tooltip } from 'react-tooltip';
import AlertModal from '../modals/AlertModal';
import MessageModal from '../modals/MessageModal';
import QuestionModal from '../modals/QuestionModal';
import { TIP_CONN, AO_STORY, TIP_IMG, AO_TWITTER } from '../util/consts';
import SharedQuillEditor from './SharedQuillEditor';

interface PostContentProps {
  onClose: Function;
  isStory?: boolean;
}

interface PostContentState {
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
}

class PostContent extends React.Component<PostContentProps, PostContentState> {
  quillRef: any;
  wordCount = 0;
  refresh: any;

  constructor(props: PostContentProps) {
    super(props);
    this.state = {
      message: '',
      alert: '',
      question: '',
      range: 'everyone',
      category: 'travel',
      title: '',
      openPoll: false,
      poll_options: ['', ''],
      days: '1',
      hours: '0',
      minutes: '0',
      poll_token_process: '',
      poll_token_amount: '',
    };

    this.onTitleChange = this.onTitleChange.bind(this);
    this.onContentChange = this.onContentChange.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.onCategoryChange = this.onCategoryChange.bind(this);
    this.onQuestionYes = this.onQuestionYes.bind(this);
    this.onQuestionNo = this.onQuestionNo.bind(this);
    this.onDaysChange = this.onDaysChange.bind(this);
    this.onHoursChange = this.onHoursChange.bind(this);
    this.onMinutesChange = this.onMinutesChange.bind(this);
    this.onPollTokenProcessChange = this.onPollTokenProcessChange.bind(this);
    this.onPollTokenAmountChange = this.onPollTokenAmountChange.bind(this);
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

  onRangeChange(e: any) {
    this.setState({ range: e.currentTarget.value });
  };

  onCategoryChange(e: any) {
    this.setState({ category: e.currentTarget.value });
  };

  onDaysChange(e: any) {
    let days = e.currentTarget.value;
    this.setState({ days });
    if (days == '0') {
      if (this.state.minutes == '0') {
        if (this.state.hours == '0') {
          this.setState({ hours: '1' });
        }
      } else {
        if (this.state.hours == '0') {
          this.setState({ minutes: '5' });
        }
      }
    }
  };

  onHoursChange(e: any) {
    let hours = e.currentTarget.value;
    this.setState({ hours });
    if (hours == '0') {
      if (this.state.days == '0') {
        if (this.state.minutes < '5') {
          this.setState({ minutes: '5' });
        }
      }
    }
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

  confirmTokenAward() {
    if (this.state.openPoll) {
      let tokenProcess = this.state.poll_token_process.trim();
      let tokenAmount = this.state.poll_token_amount.trim();
      if (tokenProcess && tokenAmount) {
        this.setState({ question: 'The token award will go through a new process that will allocate it to voters.' })
        return;
      }
    }

    this.onPost();
  }

  async onPost() {
    this.setState({ message: 'Checking...' });

    if (this.props.isStory) {
      if (!this.state.title.trim()) {
        this.setState({ alert: 'The story title is empty.', message: '' });
        return;
      }
      if (this.state.title.length > 100) {
        this.setState({ alert: 'Story title can be up to 100 characters long.', message: '' });
        return;
      }
    }

    let result = checkContent(this.quillRef, this.wordCount);
    if (result) {
      this.setState({ alert: result, message: '' });
      return;
    }

    let address = await getWalletAddress();
    if (!address) {
      this.setState({ alert: TIP_CONN, message: '' });
      return;
    }

    // check for poll
    let option_count = 0;
    let option_texts: string[] = [];
    let expires_at = 0;
    let awardAmount = 0;

    if (this.state.openPoll) {
      for (let i = 0; i < this.state.poll_options.length; i++) {
        const poll_option = this.state.poll_options[i].trim();
        // console.log("poll_option:", poll_option)
        if (i == 0 || i == 1) { // must give the options
          if (!poll_option) {
            this.setState({ alert: "Poll option is empty.", message: '' });
            return
          }
        }

        if (poll_option.length > 50) {
          this.setState({ alert: "Poll option can be up to 50 characters long.", message: '' });
          return
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

      // Poll award token
      let tokenProcess = this.state.poll_token_process.trim();
      // console.log("tokenProcess:", tokenProcess)
      if (tokenProcess) {
        let tokenBalance = await getTokenBalance(tokenProcess, address);
        // console.log("tokenBalance:", tokenBalance)
        if (!tokenBalance) {
          this.setState({ alert: "The token process is invaild.", message: '' });
          return;
        }

        awardAmount = Number(this.state.poll_token_amount.trim());
        // console.log("awardAmount:", awardAmount)
        if (awardAmount) {
          let info = await getTokenInfo(tokenProcess);
          // console.log("token info:", info)
          for (let i = 0; i < info.length; i++) {
            if (info[i].name == 'Denomination') {
              awardAmount = awardAmount * 10 ** Number(info[i].value);
              // console.log("will be transfer awardAmount:", awardAmount)
              break;
            }
          }

          // Quantity must be a valid positive non-zero number.
          if (!isValidPositiveNumber(awardAmount)) {
            this.setState({ alert: "Award amount must be a valid positive non-zero number.", message: '' });
            return;
          }

          if (awardAmount > Number(tokenBalance)) {
            this.setState({ alert: "Insufficient Poll Award Token Balance!", message: '' });
            return;
          }
        } else {
          this.setState({ alert: "Award token amount is empty.", message: '' });
          return;
        }
      }
    }

    // Start to post the story...
    this.setState({ message: 'Posting...' });

    let post = this.quillRef.root.innerHTML;

    // post content
    let data = {
      id: uuid(),
      address,
      post,
      title: this.state.title.trim(),
      range: this.state.range,
      category: this.state.category,
      likes: 0,
      replies: 0,
      coins: 0,
      time: timeOfNow(),
      option_count,
      expires_at,
      updated_at: timeOfNow(),
      poll_token_process: this.state.poll_token_process.trim(),
      poll_token_amount: awardAmount.toString()
    };
    // console.log("dataOfStory:", dataOfStory)

    let response;
    if (this.props.isStory)
      response = await messageToAO(AO_STORY, data, 'SendStory');
    else
      response = await messageToAO(AO_TWITTER, data, 'SendPost');

    if (response) {
      // store the txid of a post. 
      let txid = { id: data.id, txid: response };
      messageToAO(this.props.isStory ? AO_STORY : AO_TWITTER, txid, 'SendTxid');

      // without a poll
      if (option_count == 0) {
        this.setState({ message: '' });
        this.props.onClose(data);
        this.resetPostContent();
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
        let param = {
          option_id: uuid(),
          story_id: data.id,
          option_text: option_texts[i],
          vote_count: 0
        };
        // console.log("dataOfPollOption:", data)

        let response = await messageToAO(this.props.isStory ? AO_STORY : AO_TWITTER, param, 'AddPollOption');
        if (!response) {
          this.setState({ message: '', alert: TIP_IMG });
          return;
        }
      }

      //---------------
      // create a process and transfer the token to it.
      let token_process = data.poll_token_process;
      let token_amount = data.poll_token_amount;
      if (token_process && token_amount) {
        let param = {
          story_process: this.props.isStory ? AO_STORY : AO_TWITTER,
          token_process,
          token_amount,
          expires_at: data.expires_at * 1000,
          story_id: data.id
        };
        // console.log("token award process DATA:", param)

        this.setState({ message: 'The token award process is creating...' });
        let awardProcess = await createTokenAwardProcess(param);
        console.log("token award process:", awardProcess)

        // transfer the token
        this.setState({ message: 'The token award is transfering...' });
        while (true) {
          let res = await transferTokenAward(param.token_process, awardProcess, param.token_amount);
          // console.log("transferTokenAward --> res:", res)
          if (res) break;
        }

        await monitorCronProcess(awardProcess);
        // let res = await unmonitorCronProcess();
      }
    }

    // Post successful
    this.setState({ message: '' });
    this.props.onClose('Done');
    this.resetPostContent();
  }

  resetPostContent() {
    this.quillRef.setText('');
    this.setState({
      openPoll: false,
      poll_options: ['', ''],
      days: '1',
      hours: '0',
      minutes: '0',
      poll_token_process: '',
      poll_token_amount: '',
    });
  }

  onPoll() {
    this.setState({ openPoll: true });
  }

  offPoll() {
    this.setState({ openPoll: false });
  }

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
          placeholder='Token Process ID'
          value={this.state.poll_token_process}
          onChange={this.onPollTokenProcessChange}
        />

        <input
          className="poll-token-amount"
          placeholder='amount'
          value={this.state.poll_token_amount}
          onChange={this.onPollTokenAmountChange}
          type='number'
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.props.isStory &&
          <div>
            <div className="post-modal-header-title">New Story</div>
            <input
              className="post-story-modal-story-title"
              placeholder="Title"
              value={this.state.title}
              onChange={this.onTitleChange}
            />
          </div>
        }

        <div className="home-input-container">
          <SharedQuillEditor
            placeholder={this.props.isStory ? 'The first image will be the story cover.' : 'What is happening?!'}
            onChange={this.onContentChange}
            getRef={(ref: any) => this.quillRef = ref}
          />

          {this.state.openPoll &&
            <div className='post-story-modal-poll-container'>
              <div>Poll Options</div>
              <div>{this.renderPollOptions()}</div>
              <div>Poll Length</div>
              <div>{this.renderPollLength()}</div>
              <div>Token Award (optional)</div>
              <div>{this.renderPollToken()}</div>
            </div>
          }

          <div className='post-modal-actions'>
            <div className='post-story-modal-left-actions'>
              {this.props.isStory
                ?
                <select
                  className="home-filter"
                  value={this.state.category}
                  onChange={this.onCategoryChange}
                >
                  {/* <option value="project">Project</option> */}
                  <option value="travel">Travel</option>
                  <option value="learn">Learn</option>
                  <option value="fiction">Fiction</option>
                  <option value="music">Music</option>
                  <option value="sports">Sport</option>
                  <option value="movie">Movie</option>
                </select>
                :
                <select
                  className="home-filter"
                  value={this.state.range}
                  onChange={this.onRangeChange}
                >
                  <option value="everyone">Everyone</option>
                  {/* <option value="following">Following</option> */}
                  <option value="private">Private</option>
                </select>
              }

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

            {this.props.isStory
              ?
              <div className="app-icon-button fire-color" onClick={() => this.confirmTokenAward()}>
                <AiOutlineFire size={20} />New Story
              </div>
              :
              <div className="app-icon-button" onClick={() => this.confirmTokenAward()}>
                <BsSend size={20} />Post
              </div>
            }
          </div>
        </div>

        <Tooltip id="my-tooltip" />
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        <QuestionModal message={this.state.question} onYes={this.onQuestionYes} onNo={this.onQuestionNo} />
      </div >
    )
  }
}

export default PostContent;