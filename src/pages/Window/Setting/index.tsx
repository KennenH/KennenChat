import { NavigateFunction, useNavigate, useOutletContext } from 'react-router-dom';
import './index.scss';
import WindowHeader, { WindowHeaderActionConfig, WindowHeaderTitleConfig } from '@/components/WindowHeader';

export interface ISettingProps {

}


const handleClickClose = (nav: NavigateFunction) => {
  // navigate to home
  nav('/');
}

const Setting: React.FC<ISettingProps> = () => {

  const nav = useNavigate();

  const {
    
  } = useOutletContext() as ISettingProps;

  const titleConfig: WindowHeaderTitleConfig = { 
    primaryTitle: '设置',
    secondaryTitle: '所有设置选项',
    isPrimaryTitleClickable: false,
    handleClickPrimaryTitle: handleClickClose,
  };

  const actionConfigs: WindowHeaderActionConfig[] = [
    {
      iconName: 'close_lined',
      handleClickAction: () => handleClickClose(nav),
    },
  ];

  return (
    <>
      <WindowHeader
        titleConfig={titleConfig}
        actionConfigs={actionConfigs}
      />
      <div>setting</div>
    </>
  );
};

export default Setting;