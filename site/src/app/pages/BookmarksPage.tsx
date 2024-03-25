import React from 'react';
import './BookmarksPage.css';
import { getDataFromAO, getDefaultProcess, isLoggedIn } from '../util/util';
import { Server } from '../../server/server';
import ActivityPost from '../elements/ActivityPost';

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
    let process = await getDefaultProcess(address);
    let bookmarks = await getDataFromAO(process, 'AOTwitter.getBookmarks');
    // console.log("bookmarks:", bookmarks)

    this.setState({ bookmarks, loading: false });
  }

  renderBookmarks() {
    if (this.state.loading)
      return (<div>Loading...</div>);

    let divs = [];
    for (let i = this.state.bookmarks.length - 1; i >= 0; i--) {
      let data = JSON.parse(this.state.bookmarks[i]);
      data.data.isBookmarked = true;
      
      divs.push(
        <ActivityPost
          key={i}
          data={data.data}
        />
      )
    }

    return divs.length > 0 ? divs : <div>No bookmarks yet.</div>
  }

  render() {
    return (
      <div className='bookmarks-page'>
        <h3>Bookmarks</h3>
        {this.renderBookmarks()}
      </div>
    )
  }
}

export default BookmarksPage;