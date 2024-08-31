import SettingItem, { ISettingItemProps } from '../SettingItem';
import './index.scss';

export interface ISettingListProps {
  key: string,
  itemsConfig: ISettingItemProps[],
}

const SettingList: React.FC<ISettingListProps> = (props: ISettingListProps) => {

  const {
    itemsConfig
  } = props;

  const settingItems = () => {
    return itemsConfig
      .filter(item => {
        return !item.isHide;
      })
      .map(item => {
        return (
          <SettingItem
            key={item.title}
            title={item.title}
            settingType={item.settingType}
            value={item.value}
            slideRange={item.slideRange}
            description={item.description}
            onValueChange={item.onValueChange}
            step={item.step}
          />
        );
    });
  }

  return (
    <div className='setting-list-container'>
      {settingItems()}
    </div>
  );
};

export default SettingList;