import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Alert, Input, Button, FormGroup, Editable, Breadcrumbs } from 'components';
import { Map } from 'immutable';
import { updateSession, pushToSession, updateDb, discardSheetUpdates } from 'redux/modules/firebase';
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import { FaPlus, FaMinus, FaSignOut, FaEraser, FaCheck, FaTrash} from 'react-icons/lib/fa';

@connect(
  state => ({
    sheets: state.firebase.getIn(['sheets', 'list']),
    templates: state.firebase.getIn(['templates', 'list']),
    editedSheets: state.firebase.getIn(['session', 'editedSheets']),
    session: state.firebase.get('session'),
  }),
  {
    pushState: push,
    updateSession,
    pushToSession,
    discardSheetUpdates,
  }
)
@autobind
export default class EditSheet extends Component {

  static propTypes = {
    editedSheets: PropTypes.object,
    session: PropTypes.object,
    pushState: PropTypes.func.isRequired,
    updateSession: PropTypes.func.isRequired,
    pushToSession: PropTypes.func.isRequired,
    discardSheetUpdates: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    templates: PropTypes.object,
  };

  static contextTypes = {
    store: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
  }

  redirect(to) {
    return ()=>{
      console.log('redirect', to );
      this.props.pushState(to);
    };
  }

  discard(event) {
    event.preventDefault();
    console.log('discard');
    this.props.discardSheetUpdates(this.props.params.key);
    this.props.pushState('/sheets');
  }

  save(event) {
    event.preventDefault();
    const key = this.props.params.key;
    const sheet = this.props.editedSheets.get(key).update('stress', (stress = Map())=>( stress.map( (stressLane)=>( stressLane || null ) ) ) );
    console.log('save', key, sheet );
    updateDb('/sheets/' + key, sheet.toJSON() );
    this.props.pushState('/sheet/' + key);
    this.props.discardSheetUpdates(this.props.params.key);
  }

  viewAsBlock(event) {
    event.preventDefault();
    console.log('viewAsBlock');
    const key = this.props.params.key;
    this.props.pushState('/sheet/' + key);
  }

  handleChange(value, {path}) {
    const sessionPath = 'editedSheets/' + this.props.params.key + '/' + path;
    this.props.updateSession(sessionPath, value);
  }

  addSkill(event) {
    event.preventDefault();
    const skillKey = this.newSkillSelect.value;
    console.log('addSkill');
    const sessionPath = 'editedSheets/' + this.props.params.key + '/skills/' + skillKey;
    this.props.updateSession(sessionPath, 1);
  }

  addItem({path, newItem = ''}, event) {
    event.preventDefault();
    const sessionPath = 'editedSheets/' + this.props.params.key + '/' + path;
    this.props.pushToSession(sessionPath, newItem);
  }

  removeItem({path}, event) {
    event.preventDefault();
    const sessionPath = 'editedSheets/' + this.props.params.key + '/' + path;
    this.props.updateSession(sessionPath, null);
  }

  addStressBox({stressLaneIndex, sheetStressLane }, event) {
    event.preventDefault();
    const newStressBoxIndex = sheetStressLane ? sheetStressLane.size : 0;
    console.log('addStressBox', stressLaneIndex, sheetStressLane);
    const sessionPath = 'editedSheets/' + this.props.params.key + '/stress/' + stressLaneIndex + '/' + newStressBoxIndex;
    this.props.updateSession(sessionPath, false);
  }

  removeStressBox({stressLaneIndex, sheetStressLane}, event) {
    event.preventDefault();
    console.log('removeStressBox', stressLaneIndex, sheetStressLane);
    if (sheetStressLane) {
      const removeStressBoxIndex = sheetStressLane.size - 1;
      const sessionPath = 'editedSheets/' + this.props.params.key + '/stress/' + stressLaneIndex + '/' + removeStressBoxIndex;
      this.props.updateSession(sessionPath, null);
    }
  }

  changeSkill(skillSlug, value, event) {
    const sessionPath = 'editedSheets/' + this.props.params.key + '/skills/' + skillSlug;
    this.props.updateSession(sessionPath, value);
    event.preventDefault();
  }

