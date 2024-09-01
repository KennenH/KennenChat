/**
 * 用于生成 mock data，检测虚拟列表性能
 */
import { v4 as uuidv4 } from 'uuid';

const TRAVEL = `三天两晚的成都旅游攻略

一、行程安排

第一天：到达成都，熟悉市区环境

* 上午：抵达成都，入住酒店，稍作休息。
* 下午：游览成都市区，感受城市的节奏。可参观天府广场、人民公园，体验当地人的生活氛围。
* 晚上：品尝成都著名的小吃，如火锅、串串香等。

第二天：文化之旅

* 上午：前往武侯祠，感受三国文化的魅力。
* 下午：游览锦里古街，体验古街风情和地道的成都文化。
* 晚上：参观宽窄巷子，品味夜成都的独特魅力。

第三天：自然与休闲之旅

* 上午：前往大熊猫繁育研究基地，观看可爱的大熊猫。
* 下午：游览成都周边景点，如青羊宫、杜甫草堂等。
* 晚上：在成都市区选择一家特色餐厅，享受美食盛宴。

二、住宿与餐饮

住宿：
选择位于市中心的酒店，方便出行，同时体验成都的夜生活。

餐饮：

1. 品尝成都特色小吃，如火锅、串串香、龙抄丝等。
2. 尝试川菜，体验麻辣鲜香的味道。
3. 选择一家当地特色餐厅，品尝地道的成都美食。

三、注意事项

1. 成都气候湿润，出行时请携带雨具。
2. 游览景点时，请注意保护文物古迹，不要随地吐痰。
3. 成都的美食以麻辣为主，如有饮食禁忌，请提前告知餐厅服务人员。
4. 成都的夜生活十分丰富，请合理安排时间，保证充足的休息。

四、推荐景点介绍

1. 武侯祠：一座纪念诸葛亮的祠堂，展示三国文化的瑰宝。
2. 锦里古街：充满古色古香的街道，体验地道的成都文化。
3. 宽窄巷子：感受老成都的生活氛围，品味地道小吃。
4. 大熊猫繁育研究基地：观看大熊猫的生活状态，了解大熊猫的繁育情况。
5. 青羊宫、杜甫草堂：感受道教文化和古代诗歌的魅力。

五、购物推荐
在宽窄巷子、锦里等地可以购买一些特色手工艺品、纪念品和当地特产。此外，春熙路也是购物的好去处，那里有许多商场和特色小店。

六、总结与建议
三天两晚的成都之旅，既能体验当地的文化氛围，又能品尝美食，还能欣赏自然风光。建议游客合理安排时间，既要充分游览景点，又要保证充足的休息。在旅行过程中，注意保护环境，尊重当地的风俗习惯。祝你在成都度过愉快的时光！`;


const CODE = `快速排序（Quick Sort）是一种高效的排序算法，采用分治法（Divide and Conquer）策略。以下是一个使用Java实现的快速排序的简单示例：

\`\`\`java
public class QuickSort {
  public void sort(int[] array, int low, int high) {
    if (low < high) {
      // 找到基准值的位置
      int pivotIndex = partition(array, low, high);

      // 对基准值左边的元素进行递归排序
      sort(array, low, pivotIndex - 1);

      // 对基准值右边的元素进行递归排序
      sort(array, pivotIndex + 1, high);
      }
    }

    private int partition(int[] array, int low, int high) {
      // 选择最左边的元素作为基准值
      int pivot = array[low];
      int i = low + 1; // i指向基准值右边的第一个元素
      for (int j = low + 1; j <= high; j++) {
        // 如果当前元素小于基准值，则交换它们的位置
        if (array[j] < pivot) {
        swap(array, i, j);
        i++;
        }
      }
      // 将基准值放置到正确的位置（中间位置）
      swap(array, low, i - 1);
      return i - 1; // 返回基准值的新位置，也就是划分后右边的第一个元素位置
    }

    private void swap(int[] array, int i, int j) {
      int temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }

    public static void main(String[] args) {
      int[] array = { 10, 7, 8, 9, 1, 5 }; // 示例数组
      QuickSort qs = new QuickSort();
      qs.sort(array, 0, array.length - 1); // 对数组进行排序操作
      for (int value : array) { // 输出排序后的数组元素，检查结果是否正确
        System.out.print(value + " "); // 在数组元素之间添加空格输出以便查看效果，你可以移除这些空格并选择适当的输出格式。
      }
  }
}
\`\`\`

在这个实现中，\`sort\` 方法是递归调用的入口点。它接受一个数组和两个索引（\`low\` 和 \`high\`），这两个索引定义了需要排序的数组部分。\`partition\` 方法用于找到基准值（pivot）的正确位置，并重新排列数组。\`swap\` 方法则用于交换两个元素的位置。\`main\` 方法则提供了一个使用示例，演示了如何对一个简单的整数数组进行排序。

当你调用 \`sort\` 方法时，它首先会调用 \`partition\` 方法确定基准值的位置，然后将数组分为两部分：小于基准值的元素和大于等于基准值的元素。接着它对这两部分递归地进行相同的操作，直到整个数组都被排序好为止。`;

const createMessage = (
  content,
  sender,
) => {
  return ({
    content: content,
    time: new Date(),
    sender: sender,
    fingerprint: uuidv4(),
  });
};

onmessage = (param) => {  
  console.log('~kennen-tag mocking data...');
  const mockData = [];
  let flag = true;
  const { n, t } = param.data;

  if (t === 'c') {
    for (let i = 0; i < n; i++) {
      mockData.push(createMessage(flag ? CODE : TRAVEL, flag ? 0 : 1));
      flag = !flag;
    }
  } else {
    for (let i = 0; i < n; i++) {
      mockData.push(createMessage(i.toString(), flag ? 0 : 1));
      flag = !flag;
    }
  }
  console.log('~kennen-tag mock done');
  postMessage(mockData);
};  