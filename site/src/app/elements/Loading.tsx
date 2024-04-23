import React from 'react';

interface LoadingProps {
  marginTop?: string;
}

class Loading extends React.Component<LoadingProps, {}> {
  render() {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        marginTop: this.props.marginTop ? this.props.marginTop : '20px'
      }}>
        <div id="loading" />
      </div>
    );
  }
}

export default Loading;