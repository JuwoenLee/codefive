INSERT INTO problems (programmers_id, title, difficulty, category, accuracy, expected_minutes, url) VALUES
(150370,'개인정보 수집 유효기간',1,'문자열',42.3,20,'https://school.programmers.co.kr/learn/courses/30/lessons/150370'),
(161989,'덧칠하기',1,'그리디',60.4,15,'https://school.programmers.co.kr/learn/courses/30/lessons/161989'),
(161990,'바탕화면 정리',1,'구현',74.2,15,'https://school.programmers.co.kr/learn/courses/30/lessons/161990'),
(258712,'가장 많이 받은 선물',1,'해시',34.2,20,'https://school.programmers.co.kr/learn/courses/30/lessons/258712'),
(131701,'연속 부분 수열 합의 개수',2,'수학',68.7,35,'https://school.programmers.co.kr/learn/courses/30/lessons/131701'),
(155651,'호텔 대실',2,'정렬',47.1,40,'https://school.programmers.co.kr/learn/courses/30/lessons/155651'),
(43163,'단어 변환',3,'BFS / DFS',61.4,45,'https://school.programmers.co.kr/learn/courses/30/lessons/43163'),
(12987,'숫자 게임',3,'그리디',72.8,30,'https://school.programmers.co.kr/learn/courses/30/lessons/12987'),
(1844,'게임 맵 최단거리',2,'BFS / DFS',58.6,30,'https://school.programmers.co.kr/learn/courses/30/lessons/1844'),
(42586,'기능개발',2,'스택 / 큐',63.8,25,'https://school.programmers.co.kr/learn/courses/30/lessons/42586'),
(42888,'오픈채팅방',2,'문자열',64.7,30,'https://school.programmers.co.kr/learn/courses/30/lessons/42888'),
(42861,'섬 연결하기',3,'그리디',55.3,45,'https://school.programmers.co.kr/learn/courses/30/lessons/42861'),
(49189,'가장 먼 노드',3,'그래프',52.1,50,'https://school.programmers.co.kr/learn/courses/30/lessons/49189'),
(42577,'전화번호 목록',2,'해시',56.4,25,'https://school.programmers.co.kr/learn/courses/30/lessons/42577'),
(176962,'과제 진행하기',2,'스택 / 큐',50.5,35,'https://school.programmers.co.kr/learn/courses/30/lessons/176962')
ON CONFLICT (programmers_id) DO UPDATE SET expected_minutes = EXCLUDED.expected_minutes, category = EXCLUDED.category, url = EXCLUDED.url;
