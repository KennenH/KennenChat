import { Button } from 'antd';
import './index.scss';
import { GithubOutlined, PlusCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { MouseEventHandler } from 'react';
import { eventTracking } from '@/utils/request';

interface ISideBarFooterProps {
  handleClickSetting?: MouseEventHandler,
  handleClickNewChat? : MouseEventHandler,
}

const handleClickGithub = () => {
  // navigate to outer link github
  eventTracking();
  window.location.href = 'https://github.com/KennenH/fe.KennenChat';
}

const SideBarFooter: React.FC<ISideBarFooterProps> = ({
  handleClickSetting,
  handleClickNewChat
}: ISideBarFooterProps) => {

  return (
    <>
      <div className='side-bar-footer-container'>
        <div className='side-bar-footer-left'>
          <Button 
            className='side-bar-footer-actions'
            icon={<SettingOutlined />}
            onClick={handleClickSetting}
          />
          <Button 
            className='side-bar-footer-actions' 
            icon={<GithubOutlined />}
            onClick={handleClickGithub}
          />
        </div>
        <Button 
          className='side-bar-footer-actions'
          icon={<PlusCircleOutlined />}
          onClick={handleClickNewChat}
          >
          新的聊天
        </Button>
      </div>
    </>
  );
};

export default SideBarFooter;