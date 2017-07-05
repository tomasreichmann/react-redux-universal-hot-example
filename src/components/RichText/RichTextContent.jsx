import React, { Component, PropTypes } from 'react';
import { RichText } from 'components';
import { injectProps } from 'relpers';
import autobind from 'autobind-decorator';

export default class RichTextContent extends Component {
  static propTypes = {
    preview: PropTypes.bool,
    htmlContent: PropTypes.string,
    handleChange: PropTypes.func,
    handleChangeParams: PropTypes.any,
    onChange: PropTypes.func,
  }

  constructor(props) {
    super(props);
    if (!props.preview) {
      this.RichTextEditor = require('react-rte');
      this.state = {
        value: this.props.htmlContent ? this.RichTextEditor.createValueFromString(this.props.htmlContent, 'html') : this.RichTextEditor.createEmptyValue()
      };
    }
  }

  @autobind
  onChange(value) {
    console.log('onChange', value);
    this.setState({value});
    if (this.props.handleChange) {
      this.defferChange( this.props.handleChange, [value.toString('html'), {...this.props.handleChangeParams, path: 'componentProps/htmlContent'}] );
    }
  }

  @autobind
  defferChange(callback, callbackParams) {
    console.log('defferChange', callbackParams);
    clearTimeout(this.onChangeTimeout);
    this.onChangeTimeout = setTimeout( ()=>(
      callback(...callbackParams)
    ), 2000);
  }

  @injectProps
  render({
    preview = false,
    ...props,
  } = {}) {
    const styles = require('./RichTextContent.scss');
    const RTE = preview ? null : this.RichTextEditor.default;
    return preview ? <RichText {...props} /> : (<div className={styles.RichTextContent} {...props} >
      <RTE
        value={this.state.value}
        onChange={this.onChange}
      />
    </div>);
  }
}
