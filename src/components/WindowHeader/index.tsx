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

  // 动态加载 svg
  useEffect(() => {
    (async () => {
      const promises = actionConfigs.map(async config => {
          // await 返回的是一个 promise 对象
          const icon = await import(`@/assets/${config.iconName}.svg`);
          // promise 对象调用返回的也是 promoise 对象
          return icon.default;
        }
      );
    
      // 只有 async 方法中才能调用 await
      // 所以要在外面包一层 async 的立即执行函数
      const iconList = await Promise.all(promises) as any;
      setIcons(iconList);
    })();
  }, [actionConfigs]);
  
  const actions = icons.map((icon, index) => {
    return (
      <img
        // 一个页面的 actions 是固定的，用下标作 key 是安全的
        key={index}
        src={icon}
        className='window-header-actions-button'
        onClick={actionConfigs[index].handleClickAction}
        alt=''
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