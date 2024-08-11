import { useOutletContext } from 'react-router-dom';
import './index.scss';
import WindowHeader, { WindowHeaderActionConfig, WindowHeaderTitleConfig } from '@/components/WindowHeader';
import { IChatCardProps } from '@/components/ChatCard';

const handleClickEdit = () => {

}

const Chat: React.FC = () => {

  const chat = useOutletContext() as IChatCardProps;

  const titleConfig: WindowHeaderTitleConfig = { 
    primaryTitle: chat.title,
    secondaryTitle: `共 ${chat.conversasionList.length - 1} 条对话`,
    isPrimaryTitleClickable: true,
    handleClickPrimaryTitle: handleClickEdit,
  };

  const actionConfigs: WindowHeaderActionConfig[] = [
    {
      iconName: 'edit',
      handleClickAction: handleClickEdit,
    },
  ];

  return (
    <>
      <WindowHeader
        titleConfig={titleConfig}
        actionConfigs={actionConfigs}
      />
      <div>chat</div>
    </>
  );
};

export default Chat;