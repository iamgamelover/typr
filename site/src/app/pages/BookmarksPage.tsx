import React from 'react';
import './BookmarksPage.css';
import { getDataFromAO, getDefaultProcess, isLoggedIn, messageToAO } from '../util/util';
import { Server } from '../../server/server';
import ActivityPost from '../elements/ActivityPost';
import { BsCloudUpload } from 'react-icons/bs';
import MessageModal from '../modals/MessageModal';

interface BookmarksPageState {
  bookmarks: any;
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  isLoggedIn: string;
  address: string;
}

class BookmarksPage extends React.Component<{}, BookmarksPageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      bookmarks: [],
      question: '',
      alert: '',
      message: '',
      loading: true,
      isLoggedIn: '',
      address: '',
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    let address = await isLoggedIn();
    this.setState({ isLoggedIn: address, address });
    this.getBookmarks(address);
  }

  async getBookmarks(address: string) {
    // ==> get from localStorage
    let bookmarks = [];
    let val = localStorage.getItem('bookmarks');
    if (val) bookmarks = JSON.parse(val);

    // ==> get from Arweave
    // let process = await getDefaultProcess(address);
    // let bookmarks = await getDataFromAO(process, 'AOTwitter.getBookmarks');

    this.setState({ bookmarks, loading: false });
  }

  renderBookmarks() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    for (let i = this.state.bookmarks.length - 1; i >= 0; i--) {
      let data = this.state.bookmarks[i];
      data.isBookmarked = true;
      Server.service.addPostToCache(data);

      divs.push(
        <ActivityPost
          key={i}
          data={data}
        />
      )
    }

    return divs.length > 0 ? divs : <div>No bookmarks yet.</div>
  }

  async upload2AO() {
    this.setState({ message: 'Upload to AO...' });

    let process = await getDefaultProcess(Server.service.getActiveAddress());
    let resp = await messageToAO(
      process,
      { data: this.state.bookmarks },
      'AOTwitter.setBookmark'
    );

    this.setState({ message: '' });
  }

  render() {
    return (
      <div className='bookmarks-page'>
        <div className='bookmarks-page-header'>
          <div className='bookmarks-page-header-title'>Bookmarks</div>

          {this.state.bookmarks.length > 0 &&
            <div
              className="app-post-button story reply"
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Upload bookmarks to AO"
              onClick={() => this.upload2AO()}
            >
              <BsCloudUpload size={23} />
              <div>Upload</div>
            </div>
          }
        </div>

        {this.renderBookmarks()}
        <MessageModal message={this.state.message} />
      </div>
    )
  }
}

export default BookmarksPage;