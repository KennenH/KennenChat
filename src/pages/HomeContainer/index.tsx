import { request } from "@/utils";
import React, { useEffect, useState } from "react";
import './index.scss';
import { NavigateFunction, Outlet, useNavigate } from "react-router-dom";
import SideBarHeader from "../SideBar/SideBarHeader";
import SideBarBody from "../SideBar/SideBarBody";
import SideBarFooter from "../SideBar/SideBarFooter";
import { IChatCardProps, IChatMessage, Sender } from "@/components/ChatCard";
import { uniqueId } from "lodash";
import { IChatProps } from "../Window/Chat";
import { ISettingProps } from "../Window/Setting";
import classNames from "classnames";

/**
 * 初始化时和清空时自动生成一条新的聊天
 * 使得 chatList 永远不为空数组
 * 
 * 此处必须为一个方法，否则后续调用将不再生成新的对象
 */
const createChatCard = (): IChatCardProps => {
  return ({
    title: '新的聊天',
    messageList: [createMessage()],
  });
};

/**
 * 创建一条消息
 * @param content 消息内容
 * @param sender 发送人
 */
const createMessage = (
  content?: string,
  sender?: Sender,
): IChatMessage => {
  return ({
    content: content ?? "有什么可以帮你的吗",
    time: new Date(),
    sender: sender ?? Sender.NOT_ME,
    fingerprint: uniqueId(),
  });
};

const handleNavigate = (
  nav: NavigateFunction,
  path: string,
) => {
  // navigate to specific path
  nav(path);
}

/**
 * 初始化 chat card list
 * 从本地缓存获取，无缓存则新建一个
 */ 
const initialChatList = [createChatCard()];

const HomeContainer: React.FC = () => {

  const nav = useNavigate();

  /**
   * 当前选中的 chat card，传递给 body 显示聊天记录
   */
  const [selectedIdx, setSelectedIdx] = useState(0);

  /**
   * chat card 列表
   * 每个 card 中存放了该聊天的所有对话记录
   */
  const [chatList, setChatList] = useState(initialChatList);

  /**
   * 是否为全屏模式
   */
  const [isFullScreen, setIsFullScreen] = useState(false);

  /**
   * 是否显示编辑弹窗
   */
  const [isShowEditModal, setIsShowEditModal] = useState(false);

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
  };

  /**
   * 切换选中的 chat card
   */
  const handleClickCard = (index: number) => {
    setSelectedIdx(index);
  };

  /**
   * 新增一个 chat card
   * 新增的 item 加在数组 index 0 位置
   */
  const handleClickNewChat = () => {
    // 不能用 push 或 unshift，这两个方法会直接修改原数组
    const newChatList = [createChatCard(), ...chatList];
    setChatList(newChatList);
  };

  /**
   * 切换全屏模式
   */
  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  /**
   * 编辑 chat card 弹窗
   */
  const handleClickEdit = () => {
    setIsShowEditModal(!isShowEditModal);
  };

  /**
   * 输入区域点击发送按钮
   */
  const handleClickSendMessage = (message: string) => {
    const newChatList = [...chatList];
    newChatList[selectedIdx]
      .messageList
      .push(
        createMessage(message, Sender.ME)
      );
    setChatList(newChatList);
  };

  /**
   * 二级路由 chat 参数
   */
  const chatParam: IChatProps = {
    chatCardProps: chatList[selectedIdx],
    isFullScreen: isFullScreen,
    handleToggleFullScreen: handleToggleFullScreen,
    handleClickEdit: handleClickEdit,
    handleClickSendMessage: handleClickSendMessage,
  };

  /**
   * 二级路由 setting 参数
   */
  const settingParam: ISettingProps = {
  };

  return (
    <div className={
      classNames(
        'home', 
        {'full-screen': isFullScreen},
      )}
    >
      {/* 面板区域 */}
      <div className="home-side-bar-container">
        <SideBarHeader />
        <SideBarBody 
          chatList={chatList}
          selectedIdx={selectedIdx}
          handleClickDelete={handleClickDelete}
          handleClickCard={handleClickCard}
          handleClickBody={() => handleNavigate(nav, '/')}
        />
        <SideBarFooter
          handleClickSetting={() => handleNavigate(nav, '/setting')} 
          handleClickNewChat={handleClickNewChat}
        />
      </div>
      <div className="home-chat-container">
        {/* 渲染二级路由的地方 */}
        <Outlet
          // 将当前选中的 chat card 进行传递
          context={chatParam}
        />
      </div>

      {/* 弹窗区域 */}
      {isShowEditModal && 
        <div className="home-chat-edit-modal-mask">
          <div className="home-chat-edit-modal">

          </div>
        </div>
      }
    </div>
  )
};

export default HomeContainer;