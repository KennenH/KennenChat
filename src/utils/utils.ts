export const formatDate = (date?: Date): string => {  
  if (!date) return '';
  
  const year = date.getFullYear();  
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份加1并补0  
  const day = date.getDate().toString().padStart(2, '0'); // 日期补0  
  const hours = date.getHours().toString().padStart(2, '0'); // 小时补0  
  const minutes = date.getMinutes().toString().padStart(2, '0'); // 分钟补0  
  const seconds = date.getSeconds().toString().padStart(2, '0'); // 秒补0  
    
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;  
}
