import React, { Component, PropTypes } from 'react';
import { push } from 'react-router-redux';
import { updateSheet, myFirebaseConnect } from 'redux/modules/firebase';
import { connect } from 'react-redux';
import { Button, SheetBlock, Alert } from 'components';
import { List, fromJS } from 'immutable';
import { Link } from 'react-router';

@connect(
  state => ({
    user: state.firebase.get('user'),
    templates: state.firebase.getIn(['templates', 'list']),
  }),
  {
    pushState: push
  }
)
@myFirebaseConnect([
  {
    path: '/sheets',
    adapter: (snapshot)=>(
      { sheets: fromJS(snapshot.val()) }
    ),
  }
])
export default class Block extends Component {

  static propTypes = {
    sheets: PropTypes.object,
    user: PropTypes.object,
    templates: PropTypes.object,
    pushState: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.redirect = this.redirect.bind(this);
    this.deleteSheet = this.deleteSheet.bind(this);
  }

  redirect(to) {
    return ()=>{
      console.log('redirect', to );
      this.props.pushState(to);
    };
  }

  deleteSheet(key) {
    console.log('deleteSheet');
    updateSheet(key, null);
    this.props.pushState('/sheets');
  }

  render() {
    const {sheets, templates, params, user} = this.props;
    console.log('this.props', this.props);
    const keys = params.keys.split(';');
    const styles = require('./Block.scss');
    const selectedSheets = sheets ? sheets.filter( (sheet)=>( keys.indexOf( sheet.get('key') ) > -1 ) ) : List();

    return (
      <div className={styles.Blocks + ' container'} >
        { user ? null : <Alert className={styles['Blocks-notLoggedIn']} warning >To use all features, you must <Link to={ '/login/' + encodeURIComponent(params.keys) } ><Button primary >log in.</Button></Link></Alert> }
        { selectedSheets.map( (sheet)=>( <div className={styles['Blocks-item']} key={sheet.get('key')} >
          <SheetBlock sheet={sheet} template={templates.get( sheet.get('template') || 'VS-P' )} updateSheet={updateSheet} >
            <div className={styles['Blocks-actions']} >
              <Button warning onClick={this.redirect( '/sheet/' + encodeURIComponent(sheet.get('key')) + '/edit' )} >Edit</Button>
              <Button danger disabled={!user} onClick={ this.deleteSheet.bind(this, sheet.get('key')) } confirmMessage="Really delete forever?" >Delete</Button>
            </div>
          </SheetBlock>
        </div> ) ) }
        { selectedSheets.size === 0 ? <Alert warning >No sheet found</Alert> : null }
      </div>
    );
  }
}
