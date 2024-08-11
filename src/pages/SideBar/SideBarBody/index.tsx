import { MouseEventHandler } from 'react';
import './index.scss';
import ChatCard, { IChatCardProps, Sender } from '@/components/ChatCard';
interface ISideBarBodyProps {
  chatList: IChatCardProps[],
  selectedIdx: number,
  handleClickDelete: Function,
  handleClickCard: Function,
  handleClickBody: Function,
}

const SideBarBody: React.FC<ISideBarBodyProps> = (
  props: ISideBarBodyProps
) => {

  const { 
    chatList,
    selectedIdx,
    handleClickDelete,
    handleClickCard,
    handleClickBody,
  } = props;

  const list = chatList.map((card, idx) => {
    return (
      <ChatCard
        key={card.messageList[0].fingerprint}
        title={card.title}
        isSelected={selectedIdx === idx}
        messageList={card.messageList}
        handleClickDelete={() => handleClickDelete(idx)}
        handleClickCard={() => handleClickCard(idx)}
      />
    );
  });
  
  return (
    <>
      <div 
        className='side-bar-body-container'
        onClick={handleClickBody as MouseEventHandler}>
        {list}
      </div>
    </>
  );
};

export default SideBarBody;