import { request } from "@/utils";
import React, { useEffect, useState } from "react";
import './index.scss';
import { NavigateFunction, Outlet, useNavigate } from "react-router-dom";
import SideBarHeader from "../SideBar/SideBarHeader";
import SideBarBody from "../SideBar/SideBarBody";
import SideBarFooter from "../SideBar/SideBarFooter";
import { IChatCardProps, Sender } from "@/components/ChatCard";
import { uniqueId } from "lodash";

/**
 * 初始化时和清空时自动生成一条新的聊天
 * 使得 chatList 永远不为空数组
 * 
 * 此处必须为一个方法，否则后续调用将不再生成新的对象
 */
const createChatCard = (): IChatCardProps => {
  return (
    {
      title: '新的聊天',
      conversasionList: [{
        content: "有什么可以帮你的吗",
        time: new Date(),
        sender: Sender.NOT_ME,
        fingerprint: uniqueId(),
      }],
    }
  );
}

const handleClickSetting = (nav: NavigateFunction) => {
  // navigate to setting page
  nav('/setting');
}

/**
 * 初始化 chat card list
 * 从本地缓存获取，无缓存则新建一个
 */ 
const initialChatList = [createChatCard()];

const HomeContainer: React.FC = () => {

  const nav = useNavigate();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [chatList, setChatList] = useState(initialChatList);

  /**
   * 删除一个 chat card
   * @param index 要删除的 item index
   */
  const handleClickDelete = (index: number) => {
    let newChatList: IChatCardProps[];
    if (chatList.length <= 1) {
      newChatList = [createChatCard()];
    } else {
      // 不能用 splice，这个方法会直接修改原数组 
      newChatList = [
        ...chatList.slice(0, index), 
        ...chatList.slice(index + 1)
      ];
    }
    // 当前选中的被删了，选中第一个
    if (index === selectedIdx) {
      setSelectedIdx(0);
    } else if (index < selectedIdx) {
      // 删除的 idx 在选中项之前，选中的 idx 要前移
      setSelectedIdx(selectedIdx - 1);
    }
    setChatList(newChatList);
  }

  /**
   * 切换选中 card
   */
  const handleClickCard = (index: number) => {
    setSelectedIdx(index);
  }

  /**
   * 新增一个 chat card
   * 新增的 item 加在数组 index 0 位置
   */
  const handleClickNewChat = () => {
    // 不能用 push 或 unshift，这两个方法会直接修改原数组
    const newChatList = [createChatCard(), ...chatList];
    setChatList(newChatList);
  }

  return (
    <div className="home">
      <div className="home-side-bar-container">
        <SideBarHeader />
        <SideBarBody 
          chatList={chatList}
          selectedIdx={selectedIdx}
          handleClickDelete={handleClickDelete}
          handleClickCard={handleClickCard}
        />
        <SideBarFooter
          handleClickSetting={() => handleClickSetting(nav)} 
          handleClickNewChat={handleClickNewChat}
        />
      </div>
      <div className="home-chat-container">
        {/* 渲染二级路由的地方 */}
        <Outlet
          // 将当前选中的 chat card 进行传递
          context={chatList[selectedIdx]}
        />
      </div>
    </div>
  )
};

export default HomeContainer;