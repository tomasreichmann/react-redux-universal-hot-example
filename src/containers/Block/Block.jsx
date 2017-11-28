import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { push } from 'react-router-redux';
import { updateDb, pushToDb, myFirebaseConnect } from 'redux/modules/firebase';
import { connect } from 'react-redux';
import { Loading, Button, SheetBlock, Alert, Breadcrumbs } from 'components';
import { List, fromJS } from 'immutable';
import { Link } from 'react-router';
import { FaTrash, FaClone, FaEdit} from 'react-icons/lib/fa';
import autobind from 'autobind-decorator';

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
    firebaseConnectDone: PropTypes.bool,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
  }

  @autobind
  redirect(to) {
    return ()=>{
      this.props.pushState(to);
    };
  }

  @autobind
  deleteSheet(key) {
    updateDb('/sheets/' + key, null);
    this.props.pushState('/sheets');
  }

  @autobind
  duplicateSheet(sheet) {
    const nameSequenceRegex = /\s(\d+)$/;
    pushToDb('/sheets', (key) => {
      this.props.pushState('/sheet/' + key);
      return sheet
        .set('key', key)
        .update('name', (name) => {
          const hasSequence = nameSequenceRegex.test(name);
          return hasSequence ? name.replace( /\s(\d+)$/, (match, part1) => (
            ' ' + (parseInt(part1, 10) + 1)
          )) : name + ' 2';
        })
        .toJSON();
    } );
  }

  render() {
    const {sheets, templates, params, user, firebaseConnectDone } = this.props;
    const keys = params.keys.split(';');
    const styles = require('./Block.scss');
    const selectedSheets = sheets ? sheets.filter( (sheet)=>( keys.indexOf( sheet.get('key') ) > -1 ) ) : List();
    const selectedSheetNames = selectedSheets.map( (sheet) => ( sheet.get('name') || sheet.get('key') ) ).join(', ');

    return (
      <div className={styles.Blocks}>
        <Helmet title={selectedSheetNames}/>
        <Breadcrumbs links={[
          {url: '/', label: '⌂'},
          {url: '/sheets', label: 'Sheets'},
          {label: selectedSheets.map( (sheet)=>( sheet.get('name') || sheet.get('key') )).join(', ') }
        ]} />
        <div className={styles.Blocks_list}>
          <Loading show={!firebaseConnectDone} message="Loading" />
          { user ? null : <Alert className={styles.Blocks_notLoggedIn} warning >To use all features, you must <Link to={ '/login/' + encodeURIComponent('sheet/' + params.keys) } ><Button link >log in</Button></Link>.</Alert> }
          { firebaseConnectDone ? selectedSheets.map( (sheet)=>( <div className={styles.Blocks_item} key={sheet.get('key')} >
            <SheetBlock sheet={sheet} template={templates.get( sheet.get('template') )} updateDb={updateDb} >
              <div className={styles.Blocks_actions} >
                <Button primary disabled={!user} onClick={this.duplicateSheet} onClickParams={sheet} clipBottomLeft ><FaClone /></Button>
                <Link to={'/sheet/' + encodeURIComponent(sheet.get('key')) + '/edit'} ><Button warning noClip ><FaEdit /></Button></Link>
                <Button danger disabled={!user} onClick={ this.deleteSheet.bind(this, sheet.get('key')) } confirmMessage="Really delete forever?" ><FaTrash /></Button>
              </div>
            </SheetBlock>
          </div> ) ) : null }
          { (firebaseConnectDone && selectedSheets.size === 0) ? <Alert warning >No sheet found</Alert> : null }
        </div>
      </div>
    );
  }
}
