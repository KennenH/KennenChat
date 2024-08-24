import { IChatMessage } from "../ChatCard";

/**
 * 子 item 的测量数据
 */
interface MeasuredItem {
  /**
   * height：子 item 的真实高度
   * offset：bottom 偏移量
   */
  [key: number]: {height: number, offset: number}
}

/**
 * 所有聊天已经测量的子 item 的缓存数据
 * id：对应的 chat id
 */
interface MeasuredDataInfos {
  [id: string]: MeasuredDataInfo,
}

type UseMeasuredDataInfoType = {
  [key: string]: (itemCount?: number) => MeasuredDataInfo;
};

/**
 * 当前聊天已测量的子 item 缓存数据
 */
interface MeasuredDataInfo {
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
  listVirtualHeight: number,
}

class MeasuredData {

  private constructor() {}

  private static INSTANCE: MeasuredData | null = null;

  public static getInstance(): MeasuredData {
    if (!MeasuredData.INSTANCE) {
      MeasuredData.INSTANCE = new MeasuredData();
    }
    return MeasuredData.INSTANCE;
  } 

  /**
   * 已经计算好的子 item 的信息
   */
  private measuredDataInfos: MeasuredDataInfos = {};

  /**
   * 使用 proxy 拦截获取，当为 undefined 时进行初始化
   */
  public useMeasuredDataInfo = new Proxy(this.measuredDataInfos, {
    get: (measuredDataInfos: MeasuredDataInfos, chatId: string) => {
      // 返回函数可以接收一个 itemCount 参数
      return (itemCount?: number): MeasuredDataInfo => {
        if (!measuredDataInfos[chatId]) {
          measuredDataInfos[chatId] = {
            measuredItem: {},
            topMostMeasuredIndex: -1,
            listVirtualHeight: itemCount ? itemCount * this.getEstimatedItemHeight() : 500,
          };
        }
        return measuredDataInfos[chatId];
      };
    }
  }) as unknown as UseMeasuredDataInfoType;

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
  public getEstimatedItemHeight = () => {
    return 120;
  }
  
  /**
   * 消息记录的高度由于渲染发生了改变，更新虚拟列表的虚拟高度
   * 
   * 1. 更新虚拟列表的虚拟高度
   * 2. 更新下标为 index 的 item 的高度
   * 3. 将从 index 开始到最底部（最新）消息的偏移进行更正
   */
  public onChildSizeChanged = (
    index: number, 
    offsetHeight: number,
    measuredDataInfo: MeasuredDataInfo, 
    messages?: IChatMessage[]
  ) => {
    if (!messages) {
      return;
    }
    const { measuredItem, topMostMeasuredIndex } = measuredDataInfo;
    
    // 如果滚动到顶部了，那么可以直接确定虚拟列表的最终虚拟高度
    if (index === 0) {
      const { height, offset } = measuredItem[0];
      measuredDataInfo.listVirtualHeight = height + offset;
    } else {
      if (topMostMeasuredIndex > 0) {
        // 每渲染一个子 item 都更新虚拟高度
        measuredDataInfo.listVirtualHeight += (offsetHeight - measuredItem[index].height);
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
   * 获取对应下标的 item 高度和偏移
   * 
   * @param index 要获取测量数据的子 item 的下标
   * @returns 对应下标的子 item 的测量数据 {@link MeasuredItem}
   */
  public getMesuredData = (
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
      // if (index === 0) {
      //   const { height, offset } = measuredItem[0];
      //   measuredDataInfo.listVirtualHeight = height + offset;
      // }
    }
    return measuredItem[index];
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
  public getRenderIndex = (
    itemCount: number, 
    listRealheight: number, 
    scrolledOffset: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    const endIndex = this.getEndIndex(itemCount, scrolledOffset, measuredDataInfo);
    const startIndex = this.getStartIndex(listRealheight, endIndex, measuredDataInfo);
    return [Math.max(0, startIndex - 3), Math.min(itemCount - 1, endIndex + 2)];
  }

  /**
   * 当有新消息时更新已经测量过的偏移数据
   * 
   * @param chatCardId 聊天 id
   * @param itemCount 聊天中有多少条聊天记录
   */
  public updateOnNewMessage = (chatCardId: string, itemCount: number) => {
    // 更新虚拟列表的高度，即加上一个新消息的预估高度
    const measuredDataInfo = this.useMeasuredDataInfo[chatCardId]();
    const estimatedHeight = this.getEstimatedItemHeight();
    measuredDataInfo.listVirtualHeight += estimatedHeight;

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
}

export default MeasuredData.getInstance();