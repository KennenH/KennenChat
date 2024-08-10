import './index.scss';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import ChatCard, { IChatCardProps, Sender } from '@/components/ChatCard';

const handleClickBody = (nav: NavigateFunction) => {
  // navigate to home
  nav('/');
}

interface ISideBarBodyProps {
  chatList: IChatCardProps[],
  selectedIdx: number,
  handleClickDelete: Function,
  handleClickCard: Function,
}

const SideBarBody: React.FC<ISideBarBodyProps> = (
  props: ISideBarBodyProps
) => {

  const nav = useNavigate();

  const { 
    chatList,
    selectedIdx,
    handleClickDelete,
    handleClickCard,
  } = props;

  const list = chatList.map((card, idx) => {
    return (
      <ChatCard
        key={card.conversasionList[0].fingerprint}
        title={card.title}
        isSelected={selectedIdx === idx}
        conversasionList={card.conversasionList}
        handleClickDelete={() => handleClickDelete(idx)}
        handleClickCard={() => handleClickCard(idx)}
      />
    );
  });
  
  return (
    <>
      <div 
        className='side-bar-body-container'
        onClick={() => handleClickBody(nav)}>
        {list}
      </div>
    </>
  );
};

export default SideBarBody;