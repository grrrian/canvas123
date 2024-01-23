import React, { Component } from 'react';
import './App.css';
import fire from './fire';
import Firebase from 'firebase';
import Button from 'material-ui/Button';
import ReactDOM from 'react-dom';
import { GridList, GridListTile } from 'material-ui/GridList';
import loadEditView from './CropEdit.js';
import Dialog from 'material-ui/Dialog';
import Slide from 'material-ui/transitions/Slide';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import Typography from 'material-ui/Typography';
import CloseIcon from 'material-ui-icons/Close';
import AddPhotoIcon from 'material-ui-icons/AddAPhoto';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import { lightBlue, blueGrey, red } from 'material-ui/colors';
import _ from 'lodash';
import Paper from 'material-ui/Paper';
import logo from './images/logo-top.png';
import TextField from 'material-ui/TextField';
import { BrowserRouter, Route } from 'react-router-dom';
import Admin from './Admin.js';
import { LinearProgress } from 'material-ui/Progress';
import DeleteIcon from 'material-ui-icons/Delete';
import WarningIcon from 'material-ui-icons/Warning';
import Tooltip from 'material-ui/Tooltip';
import {StripeProvider} from 'react-stripe-elements';
import MyStoreCheckout from './MyStoreCheckout';
import {Helmet} from 'react-helmet';
import stripeLogo from './images/powered_by_stripe.png';

const theme = createMuiTheme({
  palette: {
    primary: blueGrey,
    secondary: lightBlue,
    error: red,
  },
});

const styles = {
  gridContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    background: 'url(' + require('./images/wall.jpg') + ')',
    backgroundColor: 'grey',
    backgroundSize: 'cover',
    padding: '60px 0px'
  },
  subheader: { 
    backgroundColor: '#44BED2', 
    textAlign: 'center', 
    color: 'white', 
    padding: '2px', 
    fontWeight: 'lighter' 
  },
  textField: { 
    display: 'table', 
    margin: '0 auto',
  },
};

function Transition(props) {
  return <Slide direction="down" {...props} />;
}

