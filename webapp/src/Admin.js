import _ from 'lodash';
import React from 'react';
import fire from './fire';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import logo from './images/logo-top.png';
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails,
} from 'material-ui/ExpansionPanel';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import Grid from 'material-ui/Grid';
import Firebase from 'firebase';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';

class Admin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: [],
      user: null,
      form: {
        email: '',
        password: ''
      },
      shownImages: []
    }
  }
  
  componentWillMount() {
    var self = this;

    // Create reference to orders in Firebase Database
    let ordersRef = fire.database().ref('orders').orderByKey();
    ordersRef.on('child_added', snapshot => {
      // Update React state when message is added at Firebase Database
      let order = { data: snapshot.val(), id: snapshot.key };
      self.setState({ orders: [order].concat(self.state.orders) });
    })

    // Check sign in state
    Firebase.auth().onAuthStateChanged(function(user) {
      self.setState({ user: user }); //.email, .displayName
    });
  }

  handleFormChange = prop => event => {
    var form = this.state.form;
    form[prop] = event.target.value;
    this.setState({ form: form });
  }

  handleShowImage(key) {
    this.setState(prevState => ({
      shownImages: _.set(prevState.shownImages, key, true)
    }));
  }

  handleSignIn = event => {
    var self = this;

    Firebase.auth().signInWithEmailAndPassword(self.state.form.email, self.state.form.password)
    .then(function() {
      self.setState({ signInError: null });
    })
    .catch(function(error) {
      self.setState({ signInError: error.message });
    });
  }

  handleSignOut = event => {
    Firebase.auth().signOut();
  }
  
  //this.props.match.params.id
  render() {
    return (
      <div>
        <AppBar position="static" color="default">
          <Toolbar>
            <div  style={{  display: 'flex', alignItems: 'center', marginRight: 'auto' }}>
              <img src={logo} style={{ height: '50px' }} alt="Canvas123"/>
              <div>Admin</div>
            </div>
            <Button onClick={this.handleSignOut}>Sign out</Button>
          </Toolbar>
        </AppBar>
          { !this.state.user &&
            <form style={{ width: '70%', minWidth: '300px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
              <TextField
                id="email"
                label="Email"
                value={this.state.form.email}
                onChange={this.handleFormChange('email')}
                margin="normal"
                type="email"
                style={{ 
                  display: 'table', 
                  margin: '0 auto',
                }}
                autoComplete="on"
              />
              <TextField
                id="password"
                label="Password"
                value={this.state.form.password}
                onChange={this.handleFormChange('password')}
                margin="normal"
                type="password"
                style={{
                  display: 'table', 
                  margin: '0 auto',
                }}
                autoComplete="on"
              />
              <Button raised style={{ marginTop:'30px' }} onClick={this.handleSignIn}>Sign in</Button>
            </form>
          }

          { !!this.state.signInError &&
            <p style={{ textAlign: 'center', color: 'red' }}>
              Wrong Credentials. Try again.
            </p>
          }

          { !!this.state.user && 
          <div style={{ padding: '5px 10px' }}>
            <h1 style={{ color: '#A1CD47', fontWeight: 'normal', marginLeft: '23px' }}>Orders {this.state.orders.length > 0 && <span>({this.state.orders.length})</span>}</h1> 
            {
              this.state.orders.map( order => 
                <ExpansionPanel key={order.id}>
                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                      <Grid container justify="space-between">
                        <Grid item>
                          <span style={{ color: '#44BED2' }}>Order ID: </span> {order.id}
                        </Grid>
                        <Grid item>
                          <span style={{ color: '#44BED2' }}>Name: </span> {order.data.shippingInfo.name}
                        </Grid>
                      </Grid>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <div>
                      <p><span style={{ color: '#44BED2' }}>Date: </span> {new Date(order.data.createdAt).toString()}</p>
                      <p style={{ color: '#44BED2' }}>Shipping Info:</p>
                      <p>{order.data.shippingInfo.name}</p>
                      <p>{order.data.shippingInfo.street}</p>
                      <p>{order.data.shippingInfo.city}</p>
                      <p>{order.data.shippingInfo.country}</p>
                      <p>{order.data.shippingInfo.postal}</p>
                      {(!!order.data.images && !!order.data.images.length && !this.state.shownImages[order.id]) &&
                        <div>
                          <Button raised onClick={() => {this.handleShowImage(order.id)}}>Show {order.data.images.length} images</Button>
                        </div>
                      }
                      {
                        (!!order.data.images && this.state.shownImages[order.id]) &&
                        order.data.images.map( image => (
                          <a href={image} target="_blank" key={image}>
                            <img src={image} alt="" style={{ maxWidth: '50px', maxHeight: '50px', padding: '10px' }}/>
                          </a>
                        ))
                      }
                    </div>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
              )
            }
          </div>
        }
      </div>
    )
  }
}

export default Admin;