  render() {
    const {params, editedSheets, session, templates} = this.props;
    const styles = require('./EditSheet.scss');
    // const EditSheetInstance = this;
    const key = params.key;
    // console.log('templates', templates);

    console.log('EditSheet | session', session && session.toJS());
    console.log('EditSheet | editedSheets', editedSheets && editedSheets.toJS());
    console.log('EditSheet | editedSheet', editedSheets && editedSheets.get(key) && editedSheets.get(key).toJS());
    console.log('EditSheet | template', editedSheets && editedSheets.getIn([key, 'template']));

    if ( !editedSheets.getIn([key, 'template']) ) {
      console.log('EditSheet | NOT FOUND', key, editedSheets && editedSheets.toJS(), editedSheets && editedSheets.get(key), editedSheets && editedSheets.getIn([key, 'template']) );
      return <div className={styles.EditSheet + ' container'} ><Alert className={styles['EditSheet-notFoung']} warning >Sheet or template for { params.key } not found.</Alert></div>;
    }

    const template = templates.get( editedSheets.getIn([key, 'template']) || 'VS-P' );
    const sheet = Map({
      description: '',
      image: '',
      aspects: Map(),
      skills: Map(),
      extras: Map(),
      stunts: Map(),
      stress: template.get('stress').map( ()=>( Map() ) ).toOrderedMap(),
      consequences: Map(),
      template: template.get('key'),
    }).merge( editedSheets.get(key) );

    const descriptionBlock = (<div className={styles['EditSheet-descriptionBlock']} >
      <Input label={<span>Description (<a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet" target="_blank" >markdown</a>)</span>} type="textarea" value={sheet.get('description')} handleChange={this.handleChange} handleChangeParams={{path: 'description'}} />
    </div>);

    const imageBlock = (<div className={styles['EditSheet-imageBlock']} >
      {sheet.get('image') ? <div><img src={sheet.get('image')} className={styles['EditSheet-image']} /></div> : null}
      <p><strong>Image</strong></p>
      <Editable type="text" onSubmit={this.handleChange} onSubmitParams={{path: 'image'}} >{ sheet.get('image') || 'no image'}</Editable>
    </div>);

    const aspectsBlock = (<div className={styles['EditSheet-aspectsBlock']} >
      <h2>Aspects</h2>
      {sheet.get('aspects').toOrderedMap().map( (aspect, aspectKey)=>(
        aspect ? (<FormGroup key={'aspect-' + aspectKey} childTypes={[null, 'flexible', null]}>
          <Input type="select" options={ template.getIn(['aspects', 'types']).toJS() } value={aspect.get('type')} handleChange={this.handleChange} handleChangeParams={{path: 'aspects/' + aspectKey + '/type'}} />
          <Input value={aspect.get('title')} handleChange={this.handleChange} handleChangeParams={{path: 'aspects/' + aspectKey + '/title'}} />
          <Button danger onClick={this.removeItem} onClickParams={{path: 'aspects/' + aspectKey}} >delete</Button>
        </FormGroup>) : null
      ) )}
      <Button primary onClick={this.addItem} onClickParams={{
        path: 'aspects',
        newItem: {
          type: template.getIn(['aspects', 'types']).first().get('value'),
          title: '',
        }
      }}><FaPlus /></Button>
    </div>);

    const skillsBlock = (<div className={styles['EditSheet-skillsBlock']} >
      <h2>Skills</h2>
      { sheet.get('skills').sort().reverse().reduce( ( elements, level, skillSlug ) => (
        level > 0 ? elements.concat([<FormGroup className={styles['EditSheet-skill']} childTypes={['flexible', null]} >
          <strong>{template.getIn(['skills', skillSlug, 'name'])} {level}</strong>
          <div>
            <Button danger clipBottomLeft onClick={this.changeSkill.bind(this, skillSlug, level - 1)} ><FaMinus /></Button>
            <Button success onClick={this.changeSkill.bind(this, skillSlug, level + 1)} ><FaPlus /></Button>
          </div>
        </FormGroup>]) : elements
      ), [] ) }
      <FormGroup>
        <Input
          type="select"
          options={ template.get('skills')
            .filter( (skill)=>(
              !sheet.getIn(['skills', skill.get('key')])
            ) )
            .sort()
            .map( (skill) => ( { label: skill.get('name'), value: skill.get('key') } ) ) }
          inputRef={ (select)=>( this.newSkillSelect = select ) } />
        <Button primary onClick={this.addSkill} ><FaPlus /></Button>
      </FormGroup>
    </div>);

    const extrasBlock = (<div className={styles['EditSheet-extrasBlock']} >
      <h2>Extras</h2>
      {sheet.get('extras') && sheet.get('extras').size && sheet.get('extras').map( (extra, extraKey) =>{
        return (<FormGroup key={'extra-' + extraKey} childTypes={['flexible', null]}>
          <Input type="text" value={extra} handleChange={this.handleChange} handleChangeParams={{path: 'extras/' + extraKey}} />
          <Button danger onClick={this.removeItem} onClickParams={{path: 'extras/' + extraKey}} ><FaTrash /></Button>
        </FormGroup>);
      }) || null }
      <Button primary onClick={this.addItem} onClickParams={{ path: 'extras' }}><FaPlus /></Button>
    </div>);

    const stuntsBlock = (<div className={styles['EditSheet-stuntsBlock']} >
      <h2>Stunts</h2>
      {sheet.get('stunts') && sheet.get('stunts').size && sheet.get('stunts').map( (stunt, stuntKey) =>{
        return (<FormGroup key={'stunt-' + stuntKey} childTypes={['flexible', null]}>
          <Input type="text" value={stunt} handleChange={this.handleChange} handleChangeParams={{path: 'stunts/' + stuntKey}} />
          <Button danger onClick={this.removeItem} onClickParams={{path: 'stunts/' + stuntKey}} ><FaTrash /></Button>
        </FormGroup>);
      }) || null }
      <Button primary onClick={this.addItem} onClickParams={{ path: 'stunts/' }}><FaPlus /></Button>
    </div>);

    const stressBlock = (<div className={styles['EditSheet-stressBlock']} >
      <h2>Stress</h2>
      { template.get('stress').map( (stressLane, stressLaneIndex)=>(
        <FormGroup className={styles['EditSheet-stressLane']} key={stressLaneIndex} childTypes={['full', 'flexible', null]}>
          <strong>{stressLane.get('label')}: </strong>
          <div className={styles['EditSheet-stressBlock-boxes']}>
            { (sheet.getIn(['stress', stressLaneIndex.toString()]) || []).map( (isUsed, boxIndex)=>(
              <Input type="checkbox" className={styles['EditSheet-stressBox']} value={isUsed} inline superscriptAfter={boxIndex + 1} handleChange={this.handleChange} handleChangeParams={{path: 'stress/' + stressLaneIndex + '/' + boxIndex}} />
            ) ) }
          </div>
          <div>
            <Button danger clipBottomLeft onClick={this.removeStressBox} onClickParams={{stressLaneIndex, sheetStressLane: sheet.getIn(['stress', stressLaneIndex.toString()]) }}><FaMinus /></Button>
            <Button success onClick={this.addStressBox} onClickParams={{stressLaneIndex, sheetStressLane: sheet.getIn(['stress', stressLaneIndex.toString()]) }}><FaPlus /></Button>
          </div>
        </FormGroup>
      ) ) }
    </div>);

    const consequencesBlock = (<div className={styles['EditSheet-consequencesBlock']} >
      <h2>Consequences</h2>
      {sheet.get('consequences') ? sheet.get('consequences').toMap().mapEntries( (consequenceEntry, consequenceIndex)=>{
        const consequenceKey = consequenceEntry[0];
        const consequence = consequenceEntry[1];
        return [consequenceIndex, (<FormGroup key={'consequence-' + consequenceKey} childTypes={['flexible', null]}>
          <Input
            label={template.getIn(['consequences', consequenceIndex, 'label']) || template.get('consequences').last().get('label') }
            value={consequence}
            handleChange={this.handleChange}
            handleChangeParams={{path: 'consequences/' + consequenceKey}}
            superscriptAfter={template.getIn(['consequences', consequenceIndex, 'value']) || template.get('consequences').last().get('value')}
          />
          <Button danger onClick={this.removeItem} onClickParams={{path: 'consequences/' + consequenceKey}} ><FaTrash /></Button>
        </FormGroup>)];
      } ) : null}
      <Button primary onClick={this.addItem} onClickParams={{ path: 'consequences' }}><FaPlus /></Button>
    </div>);

    return (
      <div className={styles.EditSheet} >
        <Breadcrumbs links={[
          {url: '/', label: '⌂'},
          {url: '/sheets', label: 'sheets'},
          {label: sheet.get('name') || sheet.get('key') }
        ]} />
        <Helmet title={sheet.get('name') || sheet.get('key')} />
        <form className={classnames(styles['EditSheet-form'], 'container')}>
          <h2 className={styles['EditSheet-heading']}>
            <div><Input label="Name" value={sheet.get('name')} handleChange={this.handleChange} handleChangeParams={{path: 'name'}} /></div>
            <div><Input value={sheet.get('refresh')} label="Refresh" handleChange={this.handleChange} handleChangeParams={{path: 'refresh'}} /></div>
          </h2>
          {imageBlock}
          {descriptionBlock}
          {aspectsBlock}
          {skillsBlock}
          {extrasBlock}
          {stuntsBlock}
          {stressBlock}
          {consequencesBlock}
          <hr />
          <div className={styles['EditSheet-actions']} >
            <Button danger onClick={this.discard} confirmMessage="Really discard all updates?" ><FaEraser /> Discard updates</Button>
            <Button primary onClick={this.viewAsBlock} ><FaSignOut />Leave unsaved and view as Block</Button>
            <Button success onClick={this.save} ><FaCheck /> Save</Button>
          </div>
        </form>
      </div>
    );
  }
}
