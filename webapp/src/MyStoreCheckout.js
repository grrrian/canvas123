import React from 'react';
import {Elements} from 'react-stripe-elements';

import InjectedCheckoutForm from './CheckoutForm';

class MyStoreCheckout extends React.Component {
  render() {
    return (
      <Elements>
        <InjectedCheckoutForm name={this.props.name} amount={this.props.amount} onPayed={this.props.onPayed}/>
      </Elements>
    );
  }
}

export default MyStoreCheckout;