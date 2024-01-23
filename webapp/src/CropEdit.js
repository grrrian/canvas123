import React, {  PureComponent } from 'react';
import ReactDOM from 'react-dom';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import _ from 'lodash';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';

export default function loadEditView(dataUrl, cropEditor, fileName, handleCropCallback) {
  class Parent extends PureComponent {
    constructor() {
      super();
      this.state = {
        croppedWidth: 0,
        hideWarning: false,
      };
    }
    
    _crop() {
      setTimeout(() => {
        var canvas = _.invoke(this, 'refs.cropper.getCroppedCanvas');
        var isLowRes = _.get(canvas, 'width', 0) < 600 ? true : false;

        this.setState({
          croppedWidth: _.get(canvas, 'width'),
        })

        handleCropCallback(this.refs.cropper, 'cropped_' + fileName, isLowRes);
      });  
    }

    handleCloseWarning = event => {
      this.setState({
        hideWarning: true
      });
    }

    render() {
      return (
        <div>
          <Cropper
            ref='cropper'
            src={dataUrl}
            dragMode='move'
            style={{ height: window.innerHeight, width: '100%' }}
            aspectRatio={1}
            guides={false}
            crop={this._crop.bind(this)} />
          { (!this.state.hideWarning && !!this.state.croppedWidth && this.state.croppedWidth < 600) &&
            <div style={{ position: 'absolute', left: 0, bottom: 0, backgroundColor: 'orange', color: 'white', opacity: '1', padding: '10px', width: '100%'}}>
              <IconButton color="contrast" onClick={this.handleCloseWarning} aria-label="Close" style={{ verticalAlign: 'middle', height: '22px', width: '22px', marginRight: '10px', marginBottom: '4px' }}>
                <CloseIcon />
              </IconButton>
              Your crop is <b>{this.state.croppedWidth}px</b> wide. For best print quality, crop 600px or use a higher quality image.
            </div>
          }
        </div>
      );
    }
  }

  ReactDOM.render(<Parent />, cropEditor);
}