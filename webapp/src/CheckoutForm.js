import React from 'react';
import {injectStripe} from 'react-stripe-elements';
import CardSection from './CardSection';
import Button from 'material-ui/Button';

const styles = {
  confirmButton: {
    margin: '20px auto 0 auto',
    display: 'table',
    fontWeight: 'normal'
  },
  error: {
    color: 'red',
    fontSize: 'smaller',
    textAlign: 'center',
    paddingTop: '10px'
  }
}
class CheckoutForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      error: false,
      processing: false
    };
  }

  handleSubmit = (ev) => {
    // We don't want to let default form submission happen here, which would refresh the page.
    ev.preventDefault();

    this.setState({
      error: false,
      processing: true
    });

    // Within the context of `Elements`, this call to createToken knows which Element to
    // tokenize, since there's only one in this group.
    this.props.stripe.createToken({name: this.props.name || 'No name'}).then(async ({token}) => {
      if (token === undefined) {
        this.setState({
          error: true,
          processing: false,
          success: false
        });
      } else {
        // Pass the received token to our Firebase function
        let res = await this.charge(token, 100, 'CAD');
        if (res.body.error) {
          console.log('Problem charing the card: ', res.body.error);
          this.setState({
            error: true,
            processing: false,
            success: false
          });
        } else {
          // Card successfully charged
          this.setState({
            error: false,
            processing: false,
            success: true
          });
          this.props.onPayed();
        }
      }
    });

  }
  
  async charge(token, amount, currency) {
    const FIREBASE_FUNCTION = 'https://us-central1-tilesbyjoe.cloudfunctions.net/charge/';
    const res = await fetch(FIREBASE_FUNCTION, {
      method: 'POST',
      body: JSON.stringify({
          token,
          charge: {
              amount,
              currency,
          },
      }),
    });
    const data = await res.json();
    data.body = JSON.parse(data.body);
    return data;
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <CardSection/>
        <Button color="primary" disabled={!!this.state.processing || !!this.state.success} style={styles.confirmButton} onClick={this.handleSubmit}>
          {!!this.state.processing && 'Processing...'}
          {!this.state.processing && !this.state.success && 'Confirm'}
          {!this.state.processing && !!this.state.success && 'Sucessfully charged!'}
        </Button>
        {!!this.state.error &&
          <div style={styles.error}>Wrong credit card information</div>
        }
      </form>
    );
  }
}

export default injectStripe(CheckoutForm);