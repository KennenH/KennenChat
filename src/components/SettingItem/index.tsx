import { Checkbox, Slider } from 'antd';
import './index.scss';

export interface ISettingItemProps {
  title: string,
  settingType: SettingType,
  value: any,
  slideRange?: number[],
  description?: string,
  onValueChange?: (value: any) => void,
  isHide?: boolean,
  step?: number,
}

export enum SettingType {
  /**
   * 勾选框
   */
  CHECK = 0,
  /**
   * 滑块
   */
  SLIDE = 1,
}

const SettingItem: React.FC<ISettingItemProps> = (props: ISettingItemProps) => {

  const {
    title, 
    settingType,
    value,
    slideRange,
    description,
    onValueChange,
    step,
  } = props;

  const onChange = (v: any) => {
    onValueChange?.(v);
  }

  const settingAction = () => {
    if (settingType === SettingType.CHECK) {
      return (
        <Checkbox 
          indeterminate={value}
          checked={value}
          onChange={v => onChange(v.target.checked)}
        />
      );
    } else if (settingType === SettingType.SLIDE) {
      return (
        <div className='setting-item-slide-container'>
          {value}
          <Slider 
            className='setting-item-slide'
            min={slideRange![0]}
            max={slideRange![1]}
            value={value}
            onChange={onChange}
            step={step ?? 0.1}
          />
        </div>
      );
    }
  }

  return (
    <div className='setting-item-container'>
      <div className='setting-item-title-wrapper'>
        <div className='setting-item-title'>{title}</div>
        { description && <div className='setting-item-description'>{description}</div>}
      </div>
      {settingAction()}
    </div>
  );
};

export default SettingItem;