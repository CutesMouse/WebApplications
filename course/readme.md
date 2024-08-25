# 課表產生器 使用須知

1. 請將整份Code下載利用，可點選 [首頁](https://github.com/CutesMouse/WebApplications/tree/master) 中的Code、Download Zip來下載，或 [點此](https://github.com/CutesMouse/WebApplications/archive/refs/heads/master.zip)。
2. 編輯 [CourseInfo.js](https://github.com/CutesMouse/WebApplications/tree/master/course/CourseInfo.js) 文件，依照[此格式](https://github.com/CutesMouse/WebApplications/new/master#%E8%AA%B2%E7%A8%8B%E5%85%A7%E5%AE%B9%E8%BC%B8%E5%85%A5%E6%A0%BC%E5%BC%8F)輸入
3. 若要更改課表格式，請於 [RenderObject.js](https://github.com/CutesMouse/WebApplications/tree/master/course/RenderObject.js) 中更改，詳細資訊請參考註解
4. 打開 [index.html](https://github.com/CutesMouse/WebApplications/blob/master/index.html) 即可看到生成好的課表

[**成果預覽**](https://cutesmouse.github.io/WebApplications/course/index.html)

## 課程內容輸入格式
請在 [CourseInfo.js](https://github.com/CutesMouse/WebApplications/tree/master/course/CourseInfo.js) 依照此格式輸入

```javascript
create_course('<課程名稱>', '<授課教師>', '<上課地點>', '<上課時間>', '<背景顏色代碼>', '<文字顏色代碼>');
```

所有內容類型皆為字串，其中最後一個參數「文字顏色代碼」默認為黑色

「上課時間」格式為「星期+節數」，對應之代碼如下。

例：若一門課程時間為星期二的第三節與星期四的第五、六節，則應輸入「T3R5R6」(要照時間先後排序)

| 星期 |  代碼 |
|---|---|
| 一 | M |
| 二 | T |
| 三 | W |
| 四 | R |
| 五 | F |

| 節數 |  代碼 |
|---|---|
| 第一節 | 1 |
| 第二節 | 2 |
| 第三節 | 3 |
| 第四節 | 4 |
| 午休時間 | n | 
| 第五節 | 5 |
| 第六節 | 6 |
| 第七節 | 7 |
| 第八節 | 8 |
| 第九節 | 9 |
| 第a節 | a |
| 第b節 | b |
| 第c節 | c |
