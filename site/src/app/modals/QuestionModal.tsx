import React from 'react';
import './Modal.css'

interface QuestionModalProps {
  message: string;
  onYes: Function;
  onNo: Function;
}

class QuestionModal extends React.Component<QuestionModalProps, {}> {
  constructor(props: QuestionModalProps) {
    super(props);
  }

  render() {
    if (this.props.message == '')
      return (null);

    return (
      <div className="modal open">
        <div className="modal-content" style={{ width: '250px', textAlign: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>{this.props.message}</div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }} >
            <button className='question-modal-button-no' onClick={() => this.props.onNo()}>No</button>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
            <button onClick={() => this.props.onYes()}>Yes</button>
          </div>
        </div>
      </div>
    )
  }
}

export default QuestionModal;