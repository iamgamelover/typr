import React from 'react';
import './NotiPage.css';
import { getDataFromAO, getDefaultProcess, getWalletAddress, uuid } from '../util/util';
import { PAGE_SIZE } from '../util/consts';
import Loading from '../elements/Loading';
import { Server } from '../../server/server';
import NotiCard from '../elements/NotiCard';

interface NotiPageState {
  notis: any;
  loading: boolean;
  loadNextPage: boolean;
  open: boolean;
  isAll: boolean;
}

class NotiPage extends React.Component<{}, NotiPageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      notis: [],
      loading: true,
      loadNextPage: false,
      open: false,
      isAll: false,
    };


    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.atBottom = this.atBottom.bind(this);

    // subscribe('wallet-events', () => {
    //   this.forceUpdate();
    // });
  }

  componentDidMount() {
    this.getNotis();
    window.addEventListener('scroll', this.atBottom);
  }

  componentWillUnmount(): void {
    // clearInterval(this.refresh);
    window.removeEventListener('scroll', this.atBottom);
  }

  atBottom() {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight + 300 >= scrollHeight) {
      setTimeout(() => {
        if (!this.state.loading && !this.state.loadNextPage && !this.state.isAll)
          this.nextPage();
      }, 200);
    }
  }

  onOpen() {
    this.setState({ open: true });
  }

  onClose(data: any) {
    // console.log("onClose:", data)
    this.setState({ open: false });
    if (data) {
      this.getNotis();
      // this.setState({ posts: [], loading: true, isAll: false });
      this.setState({ isAll: false });
    }
  }

  // async start() {
  //   await this.getStory();
  // }

  async getNotis() {
    let address = await getWalletAddress();
    let process = await getDefaultProcess(address);

    let notis = await getDataFromAO(process, 'Get-Notis', { offset: 0 });
    console.log("notis:", notis)

    if (notis.length < PAGE_SIZE)
      this.setState({ isAll: true })

    this.setState({ notis, loading: false });
  }

  async nextPage() {
    let process = Server.service.getDefaultProcess();
    console.log("process:", process)

    this.setState({ loadNextPage: true });

    let offset = this.state.notis.length.toString();
    console.log("offset:", offset)

    let notis = await getDataFromAO(process, 'Get-Notis', { offset });
    console.log("notis:", notis)
    if (notis.length < PAGE_SIZE)
      this.setState({ isAll: true })

    let total = this.state.notis.concat(notis);
    this.setState({ notis: total, loadNextPage: false });
  }

  renderNotis() {
    if (this.state.loading) return (<Loading />);

    let divs = [];
    for (let i = 0; i < this.state.notis.length; i++) {
      divs.push(
        <NotiCard key={i} data={this.state.notis[i]} />
      )
    }

    return divs
  }

  render() {
    return (
      <div className='story-page'>
        <div className='story-page-header'>
          <div className='noti-page-title'>Notifications</div>
        </div>

        {this.renderNotis()}

        {this.state.loadNextPage && <Loading />}
        {this.state.isAll &&
          <div style={{ marginTop: '20px', color: 'gray' }}>
            No more notifications.
          </div>
        }
      </div>
    )
  }
}

export default NotiPage;