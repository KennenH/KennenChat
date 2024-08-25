/**
 * 虚拟列表
 * 
 * 1. 估算所有子 item 的总高度，撑开滚动条
 * 2. 找到真正需要渲染的子 item 的 index 并在正确的偏移处渲染它们
 *    - 由于聊天列表必然是从底部开始往上拉的，所以最后一个 item 的 bottom 为 0
 *    - 对于在任意位置的子 item，都可以通过它下方的子 item 的偏移和高度相加进行计算
 *    
 *    -> 列表在往上滚动的过程中计算沿途的子 item 的 bottom 和高度，并作为后续子 item 的位置计算的基础
 */
import React, { RefObject } from 'react';
import './index.scss';
import { IChatCardProps, IChatMessage } from '../ChatCard';
import Message from '../Message';
import _ from 'lodash';

interface IKVirtualListProps {
  chatCardProps: IChatCardProps,
}

interface ListVirtualHeights {
  [key: string]: number,
}

/**
 * 子 item 的测量数据
 */
interface MeasuredItem {
  /**
   * height：子 item 的真实高度
   * offset：bottom 偏移量
   */
  [key: number]: { height: number, offset: number }
}

/**
 * 所有聊天已经测量的子 item 的缓存数据
 * id：对应的 chat id
 */
interface MeasuredDataInfos {
  [id: string]: MeasuredDataInfo,
}

/**
 * 当前聊天已测量的子 item 缓存数据
 */
export interface MeasuredDataInfo {
  /**
   * 当前聊天所有已测量的子 item 缓存数据
   */
  measuredItem: MeasuredItem,

  /**
   * 当前聊天最上方的（最旧的）已经测量的子 item 的下标
   */
  topMostMeasuredIndex: number,

  /**
   * 当前聊天虚拟列表的虚拟高度，用于撑开滚动条
   */
  // listVirtualHeight: number,
}

/**
 * 已经计算好的子 item 的信息
 */
const measuredDataInfos: MeasuredDataInfos = {};

interface IKVirtualListState {
  listRealHeight: number,
  listVirtualHeights: ListVirtualHeights,
  scrolledOffset: number,
}

class KVirtualList extends React.Component<IKVirtualListProps, IKVirtualListState> {

  private virtualListRef: RefObject<HTMLDivElement>;

  private resizeObserver: ResizeObserver | undefined;

  constructor(props: IKVirtualListProps) {
    super(props);
    this.state = {
      /**
       * 列表的真实高度，外部列表的高度
       * 
       * flex：1，撑满父容器的剩余空间
       */
      listRealHeight: 500,

      /**
       * 列表的虚拟高度，内部列表的高度，用于撑开滚动条
       * 
       * 初始化为 item 数量 * item 的预估高度
       */
      listVirtualHeights: {},

      /**
       * 聊天记录需从底部开始滑动
       * 因此滑动过的距离应该是：列表总高度 H - scrollTop - 可视窗口高度 height
       */ 
      scrolledOffset: 0,

    }

    /**
     * 最外层 div 的引用
     */
    this.virtualListRef = React.createRef();
  }

  componentDidMount(): void {
    // 监听虚拟列表自身真实高度
    const throttledResizeCallback = _.throttle((entries: any) => {
      const { height } = entries[0].contentRect;
      this.setState({ listRealHeight: height });
    }, 1000, { leading: false, trailing: true });

    this.resizeObserver = new ResizeObserver(throttledResizeCallback);

    if (this.virtualListRef.current) {  
      this.resizeObserver.observe(this.virtualListRef.current);  
    }  
  }

  UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<IKVirtualListProps>, 
    nextContext: any
  ): void {
    const { chatCardProps: { messageList, id } } = this.props;
    const { messageList: nextMessageList, id: nextId } = nextProps.chatCardProps;
    if (
      nextMessageList 
      && id === nextId 
      && nextMessageList !== messageList
    ) {
      // 有新消息时：更新虚拟列表高度和测量数据
      if (nextMessageList.length > messageList.length) {
        this.updateOnNewMessage(nextId, nextMessageList.length);
      } else { // 删除消息时
        // todo 删除消息后更新虚拟列表高度和测量数据
      }
    }
  }

  componentDidUpdate(
    prevProps: Readonly<IKVirtualListProps>, 
    prevState: Readonly<IKVirtualListState>, 
    snapshot?: any
  ): void {
    const { messageList: prevMessageList, id: prevId } = prevProps.chatCardProps;
    const { chatCardProps: { messageList, id } } = this.props;
    const { listVirtualHeights } = this.state;

    if (messageList !== prevMessageList || id !== prevId) {
      // 如果虚拟列表高度为空则按照消息条数预估虚拟列表高度
      if (!listVirtualHeights[id]) {
        const newListVirtualHeights = { ...listVirtualHeights };
        newListVirtualHeights[id] = 
          messageList.length * this.getEstimatedItemHeight();
        this.setState({ listVirtualHeights: newListVirtualHeights });
      }
  
      this.scrollToBottom();
      this.throttledScroll();
    }
  }

  componentWillUnmount(): void {
    // 清理 ResizeObserver
    if (this.virtualListRef.current && this.resizeObserver) {
      this.resizeObserver.unobserve(this.virtualListRef.current);
    }
  }
  
  /**
   * 使用 proxy 拦截获取，当为 undefined 时进行初始化
   */
  private useMeasuredDataInfo = new Proxy(measuredDataInfos, {
    get: (measuredDataInfos: MeasuredDataInfos, chatId: string) => {
      // 返回函数可以接收一个 itemCount 参数
      if (!measuredDataInfos[chatId]) {
        measuredDataInfos[chatId] = {
          measuredItem: {},
          topMostMeasuredIndex: -1,
        };
      }
      return measuredDataInfos[chatId];
    }
  });

  /**
   * 获取需要渲染的最上方 item 的 index
   * 
   * @param listRealheight 聊天框高度，用于计算聊天框中可以放多少个气泡
   * @param endIndex {@link getEndIndex(number)} 返回值
   * @returns 第一条要渲染的记录，即最上面一条聊天记录
   */
  private getStartIndex = (
    listRealheight: number, 
    endIndex: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    const bottomMostItem = this.getMesuredData(endIndex, measuredDataInfo);
    const maxVisibleOffset = bottomMostItem.offset + listRealheight;
    let offset = bottomMostItem.offset + bottomMostItem.height;
    let startIndex = endIndex;
    while (
      offset <= maxVisibleOffset 
      && startIndex > 0
    ) {
      startIndex--;
      offset += this.getMesuredData(startIndex, measuredDataInfo).height;
    }
    return startIndex;
  }

  /**
   * 获取需要渲染的最下方 item 的 index
   * 
   * @param scrolledOffset 从下往上已经滚动的距离
   * @returns 当前窗口中最后一条要渲染的聊天记录，即最底下的一条
   */
  private getEndIndex = (
    itemCount: number, 
    scrolledOffset: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    // 如果为初始化的 index，那么 end index 就是最后一条消息
    if (measuredDataInfo.topMostMeasuredIndex === -1) {
      measuredDataInfo.topMostMeasuredIndex = itemCount;
      return itemCount - 1;
    } else {
      for (let i = itemCount - 1; ; i--) {
        const offset = this.getMesuredData(i, measuredDataInfo).offset;
        if (offset >= scrolledOffset) {
          return i;
        }
        if (i <= 0) {
          return 0;
        }
      }
    }
  }

  /**
   * 根据屏幕上已经渲染过的气泡取平均来估算整个列表的长度
   * 
   * todo：可以根据聊天气泡内的字数来估算高度？
   */
  private getEstimatedItemHeight = () => {
    return 120;
  }

  /**
   * 获取虚拟列表真正需要渲染的数据的 index
   * 
   * @param itemCount 整个聊天记录的总记录条数
   * @param listRealheight 聊天框的真实高度
   * @param scrolledOffset 当前已经滚动过的距离
   * 
   * @returns 当前滚动窗口下实际需要渲染的子 item 的开始和结束下标
   */
  private getRenderIndex = (
    itemCount: number, 
    listRealheight: number, 
    scrolledOffset: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    const endIndex = this.getEndIndex(itemCount, scrolledOffset, measuredDataInfo);
    const startIndex = this.getStartIndex(listRealheight, endIndex, measuredDataInfo);
    return [Math.max(0, startIndex - 2), Math.min(itemCount - 1, endIndex + 3)];
  }

  /**
   * 获取对应下标的 item 高度和偏移
   * 
   * @param index 要获取测量数据的子 item 的下标
   * @returns 对应下标的子 item 的测量数据 {@link MeasuredItem}
   */
  private getMesuredData = (
    index: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    const { measuredItem } = measuredDataInfo;
    let { topMostMeasuredIndex } = measuredDataInfo;
    if (index < topMostMeasuredIndex) {
      let offset = 0;
      const topMostMeasuredItem = measuredItem?.[topMostMeasuredIndex];
      if (topMostMeasuredItem) {
        offset += topMostMeasuredItem.offset + topMostMeasuredItem.height;
      }
      // 从下到上计算没有被测量的 item 的位置
      for (let i = topMostMeasuredIndex - 1; i >= index; i--) {
        const height = this.getEstimatedItemHeight();
        measuredItem[i] = { height, offset };
        offset += height;
      }
      measuredDataInfo.topMostMeasuredIndex = index;
    }
    return measuredItem[index];
  }

  /**
   * 当有新消息时更新已经测量过的偏移数据
   * 
   * @param chatCardId 聊天 id
   * @param itemCount 聊天中有多少条聊天记录
   */
  private updateOnNewMessage = (
    chatCardId: string, 
    itemCount: number
  ) => {
    // 更新虚拟列表的高度，即加上一个新消息的预估高度
    const measuredDataInfo = this.useMeasuredDataInfo[chatCardId];
    const estimatedHeight = this.getEstimatedItemHeight();
    const { listVirtualHeights } = this.state;
    const newListVirtualHeights = {...listVirtualHeights};
    newListVirtualHeights[chatCardId] += estimatedHeight;
    this.setState({
      listVirtualHeights: newListVirtualHeights,
    });

    // 将新消息的预估高度和偏移量放入测量数据
    const measuredItem = measuredDataInfo.measuredItem;
    measuredItem[itemCount - 1] = { 
      height: estimatedHeight,
      offset: 0,
    };
    
    // 从最新一条消息更新至 topMost
    let offset = 0;
    for (let i = itemCount - 1; i >= measuredDataInfo.topMostMeasuredIndex; i--) {
      measuredItem[i].offset = offset;
      offset += measuredItem[i].height;
    }
  }

  /**
   * 消息记录的高度由于渲染发生了改变，更新虚拟列表的虚拟高度
   * 
   * 1. 更新虚拟列表的虚拟高度
   * 2. 更新下标为 index 的 item 的高度
   * 3. 将从 index 开始到最底部（最新）消息的偏移进行更正
   */
  private onChildSizeChanged = (
    index: number, 
    offsetHeight: number,
    measuredDataInfo: MeasuredDataInfo, 
    messages?: IChatMessage[],
  ) => {
    if (!messages) {
      return;
    }
    const { measuredItem, topMostMeasuredIndex } = measuredDataInfo;
    const { listVirtualHeights } = this.state;
    const { chatCardProps: { id: chatCardId } } = this.props;
    const newListVirtualHeights = {...listVirtualHeights};

    // 如果滚动到顶部了，那么可以直接确定虚拟列表的最终虚拟高度
    if (index === 0) {
      const { height, offset } = measuredItem[0];
      newListVirtualHeights[chatCardId] = height + offset;
      this.setState({
        listVirtualHeights: newListVirtualHeights
      });
    } else {
      if (topMostMeasuredIndex > 0) {
        // 每渲染一个子 item 都更新虚拟高度
        newListVirtualHeights[chatCardId] += offsetHeight - measuredItem[index].height;
        this.setState({
          listVirtualHeights: newListVirtualHeights
        });
      }
    }

    // 更新下标为 index 的 item 的高度    
    measuredItem[index].height = offsetHeight;
    // 更新从 topMostMeasuredIndex 开始到最新消息的偏移
    let offset = 0;
    for (let i = messages.length - 1; i >= topMostMeasuredIndex; i--) {
      const itemData = measuredItem[i];
      itemData.offset = offset;
      offset += itemData.height;
    }
  }

  /**
   * 虚拟列表滚动至底部
   */
  private scrollToBottom = () => {
    if (this.virtualListRef.current) {
      const { listRealHeight } = this.state;
      this.virtualListRef.current.scrollTop = this.virtualListRef.current.scrollHeight - listRealHeight;
    }
  }

  private throttledGetRenderMessageList = _.throttle(() => {
    return this.getRenderMessageList();
    // return (<div></div>);
  }, 200, { leading: true, trailing: true });

  /**
   * 实例化真正需要渲染的 item
   * 
   * @returns 需要渲染的 item 的列表
   */
  private getRenderMessageList = () => {
    const { chatCardProps: { messageList, id } } = this.props;
    if (!messageList) {
      return;
    }

    const { listRealHeight, scrolledOffset } = this.state;
    const measuredDataInfo = this.useMeasuredDataInfo[id];
    const [startIndex, endIndex] = this.getRenderIndex(
      messageList.length,
      listRealHeight,
      scrolledOffset,
      measuredDataInfo,
    );
    const renderList = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const bottom = this.getMesuredData(i, measuredDataInfo).offset;
      const itemStyles = {
        position: 'absolute',
        bottom: bottom,
      };
      renderList.push(
        <Message 
          key={messageList[i].fingerprint}
          message={messageList[i]}
          onSizeChanged={offsetHeight => this.onChildSizeChanged(i, offsetHeight, measuredDataInfo, messageList)}
          styles={itemStyles}
        />
      );
    }
    return renderList;
  }

  private throttledScroll = _.throttle(() => {
      if (this.virtualListRef.current) {
        const { listVirtualHeights, listRealHeight } = this.state;
        const { chatCardProps: { id } } = this.props;
        const listVirtualHeight = listVirtualHeights[id];
        this.setState({
          scrolledOffset: listVirtualHeight - this.virtualListRef.current.scrollTop - listRealHeight
        });
      }
    }, 200, { leading: true, trailing: true }
  );

  render() {
    const { listVirtualHeights } = this.state;
    const { chatCardProps: { id } } = this.props;
    return (
      <div 
        className='v-list-container'
        onScroll={this.throttledScroll}
        ref={this.virtualListRef}
      >
        <div
          className='v-list-inner-container'
          style={{ height: listVirtualHeights[id] }}
        >
          {this.throttledGetRenderMessageList()}
        </div>
      </div>
    );
  }
};

export default KVirtualList;