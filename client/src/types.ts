export type Difficulty = 'Lv. 1' | 'Lv. 2' | 'Lv. 3';
export interface Problem { id:number; programmersId:number; title:string; difficulty:Difficulty; category:string; accuracy:number; expectedMinutes:number; solved:boolean; slug:string; }
export interface Discussion { id:number; title:string; problem:string; author:string; avatar:string; replies:number; time:string; solved:boolean; }
export interface ApiDiscussion { id:number; title:string; content:string; views:number; created_at:string; problem_id:number; username:string; problem_title:string; comment_count:number; }
