import React from 'react';

class Loading extends React.Component {
  render() {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <div id="loading" />
      </div>
    );
  }
}

export default Loading;