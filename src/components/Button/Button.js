import React, { Component, PropTypes } from 'react';
import { Map } from 'immutable';
import { killEvent } from 'relpers';

export default class Button extends Component {
  static propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    onClickParams: PropTypes.any,
    primary: PropTypes.bool,
    secondary: PropTypes.bool,
    success: PropTypes.bool,
    warning: PropTypes.bool,
    danger: PropTypes.bool,
    link: PropTypes.bool,
    block: PropTypes.bool,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    confirmMessage: PropTypes.any,
    confirmPositionTop: PropTypes.bool,
    confirmPositionRight: PropTypes.bool,
    confirmPositionBottom: PropTypes.bool,
    confirmPositionLeft: PropTypes.bool,
    confirmAutocloseDelay: PropTypes.number,
    clipBottomLeft: PropTypes.bool,
    noClip: PropTypes.bool,
    appIcon: PropTypes.bool,
    children: PropTypes.any,
  };

  static defaultProps = {
    confirmAutocloseDelay: 4000,
  };

  constructor(props) {
    super(props);
    this.state = {
      confirmIsShown: false,
      timeout: -1,
    };
    this.onClickHandler = this.onClickHandler.bind(this);
    this.onClickConfirm = this.onClickConfirm.bind(this);
    this.hideConfirm = this.hideConfirm.bind(this);
  }

  onClickHandler(event) {
    clearTimeout(this.state.timeout);
    const args = this.props.onClickParams ? [this.props.onClickParams, event] : [event];
    if (this.props.onClick) {
      event.preventDefault();
    }
    this.props.onClick(...args);
    this.setState({
      confirmIsShown: false,
    });
  }

  @killEvent
  onClickConfirm() {
    clearTimeout(this.state.timeout);
    this.setState({
      confirmIsShown: true,
      timeout: setTimeout(this.hideConfirm, this.props.confirmAutocloseDelay),
    });
  }

  hideConfirm() {
    this.setState({
      confirmIsShown: false,
    });
  }

  render() {
    const styles = require('./Button.scss');
    const {
      className = '',
      children,
      primary,
      secondary,
      success,
      warning,
      danger,
      link,
      block,
      active,
      disabled,
      appIcon,
      onClick,
      onClickParams,
      confirmMessage,
      confirmPositionTop,
      confirmPositionRight,
      confirmPositionBottom,
      confirmPositionLeft,
      clipBottomLeft,
      noClip,
      ...props
    } = this.props;

    const classNames = Map({
      primary,
      secondary,
      success,
      warning,
      danger,
      link,
      block,
      active,
      disabled,
      appIcon,
      confirm: confirmMessage,
      confirmPositionTop,
      confirmPositionRight,
      confirmPositionBottom,
      confirmPositionLeft,
      clipBottomLeft,
      noClip: noClip || this.state.confirmIsShown,
    }).reduce( (output, value, key)=>(
      value ? output.concat([ styles['Button--' + key] ]) : output
    ), className.split(' ') );

    const processedClassName = [styles.Button].concat(classNames).join(' ');

    const onClickProp = {};
    if ( onClick ) {
      if ( confirmMessage && !this.state.confirmIsShown ) {
        onClickProp.onClick = this.onClickConfirm;
      } else {
        onClickProp.onClick = this.onClickHandler;
      }
    }

    return (<button className={processedClassName} {...onClickProp} {...props} >
      {(confirmMessage && this.state.confirmIsShown) ? <div className={styles['Button-confirmMessage']} >{confirmMessage}</div> : null}
      {children}
    </button>);
  }
}
