import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

//--------------------------
// --> SETTINGS FOR QUILL
// Add the audio supporting

const Quill = ReactQuill.Quill;
const BlockEmbed = Quill.import('blots/block/embed');

class AudioBlot extends BlockEmbed {
  static create(url: any) {
    let node = super.create();
    node.setAttribute('src', url);
    node.setAttribute('controls', '');
    return node;
  }
  
  static value(node: any) {
    return node.getAttribute('src');
  }
}

AudioBlot.blotName = 'audio';
AudioBlot.tagName = 'audio';
Quill.register(AudioBlot);

// <-- SETTINGS FOR QUILL
//--------------------------

interface SharedQuillEditorProps {
  placeholder?: string;
  isActivity?: boolean;
  hasFontSize?: boolean;
  onChange?: Function;
  getRef: Function;
}

interface SharedQuillEditorState {
  content: string;
  openAddMedia: boolean;
}

class SharedQuillEditor extends React.Component<SharedQuillEditorProps, SharedQuillEditorState> {

  quillRef: any;
  quillPosition: number;
  reactQuillRef: any;
  quillModules: any;
  quillFormats: any;

  constructor(props: SharedQuillEditorProps) {
    super(props);

    this.state = {
      content: '',
      openAddMedia: false
    }

    this.quillRef = null;
    this.reactQuillRef = null;
    this.quillPosition = 0;

    this.onContentChange = this.onContentChange.bind(this);
    this.onContentChangeSelection = this.onContentChangeSelection.bind(this);
    this.onInsertMedia = this.onInsertMedia.bind(this);
    this.onQuillImage = this.onQuillImage.bind(this);
  }

  componentDidMount() { 
    this.attachQuillRefs();
  }

  attachQuillRefs() {
    // Ensure React-Quill reference is available:
    if (typeof this.reactQuillRef.getEditor !== 'function') return;

    // Skip if Quill reference is defined:
    if (this.quillRef != null) return;
    
    const quillRef = this.reactQuillRef.getEditor();
    if (quillRef != null) {
      this.quillRef = quillRef;
      this.props.getRef(quillRef);
    } 
  }

  onContentChange(value: any) {
    this.setState({content: value});

    if (this.props.onChange) {
      let text = this.quillRef.getText().trim().replaceAll(' ', '');
      text     = text.replace(/[\r\n]/g, ''); // remove \n (enter)
      this.props.onChange(text.length);
    }
  };

  onContentChangeSelection() {
    let range = this.quillRef.getSelection();
    if (range) {
      this.quillPosition = range.index;
    }
  };

  onQuillImage() {
    this.setState({openAddMedia: true});
  }

  onInsertMedia(data: any) {
    this.setState({openAddMedia: false});
    this.quillRef.insertEmbed(this.quillPosition, data.category, data.url);
  }

  setQuill() {
    let container = [
      this.props.hasFontSize && {'header': [1, 2, 3, false]},
      'bold', 'italic', 'underline', 'strike',
      {'align': ''}, {'align': 'center'}, {'align': 'right'},
      'link', 'image', 'video'
    ];

    // if (this.props.isActivity)
    //   container = [
    //     'bold', 'italic', 'underline', 'strike',
    //     {'align': ''}, {'align': 'center'}, {'align': 'right'},
    //     {'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}, 'link', 'image'
    //   ];

    this.quillModules = {
      toolbar: {
        // handlers: {
        //   image: this.onQuillImage,
        // },
        container: [container]
      }
    };
    
    // if (this.props.isActivity)
    //   this.quillModules = {toolbar: null};

    this.quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'indent', 'align', 'link', 'image', 'video', 'audio'];
    // if (this.props.isActivity)
    //   this.quillFormats = ['image', 'audio'];
  }

  render() {
    this.setQuill();

    return (
      <div>
        <ReactQuill
          theme="snow"
          value={this.state.content}
          onChange={this.onContentChange}
          onChangeSelection={this.onContentChangeSelection}
          modules={this.quillModules}
          formats={this.quillFormats}
          placeholder={this.props.placeholder ? this.props.placeholder : 'Enter...'}
          ref={(el) => { this.reactQuillRef = el }}
        />
      </div>
    )
  }
}

export default SharedQuillEditor;