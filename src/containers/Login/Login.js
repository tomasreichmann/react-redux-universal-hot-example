import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import {login, logout} from 'redux/modules/firebase';
import { Button, Alert, Input } from 'components';

@connect(
  state => ({
    user: state.firebase.get('user'),
    errorMessage: state.firebase.getIn(['loginError', 'message']),
  } ),
  {login, logout})
export default class Login extends Component {
  static propTypes = {
    user: PropTypes.object,
    login: PropTypes.func,
    logout: PropTypes.func,
    errorMessage: PropTypes.object,
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const email = this.emailElement;
    const password = this.passwordElement;
    console.log('login', email.value, password.value);
    this.props.login(email.value, password.value);
    password.value = '';
  }

  render() {
    const {user, logout: logoutAction} = this.props;
    const styles = require('./Login.scss');
    console.log('user', user);
    return (
      <div className={styles.loginPage + ' container'}>
        <Helmet title="Login"/>
        <h1>Login</h1>
        {user ?
        <div>
          <p>You are currently logged in as {user.get('displayName') || user.get('email') }.</p>

          <div>
            <Button danger onClick={logoutAction}><i className="fa fa-sign-out"/>{' '}Log Out</Button>
          </div>
        </div>
        :
        <div>
          <form className="login-form form-inline" onSubmit={this.handleSubmit}>
            <div className="form-group">
              <Input inputRef={(el) => (this.emailElement = el)} type="email" label="Email" className="form-control" placeholder="Email" />
            </div>
            <div className="form-group">
              <Input inputRef={(el) => (this.passwordElement = el)} type="password" label="Password" className="form-control" placeholder="Password" />
            </div>
            { this.props.errorMessage && <Alert message={this.props.errorMessage} /> }
            <Button success onClick={this.handleSubmit}><i className="fa fa-sign-in"/>{' '}Log In
            </Button>
          </form>
        </div>
        }
      </div>
    );
  }
}
