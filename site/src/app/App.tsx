import React from 'react';
import {BrowserRouter, HashRouter, Route, Routes} from 'react-router-dom';
import SitePage from './pages/SitePage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';
import HomePage from './pages/HomePage';
import ActivityPostPage from './pages/ActivityPostPage';
import GamesPage from './pages/GamesPage';
import ChatPage from './pages/ChatPage';
import TokenPage from './pages/TokenPage';
import StoryPage from './pages/StoryPage';
import BookmarksPage from './pages/BookmarksPage';
import ProfilePage from './pages/ProfilePage';
import FollowPage from './pages/FollowPage';

class App extends React.Component<{}, {}> {
  constructor(props = {}) {
    super(props);
  }

  componentDidMount() {
  }

  render() {
    return (
      <HashRouter>
        <Routes>
          <Route path='/' element={<SitePage />}>
            <Route index element={<HomePage />} />
            <Route path='/post/:id' element={<ActivityPostPage type='post' />} />
            <Route path='/story/:id' element={<ActivityPostPage type='story' />} />
            <Route path="/story" element={<StoryPage />} />
            <Route path="/token" element={<TokenPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user/:id" element={<ProfilePage />} />
            <Route path="/follow/:id" element={<FollowPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    );
  }
}

export default App;
