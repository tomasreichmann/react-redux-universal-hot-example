import React, { Component, PropTypes } from 'react';
import { Input } from 'components';
import { intersperse } from '../../utils/utils';

export default class SheetBlock extends Component {

  static propTypes = {
    sheet: PropTypes.object,
    children: PropTypes.any,
  };

  render() {
    const { sheet, children } = this.props;
    const { name, key, refresh, aspects, skills, consequences, stress, stunts, extras } = sheet.toObject();
    console.log('sheet', sheet);
    console.log('name', name, 'key', key, 'refresh', refresh, 'aspects', aspects, 'skills', skills, 'consequences', consequences, 'stress', stress, 'stunts', stunts, 'extras', extras);
    const styles = require('./SheetBlock.scss');

    const headingRefresh = <span className={styles['SheetBlock-heading-refresh']}>{refresh}</span>;

    // aspects ---
    const {
      main: mainAspect,
      trouble: troubleAspect,
      ...otherAspects
    } = aspects ? aspects.toObject() : {};
    console.log('---');
    console.log('aspects.toObject()', aspects.toObject() );
    console.log('[ mainAspect, troubleAspect, ...otherAspects ]', [ mainAspect, troubleAspect, ...otherAspects ], [ mainAspect, troubleAspect, ...otherAspects ].length );
    const aspectClassNameMap = { 0: 'Aspect-main', 1: 'Aspect-trouble' };
    const aspectElements = intersperse(
      [ mainAspect, troubleAspect, ...otherAspects ]
        .reduce( (output, aspect, index)=>{
          const classNames = [
            styles.Aspect,
            styles[aspectClassNameMap[index] || 'Aspect-other']
          ].join(' ');
          return aspect ? output.concat([<span className={classNames} key={'aspect-' + index} >{aspect}</span>]) : output;
        }, [] ),
      ', ')
    ;
    const aspectBlock = aspectElements.length ? <p className={styles['SheetBlock-aspects']}>{aspectElements}</p> : null;


    // skills ---
    const skillsElements = intersperse(skills.sort().reverse().reduce( ( elements, level, skill ) => (
      level > 0 ? elements.concat([<span className={styles['SheetBlock-skill']} >{skill} {level}</span>]) : elements
    ), [] ), ', ');
    const skillBlock = skillsElements ? <p className={styles['SheetBlock-skills']}>{skillsElements}</p> : null;

    // stunts ---
    const stuntsBlock = stunts && stunts.size ? (<div><h3>Stunts</h3>{stunts.map( (stunt, index)=>(
        <p key={index} className={styles['SheetBlock-stunt']}>{stunt}</p>
      ) )}</div>) : null;

    // extras ---
    const extrasBlock = extras && extras.size ? (<div><h3>Extras</h3>{extras.map( (extra, index)=>(
        <p key={index} className={styles['SheetBlock-extra']}>{extra}</p>
      ) )}</div>) : null;

    // stress ---
    const stressBlock = stress ? <div>
      <h3>Stress</h3>
      { stress.map( (stressLane, stressLaneKey)=>(
        <div className={styles.StressLane} key={stressLaneKey} >
          <strong>{stressLaneKey}: </strong>
          { stressLane.map( (isUsed, value)=>(
            <Input type="checkbox" value={isUsed} inline superscriptAfter={value + 1} />
          ) ) }
        </div>
      ) ) }
    </div> : null;

    // consequences ---
    const consequenceElements = (consequences && consequences.size) ? intersperse([ 'minor', 'moderate', 'severe' ].reduce( (elements, level ) => (
      consequences.get(level) ? elements.concat([<span className={styles['SheetBlock-consequence']} >{ consequences.get(level) + ' (' + level + ')' }</span>]) : elements
    ), [] ), ', ') : null;

    const consequencesBlock = consequenceElements && consequenceElements.length ? (<div className={styles['SheetBlock-consequences']} ><strong>Consequences: </strong>{consequenceElements}</div>) : null;

    return (
      <div className={styles.SheetBlock} key={key} >
        <h2 className={styles['SheetBlock-name']} ><span>{name}</span>{headingRefresh}</h2>
        {aspectBlock}
        {skillBlock}
        {stuntsBlock}
        {extrasBlock}

        {stressBlock}
        {consequencesBlock}

        {children}
      </div>
    );
  }
}
