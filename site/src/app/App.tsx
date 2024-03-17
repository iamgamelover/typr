import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import SitePage from './pages/SitePage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';
import HomePage from './pages/HomePage';
import ActivityPostPage from './pages/ActivityPostPage';


class App extends React.Component<{}, {}> {
  constructor(props = {}) {
    super(props);
  }

  componentDidMount() {
  }

  render() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<SitePage />}>
            <Route index element={<HomePage />} />
            <Route path='/activity/post/:id' element={<ActivityPostPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
