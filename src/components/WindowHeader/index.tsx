import classNames from 'classnames';
import './index.scss';
import { MouseEventHandler, useEffect, useState } from 'react';

export interface WindowHeaderTitleConfig {
  primaryTitle: string,
  secondaryTitle: string
  isPrimaryTitleClickable: boolean,
  handleClickPrimaryTitle?: Function,
}

export interface WindowHeaderActionConfig {
  iconName: string,
  handleClickAction: MouseEventHandler,
}

interface IWindowHeaderProps {
  titleConfig: WindowHeaderTitleConfig,
  actionConfigs: WindowHeaderActionConfig[],
}

const WindowHeader: React.FC<IWindowHeaderProps> = (props: IWindowHeaderProps) => {

  const { titleConfig, actionConfigs } = props;
  const [icons, setIcons] = useState([]);

  useEffect(() => {
    const iconList: any = [];
    actionConfigs.forEach(config => {
      import(`@/assets/${config.iconName}.svg`)
        .then(icon => {
          iconList.push(icon.default);
      });
    });
    setIcons(iconList);
  }, [actionConfigs]);
  
  const actions = icons.map((icon, index) => {
    return (
      <img
        key={index}
        src={icon}
        className='window-header-actions-button'
        onClick={actionConfigs[index].handleClickAction}
      />
    );
  });

  return (
    <div className='window-header'>
      <div className='window-header-title'>
        <div 
          className={
            classNames(
              'window-header-title-primary',
              {'clickable': titleConfig.isPrimaryTitleClickable},
            )
          }
          onClick={
            () => (
              titleConfig.isPrimaryTitleClickable
              && titleConfig.handleClickPrimaryTitle
              && titleConfig.handleClickPrimaryTitle()
            )
          }
        >
          {titleConfig.primaryTitle}
        </div>
        <div className='window-header-title-secondary'>
          {titleConfig.secondaryTitle}
        </div>
      </div>
      <div className='window-header-actions-container'>
        {actions}
      </div>
    </div>
  );
};

export default WindowHeader;