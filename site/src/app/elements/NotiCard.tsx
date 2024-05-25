import React from 'react';
import { convertUrlsToLinks, shortAddr } from '../util/util';
import { formatTimestamp } from '../util/util';
import './NotiCard.css';
import parse, { attributesToProps } from 'html-react-parser';
import { Navigate } from 'react-router-dom';
import ViewImageModal from '../modals/ViewImageModal';
import AlertModal from '../modals/AlertModal';
import { Service } from '../../server/service';
import { subscribe } from '../util/event';
import { Tooltip } from 'react-tooltip'
import MessageModal from '../modals/MessageModal';

interface NotiCardProps {
  data: any;
}

interface NotiCardState {
  openImage: boolean;
  navigate: string;
  content: string;
  message: string;
  alert: string;
}

class NotiCard extends React.Component<NotiCardProps, NotiCardState> {

  id: string;
  imgUrl: string;
  loading: boolean = false;

  static service: Service = new Service();

  parseOptions = {
    replace: (domNode: any) => {
      if (domNode.attribs && domNode.name === 'img') {
        const props = attributesToProps(domNode.attribs);
        return <img className='ql-editor-image' onClick={(e) => this.tapImage(e, props.src)} {...props} />;
      }
    }
  };

  constructor(props: NotiCardProps) {
    super(props);
    this.state = {
      openImage: false,
      navigate: '',
      content: '',
      message: '',
      alert: '',
    };

    this.onClose = this.onClose.bind(this);

    subscribe('wallet-events', () => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.start();

    const links = document.querySelectorAll("[id^='url']");
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }

  componentWillUnmount() {
    const links = document.querySelectorAll("[id^='url']");
    for (let i = 0; i < links.length; i++) {
      links[i].removeEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }

  async start() {
    this.getPostContent();
  }

  async getPostContent() {
    let content = this.props.data.post;
    // content = convertHashTag(content);
    content = convertUrlsToLinks(content);
    this.setState({ content });
  }

  tapImage(e: any, src: string) {
    e.stopPropagation();
    this.imgUrl = src;
    this.setState({ openImage: true })
  }

  goProfilePage(e: any, id: string) {
    e.stopPropagation();
    this.setState({ navigate: '/user/' + id });
  }

  goPostPage(id: string) {
    this.setState({ navigate: "/post/" + id });
  }

  onClose() {
    this.setState({ openImage: false });
  }

  render() {
    let data = this.props.data;

    if (this.state.navigate)
      return <Navigate to={this.state.navigate} />;

    return (
      <div
        className='home-msg-line'
        style={{ cursor: this.state.openImage ? 'auto' : 'pointer' }}
        onClick={() => this.goPostPage(data.post_id)}
      >
        <div className='home-msg-header'>
          <img
            className='home-msg-portrait'
            // data-tooltip-id="my-tooltip"
            // data-tooltip-content="Go to the profile page"
            src={data.avatar}
            onClick={(e) => this.goProfilePage(e, data.address)}
            title='Show Profile'
          // onMouseEnter={()=>this.openPopup()}
          // onMouseLeave={(e)=>this.closePopup(e)}
          />
          <div className="home-msg-nickname">
            {data.nickname}
          </div>

          <div className="home-msg-address">{shortAddr(data.address, 4)}</div>
          <div className='home-msg-time'>
            ·&nbsp;&nbsp;{formatTimestamp(data.time)}
          </div>
          <div className='noti-card-label-reply'>REPLY</div>
        </div>

        <div className='activity-post-content'>
          {parse(this.state.content, this.parseOptions)}
        </div>

        <Tooltip id="my-tooltip" />
        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={() => this.setState({ alert: '' })} />
        <ViewImageModal open={this.state.openImage} src={this.imgUrl} onClose={this.onClose} />
      </div>
    )
  }
}

export default NotiCard;