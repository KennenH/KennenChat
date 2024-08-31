import { NavigateFunction, useNavigate, useOutletContext } from 'react-router-dom';
import './index.scss';
import WindowHeader, { WindowHeaderActionConfig, WindowHeaderTitleConfig } from '@/components/WindowHeader';
import SettingList, { ISettingListProps } from '@/components/SettingList';
import { SettingType } from '@/components/SettingItem';
import globalStore from '@/store/globalStore';
import { inject, observer } from 'mobx-react';

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

  const SettingListConfigs: ISettingListProps[] = [
    {
      key: 'modelParams',
      itemsConfig: [
        {
          title: '随机性 (temperature)',
          description: '值越大，回复越随机',
          settingType: SettingType.SLIDE,
          value: globalStore.temperature,
          slideRange: [0.1, 1.0],
          onValueChange: v => {
            globalStore.setTemperature(v);
          }
        },
        {
          title: '核采样 (top_p)',
          description: '控制文本多样性，建议不要和随机性同时更改',
          settingType: SettingType.SLIDE,
          value: globalStore.top_p,
          slideRange: [0.0, 1.0],
          onValueChange: v => {
            globalStore.setTopP(v);
          }
        },
        {
          title: '惩罚因子 (penalty_score)',
          description: '值越大，生成的字词重复越少',
          settingType: SettingType.SLIDE,
          value: globalStore.penalty_score,
          slideRange: [1.0, 2.0],
          onValueChange: v => {
            globalStore.setPenaltyScore(v);
          }
        }
      ]
    },
    {
      key: 'chatList',
      itemsConfig: [
        {
          title: '虚拟列表',
          description: '聊天消息多时极大提升网页性能',
          settingType: SettingType.CHECK,
          value: globalStore.isUseVirtualList,
          onValueChange: v => {
            globalStore.switchVirtualList(v);
          }
        },
        {
          title: '前置预加载',
          description: '使用虚拟列表时预加载的前置消息数量',
          settingType: SettingType.SLIDE,
          value: globalStore.virtualListPreLoad,
          slideRange: [1, 10],
          onValueChange: v => {
            globalStore.setPreLoadNum(v);
          },
          isHide: !globalStore.isUseVirtualList,
          step: 1,
        },
        {
          title: '后置预加载',
          description: '使用虚拟列表时预加载的后置消息数量',
          settingType: SettingType.SLIDE,
          value: globalStore.virtualListPostLoad,
          slideRange: [1, 10],
          onValueChange: v => {
            globalStore.setPostLoadNum(v);
          },
          isHide: !globalStore.isUseVirtualList,
          step: 1,
        }
      ]
    }
  ];

  const initSettingListConfigs = () => {
    return SettingListConfigs.map(config => {
      return (
        <SettingList
          key={config.key}
          itemsConfig={config.itemsConfig}
        />
      );
    });
  }

  return (
    <>
      <WindowHeader
        titleConfig={titleConfig}
        actionConfigs={actionConfigs}
      />
      <div className='setting-container'>
        {initSettingListConfigs()}
      </div>
    </>
  );
};

export default inject("globalStore")(observer(Setting));