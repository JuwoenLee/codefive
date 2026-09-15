import type { Discussion, Problem } from './types';

export const problems: Problem[] = [
  {id:1,programmersId:258712,title:'가장 많이 받은 선물',difficulty:'Lv. 1',category:'해시',accuracy:34.2,expectedMinutes:20,solved:false,slug:'most-received-gift'},
  {id:2,programmersId:131701,title:'연속 부분 수열 합의 개수',difficulty:'Lv. 2',category:'수학',accuracy:68.7,expectedMinutes:35,solved:false,slug:'continuous-subsequence'},
  {id:3,programmersId:155651,title:'호텔 대실',difficulty:'Lv. 2',category:'정렬',accuracy:47.1,expectedMinutes:40,solved:false,slug:'hotel-room'},
  {id:4,programmersId:43163,title:'단어 변환',difficulty:'Lv. 3',category:'BFS / DFS',accuracy:61.4,expectedMinutes:45,solved:false,slug:'word-transform'},
  {id:5,programmersId:12987,title:'숫자 게임',difficulty:'Lv. 3',category:'그리디',accuracy:72.8,expectedMinutes:30,solved:false,slug:'number-game'}
];

export const discussions: Discussion[] = [
  {id:1,title:'해시맵 하나로 O(n)에 풀 수 있을까요?',problem:'가장 많이 받은 선물',author:'dev_mandu',avatar:'DM',replies:12,time:'18분 전',solved:true},
  {id:2,title:'투 포인터로 접근했는데 시간 초과가 납니다',problem:'연속 부분 수열 합의 개수',author:'binary_kim',avatar:'BK',replies:8,time:'42분 전',solved:false},
  {id:3,title:'우선순위 큐 없이 푸는 깔끔한 방법',problem:'호텔 대실',author:'lime_dev',avatar:'LD',replies:5,time:'1시간 전',solved:true}
];
