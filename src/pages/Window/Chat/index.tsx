import { useOutletContext } from 'react-router-dom';
import './index.scss';
import WindowHeader, { WindowHeaderActionConfig, WindowHeaderTitleConfig } from '@/components/WindowHeader';
import { IChatCardProps } from '@/components/ChatCard';
import Message from '@/components/Message';
import { isTimeDifferenceMoreThanFiveMinutes } from '@/utils/utils';
import InputPanel from '@/components/InputPanel';

export interface IChatProps {
  chatCardProps: IChatCardProps,
  isFullScreen: boolean,
  handleToggleFullScreen: Function,
  handleClickEdit: Function,
  handleClickSendMessage: Function,
}

/**
 * chat 二级路由，参数无法从函数中直接获取
 * 需要使用 {@link useOutletContext} 获取
 */
const Chat: React.FC = () => {

  const { 
    chatCardProps,
    isFullScreen,
    handleToggleFullScreen,
    handleClickEdit,
    handleClickSendMessage,
  } = useOutletContext() as IChatProps;

  const titleConfig: WindowHeaderTitleConfig = { 
    primaryTitle: chatCardProps.title,
    secondaryTitle: `共 ${chatCardProps.messageList.length - 1} 条对话`,
    isPrimaryTitleClickable: true,
    handleClickPrimaryTitle: handleClickEdit,
  };

  const actionConfigs: WindowHeaderActionConfig[] = [
    {
      iconName: 'edit',
      handleClickAction: () => handleClickEdit(),
    },
    {
      iconName: isFullScreen ? 'fullscreen-exit' : 'fullscreen',
      handleClickAction: () => handleToggleFullScreen(),
    },
  ];

  const messageList = 
    chatCardProps
      .messageList
      .map(msg => {
    return (
      <Message
        key={msg.fingerprint}
        message={msg}
      />
    );
  });

  return (
    <>
      <WindowHeader
        titleConfig={titleConfig}
        actionConfigs={actionConfigs}
      />
      <div className='chat-body'>
        {messageList}
      </div>
      <InputPanel
        handleClickSendMessage={handleClickSendMessage}
      />
    </>
  );
};

export default Chat;