import React from 'react';
import { formatTimestamp, getFirstImage, getFirstLine } from '../util/util';
import './StoryCard.css';
import { NavLink } from 'react-router-dom';
import { BsHeartFill, BsPersonFillLock } from 'react-icons/bs';
import { FaCoins } from "react-icons/fa";
import { IoMdChatbubbles } from "react-icons/io";

interface StoryCardProps {
  data: any;
}

interface StoryCardState {
  title: string;
  image: string;
}

class StoryCard extends React.Component<StoryCardProps, StoryCardState> {

  constructor(props: StoryCardProps) {
    super(props);
    this.state = {
      title: '',
      image: ''
    };
  }

  componentDidMount() {
    this.getStoryInfo();
  }
  
  async getStoryInfo() {
    let str = this.props.data.post;

    let image = getFirstImage(str);
    if (!image) image = './dream.jpg';

    let title = getFirstLine(str);
    if (!title) title = 'A Fine Stroy!';

    this.setState({ title, image });
  }

  render() {
    let data = this.props.data;

    return (
      <NavLink className='story-card' to={'/story/' + data.id}>
        <div className='story-card-image-container'>
          <img className='story-card-image' src={this.state.image} />
        </div>
        <div>
          <div className='story-card-header'>
            <img className='story-card-avatar' src={data.avatar} />
            <div className='story-card-publisher'>{data.nickname}</div>
            {/* <div className='story-card-summary'>·</div> */}
            <div className='story-card-summary'>{formatTimestamp(data.time, true)}</div>
            {data.range === 'private' && <BsPersonFillLock size={20} color='gray' />}
          </div>
          <div className='story-card-title'>{this.state.title}</div>
          {/* <div className='story-card-summary'>{data.summary}</div> */}

          <div className='story-card-state-row'>
            <div className='story-card-state'>
              <FaCoins />
              <div className='story-card-state-number'>{data.coins}</div>
            </div>

            <div className='story-card-state'>
              <IoMdChatbubbles />
              <div className='story-card-state-number'>{data.replies}</div>
            </div>

            <div className='story-card-state'>
              <BsHeartFill />
              <div className='story-card-state-number'>{data.likes}</div>
            </div>
          </div>
        </div>
      </NavLink>
    )
  }
}

export default StoryCard;