function new_script(src) {
  return new Promise(function(resolve, reject){
    var script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', function () {
      resolve();
    });
    script.addEventListener('error', function (e) {
      reject(e);
    });
    document.body.appendChild(script);
  })
};
// Promise Interface can ensure load the script only once.
var my_script = new_script('https://js.stripe.com/v3/');

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      croppedImagesSrc: [], 
      dialogOpen: false, 
      lastCrop: {},
      form: {
        name: '', street: '', city: '', country: '', postal: ''
      },
      columns: 2,
      orderError: null,
      orderId: null,
      imageProgress: 0,
      status: 'start',
    };
  }
  
  componentDidMount() {
    var self = this;
    self.calculateColumns();
    window.onresize = function(event) {
      self.calculateColumns();
    };
  }

  do_load = () => {
    var self = this;
    my_script.then(function() {
      self.setState({'status': 'done'});
    }).catch(function() {
      self.setState({'status': 'error'});
    })
  }

  calculateColumns = () => {
    if (window.innerWidth < 360) {
      this.setState(prevState => ({
        columns: Math.min(this.state.croppedImagesSrc.length, 1)
      }));
    } else if (window.innerWidth < 720) {
      this.setState(prevState => ({
        columns: Math.min(this.state.croppedImagesSrc.length, 2)
      }));
    } else if (window.innerWidth < 980) {
      this.setState(prevState => ({
        columns: Math.min(this.state.croppedImagesSrc.length, 3)
      }));
    } else {
      this.setState(prevState => ({
        columns: Math.min(this.state.croppedImagesSrc.length, 4)
      }));
    }
  }

  handlePickClick = event => {
    const domNode = ReactDOM.findDOMNode(this.inputElement);
    domNode.click();
  }

  handleCloseDialog = event => {
    this.setState(prevState => ({
      dialogOpen: false
    }));
  }

  handleSaveAndCloseDialog = event => {
    var self = this;

    this.setState(prevState => ({
      dialogOpen: false
    }), function() {
      setTimeout(function() {
        var dataUrl = _.invoke(self.state.lastCrop.imageRef.getCroppedCanvas(), 'toDataURL');
        var name = _.get(self.state, 'croppedImagesSrc.length', '0') + '_'  + _.get(self.state, 'lastCrop.fileName');
    
        self.setState(prevState => ({
          croppedImagesSrc: [...prevState.croppedImagesSrc, {
            encoding: dataUrl, 
            name: name,
            isLowRes: _.get(self, 'state.lastCrop.isLowRes', false)
          }]
        }), self.calculateColumns);
      }, 100)
    });

  }

  handleCropComplete = (imageRef, fileName, isLowRes) => {
    this.setState(prevState => ({
      lastCrop: {
        imageRef: imageRef,
        fileName: fileName,
        isLowRes: isLowRes
      }
    }));
  }

  onImageChange = event => {
    var reader = new FileReader();
    var file = this.inputElement.files[0];

    if (file) {
      reader.readAsDataURL(file);
      
      reader.onload = function(e) {
        this.setState(prevState => ({
          dialogOpen: true
        }));

        var image = new Image();
        image.src = e.target.result;
        image.onload = function() {
          loadEditView(e.target.result, this.cropEditor, file.name, this.handleCropComplete);
        }.bind(this);
      }.bind(this);
  
      reader.onloadend = function (e) {
        this.inputElement.value = '';
      }.bind(this);
    }
  }

  handleShipIt = event => {
    var self = this;
    var promises = [];
    var imagesUrl = [];
    var numImages = self.state.croppedImagesSrc.length;
    var count = 0;
    self.setState({ imageProgress: 1 });
    
    // Store the images
    _.each(self.state.croppedImagesSrc, function(image) {
      var imageRef = Firebase.storage().ref().child('crap/' + image.name);
      promises.push(imageRef.putString(image.encoding, 'data_url').then(function(snapshot) {
        imagesUrl.push(snapshot.downloadURL);
        count ++;
        self.setState({imageProgress: (count/numImages)*100 });
      }));
    });

    // Store the order
    Promise.all(promises).then(function() { 
      count = 0;
      self.setState({ imageProgress: 0 });

      var newOrder = fire.database().ref('orders').push( { 
        images: imagesUrl,
        shippingInfo: self.state.form, 
        createdAt: Firebase.database.ServerValue.TIMESTAMP , 
        userId: null, 
        paymentId: null 
      }, function(error) {
        if (error) {
          console.log('Error sending order:', error);
          self.setState({ orderError: 'We apologize, there was a problem processing your order.' });
        }
        else {
          self.setState({ orderId: _.get(newOrder, 'key'), orderError: null });
        }
      });
    }).catch(function(error) {
      count = 0;
      self.setState({ imageProgress: 0 });

      console.log('Error uploading images :', error);
      self.setState({ orderError: 'This is strange... We have trouble uploading your images. Please try refreshing the page.' });
    })

  }

  handleFormChange = prop => event => {
    var form = this.state.form;
    form[prop] = event.target.value;
    this.setState({ form: form });
  };

  handleDeleteImage = index => {
    _.pullAt(this.state.croppedImagesSrc, [index]);
    this.setState( {
      croppedImagesSrc: this.state.croppedImagesSrc
    })
  }

  render() {
    var self = this;
    if (self.state.status === 'start') {
      self.state.status = 'loading';
      setTimeout(function () {
        self.do_load()
      }, 0);
    }

    const ClientApp = (
      <div>
        <Helmet>
          <meta charSet="utf-8" />
          <title>Canvas123</title>
        </Helmet>
        <AppBar position="static" color="default">
          <Toolbar style={{  display: 'flex', textAlign: 'center', alignItems: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
            <img src={logo} style={{ height: '45px' }} alt="Canvas123"/>
          </Toolbar>
        </AppBar>

        <div style={styles.subheader}>
          1. Pick your photos
        </div>

        <input type="file" name="fileinput" id="fileinput" 
          ref={input => this.inputElement = input} accept="image/*" 
          style={{ display: 'none' }} onChange={this.onImageChange} />

        <div style={styles.gridContainer}>
          <GridList cellHeight={'auto'} cols={this.state.columns}>
            {this.state.croppedImagesSrc.map((tile, index) => (
              <GridListTile key={tile.name} cols={_.get(this, 'state.croppedImagesSrc.length', 0) > 0 ? 1 : this.state.columns} style={{ textAlign: 'center' }}>
                <Paper elevation={4} style={{ height:'160px', width: '160px', margin: '10px', display: 'inline-block', position: 'relative', overflow: 'visible'}} square={true}>
                  <img src={tile.encoding} alt="your canvas" style={{ height:'160px', width: '160px'}}/>
                  { tile.isLowRes &&
                  <Tooltip title="Low Quality">
                    <Button fab mini aria-label="low-res" style={{ position: 'absolute', left: '-10px', top: '-10px', backgroundColor: 'orange', color:'white' }}>
                      <WarningIcon />
                    </Button>
                  </Tooltip>
                  }
                  <Tooltip title="Delete">
                    <Button onClick={() => {this.handleDeleteImage(index)}} fab mini aria-label="delete" style={{ position: 'absolute', right: '-10px', top: '-10px' }}>
                      <DeleteIcon />
                    </Button>
                  </Tooltip>
                </Paper>
              </GridListTile>
            ))}
            <GridListTile key={'add-pic'} cols={_.get(this, 'state.croppedImagesSrc.length', 0) > 0 ? 1 : this.state.columns} style={{ textAlign: 'center' }}>
              <Paper elevation={4} style={{ height:'160px', width: '160px', margin: '10px', display: 'inline-block', background: 'linear-gradient(45deg, #44BED2 30%, #A1CD47 90%)' }} square={true}>
                <IconButton onClick={this.handlePickClick} aria-label="Add photo" style={{ height: '150px', fontSize: '50px', color: 'white' }}>
                  <AddPhotoIcon />
                </IconButton>
              </Paper>
            </GridListTile>
          </GridList>
        </div>
        
        { !!this.state.croppedImagesSrc.length &&
          <div>
            <div style={styles.subheader}>
              2. Enter your shipping information
            </div>
            <form style={{ paddingTop: '10px', paddingBottom: '40px' }} >
              <TextField
                id="name"
                label="Name"
                autoComplete='name'
                value={this.state.form.name}
                onChange={this.handleFormChange('name')}
                margin="normal"
                required
                style={styles.textField}
              />
              <TextField
                id="street"
                label="Street Address"
                autoComplete='address-line1'
                value={this.state.form.street}
                onChange={this.handleFormChange('street')}
                margin="normal"
                required
                style={styles.textField}
              />
              <TextField
                id="city"
                label="City"
                autoComplete='city'
                value={this.state.form.city}
                onChange={this.handleFormChange('city')}
                margin="normal"
                required
                style={styles.textField}
              />
              <TextField
                id="country"
                label="Country"
                autoComplete='country-name'
                value={this.state.form.country}
                onChange={this.handleFormChange('country')}
                margin="normal"
                required
                style={styles.textField}
              />
              <TextField
                id="postal"
                label="Postal Code"
                autoComplete='postal-code'
                value={this.state.form.postal}
                onChange={this.handleFormChange('postal')}
                margin="normal"
                required
                style={styles.textField}
              />
            </form>
          </div>
        }
        
        { (self.state.status === 'done' && !!this.state.croppedImagesSrc.length
          && !!self.state.form.name && !!self.state.form.street && !!self.state.form.city
          && !!self.state.form.country && !!self.state.form.postal) &&
          <div>
            <div style={styles.subheader}>
              3. Enter your payment information
            </div>
          
            <div style={{ margin: '20px auto', maxWidth: '400px' }}>
              <Paper elevation={4} style={{ padding: '10px' }}>
                <StripeProvider apiKey="pk_test_FQeJsTivJYdCpUQPnN2AfdiJ">
                  <MyStoreCheckout name={this.state.form.name} amount={111} onPayed={this.handleShipIt}/>
                </StripeProvider>
              </Paper>
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <a href="https://stripe.com" target="_blank" rel="noopener noreferrer">
                  <img src={stripeLogo} alt="Stripe"/>
                </a>
                <div style={{ color: 'grey', fontSize: 'smaller' }}>
                  Your payments are safe with Stripe. <a href="https://stripe.com/docs/security/stripe" target="_blank" rel="noopener noreferrer">Learn why.</a>
                </div>
              </div>
            </div>
          </div>
        }

        {!!this.state.imageProgress &&
          <div  style={{ width: '50%', minWidth: '300px', margin: '0 auto', padding: '30px', textAlign: 'center' }}>
            <LinearProgress color="accent" mode="determinate" value={this.state.imageProgress} />
            <Typography color="accent">Uploading images ({this.state.imageProgress}%)</Typography>
          </div>
        }

        {!!this.state.orderError && <p style={{ color: 'red' }}>{this.state.orderError}</p>}

        {!!this.state.orderId && 
          <div style={{ margin: '40px 0' }}>
            <Paper style={{ width: '50%', minWidth: '300px', margin: '0 auto', padding: '16px', textAlign: 'center' }}>
              <h3 style={{  color: '#44BED2' }}>Thank you for your order!</h3>
              <p style={{ color: 'grey' }}>Get your wall ready for your canvases!</p>
              <p style={{ color: 'grey' }}>For reference, here is you order id:</p>
              <b>{this.state.orderId}</b>
            </Paper>
          </div>
        }
      </div>
    );

    return (
      <MuiThemeProvider theme={theme}>
        <BrowserRouter>
          <div>
            <Route path="/admin" component={Admin}/>
            <Route exact path="/" render={() => ClientApp}/>
          </div>
        </BrowserRouter>
        
        <Dialog fullScreen 
                open={this.state.dialogOpen}
                onClose={this.handleCloseDialog}
                transition={Transition}>
          <AppBar>
            <Toolbar>
              <IconButton color="contrast" onClick={this.handleCloseDialog} aria-label="Close">
                <CloseIcon />
              </IconButton>
              <Typography type="title" color="inherit" style={{ flex: 1, fontWeight: 'normal', paddingLeft: '10px' }}>
                Crop your photo
              </Typography>
              <Button color="contrast" onClick={this.handleSaveAndCloseDialog}>
                Done
              </Button>
            </Toolbar>
          </AppBar>
          <div ref={input => {this.cropEditor = input }}></div>
        </Dialog>
      </MuiThemeProvider>
    );
  }
}

export default App;
