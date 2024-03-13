import './Modal.css'

const Modal = props => {
  // close the modal
  // if (!props.open) return null;

  return (
    <div className={`modal ${props.open ? 'open' : ''}`} onClick={props.onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {(props.showHeader || props.showHeader == undefined) &&
          <div className="modal-header">
            <span className="close" onClick={props.onClose}>&times;</span>
            {props.header}
          </div>
        }

        <div className="modal-body">
          {props.children}
        </div>

        <div className="modal-footer">
          {props.showBtnCancel &&
            <button className="cancel-button" onClick={props.onClose}>
              Cancel
            </button>
          }

          {(props.showBtnOk || props.showBtnOk == undefined) &&
            <button className="ok-button" onClick={props.onBtnOk} disabled={props.btnOkDisabled} style={{backgroundColor: props.btnOkColor}}>
              {props.btnOkTitle}
            </button>
          }
        </div>
      </div>
    </div>
  )
}

export default Modal