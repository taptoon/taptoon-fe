# TapToon:  𓆉𓆝 𓆟 𓆞 𓆝 𓆟𓇼 웹툰 창작의 꿈을 잇다

<br>
<img width="1000" src="https://github.com/user-attachments/assets/2d014f23-75fc-4015-ad37-f7b6dc880272" />


<br/>

## ☄️ 순간이동
* [💻 프로젝트 개요](#-프로젝트-개요)
* [⚙️👷🏻‍♂️🛠️🔧 Developed by](#-developed-by)
* [⏳ 작업 기간](#-작업-기간)
* [📚 Used Stacks](#-used-stacks)
* [🔳 와이어 프레임](#-와이어-프레임)
* [🏗️ 프로젝트 구조](#-프로젝트-구조)
  * [𓊍 프로젝트 아키텍처](#𓊍-프로젝트-아키텍처)
  * [⛁ ERD (RDMBS)](#-erd-rdmbs)
  * [⛃ MongoDB Schema](#-mongodb-schema)
  * [🔁 프로젝트 플로우 개요](#-프로젝트-플로우-개요)
  * [🌀 서비스 상세 플로우 (참고)](#-서비스-상세-플로우-참고)
* [🧩 API 명세서](#-api-명세서)
* [⚡ 주요 기능](#-주요-기능)
  * [📁 포트폴리오 등록](#-포트폴리오-등록)
  * [📝 매칭 포스트 (구인 글)](#-매칭-포스트-구인-글)
  * [🗣️ 채팅](#-채팅)
* [🪵 Dev log](#-dev-log)

<br/>

## 💻 프로젝트 개요

> 🎨✍️ **"아이디어는 있지만 그림이 어렵다면? 그림 실력은 있지만 이야기가 고민이라면?"**  
> 웹툰 작가와 글 작가가 만나 최고의 작품을 탄생시킬 수 있도록 도와주는 매칭 플랫폼을 소개합니다!
>
> ---
>
> 🔥 **어떻게 이용할 수 있나요?**
>
> 🥇 **자신을 PR하세요!**  
> 👉 **포트폴리오를 업로드**하고, 자신의 작품 스타일과 강점을 소개하세요.  
> 👉 **매칭 게시글을 작성**하여 함께할 파트너를 찾으세요.
>
> 🥈 **서로의 작품을 확인하세요!**  
> 👉 게시글을 보고 마음에 드는 작가를 찾고, 포트폴리오를 살펴보세요.  
> 👉 다양한 장르와 스타일을 가진 작가들을 한눈에 확인할 수 있습니다.
>
> 🥉 **바로 연락하고 협업을 시작하세요!**  
> 👉 **1:1 채팅 기능**을 통해 관심 있는 작가와 직접 소통하세요.  
> 👉 아이디어를 나누고, 새로운 프로젝트를 함께 시작하세요!
>
> ---
>
> 🎯 **이런 분들에게 추천합니다!**
>
> ✅ **글 작가** – 탄탄한 스토리는 있지만 그림을 그릴 줄 모른다면? ✍️  
> ✅ **웹툰 작가** – 뛰어난 작화 실력을 갖췄지만 스토리가 고민이라면? 🎨  
> ✅ **팀을 꾸리고 싶은 창작자** – 함께 성장할 파트너를 찾고 있다면? 🤝
>
> ---
>
> 지금 바로 **포트폴리오를 업로드**하고, 새로운 파트너를 찾아보세요! 🎬🔥

![Taptoon_Introduction](https://github.com/user-attachments/assets/c8afa44d-f299-449c-b3bf-3cfeaf378a6b)

<br/>

## ⚙️👷🏻‍♂️🛠️🔧 Developed by
<table>
  <tr>
    <th align="center">직책</th>
    <th align="center">프로필</th>
    <th align="center">이름</th>
    <th align="center">담당 업무</th>
  </tr>
  <tr>
    <td align="center">팀장 👑</td>
    <td align="center">
      <a href="https://github.com/chk223">
        <img src="https://i.redd.it/dms21uds4w871.jpg" width="80px" />
      </a>
    </td>
    <td align="center">
      <b><a href="https://github.com/chk223">김창현</a></b>
    </td>
    <td align="center">백엔드 개발 및 관리</td>
  </tr>
  <tr>
    <td align="center">부팀장 🏅</td>
    <td align="center">
      <a href="https://github.com/freedrawing">
        <img src="https://avatars.githubusercontent.com/u/43941383?v=4" width="80px" />
      </a>
    </td>
    <td align="center">
      <b><a href="https://github.com/freedrawing">강성욱</a></b>
    </td>
    <td align="center">프론트엔드 설계</td>
  </tr>
  <tr>
    <td align="center">팀원 🌟</td>
    <td align="center">
      <a href="https://github.com/leithharbor">
        <img src="https://avatars.githubusercontent.com/u/185915561?v=4" width="80px" />
      </a>
    </td>
    <td align="center">
      <b><a href="https://github.com/leithharbor">이상구</a></b>
    </td>
    <td align="center">DB 및 API 연동</td>
  </tr>
  <tr>
    <td align="center">팀원 🌟</td>
    <td align="center">
      <a href="https://github.com/dllll2">
        <img src="https://www.urbanbrush.net/web/wp-content/uploads/edd/2018/06/web-20180607032417590225.png" width="80px" />
      </a>
    </td>
    <td align="center">
      <b><a href="https://github.com/dllll2">이진영</a></b>
    </td>
    <td align="center">테스트 및 디버깅</td>
  </tr>
</table>


<br/>

## ⏳ 작업 기간
***2025.02.10 - 2025.03.16***

<br/>

## 📚 Used Stacks

<br>

<div align=center>
  <img src="https://img.shields.io/badge/java%2017-007396?style=for-the-badge&logo=java&logoColor=white">
  <img src="https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white">
  <img src="https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=spring-security&logoColor=white">
  <br>
  <img src="https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white">
  <img src="https://img.shields.io/badge/JUnit5-25A162?style=for-the-badge&logo=junit5&logoColor=white">
  <img src="https://img.shields.io/badge/OpenFeign-E50914?style=for-the-badge&logo=netflix&logoColor=white">
  <img src="https://img.shields.io/badge/JPA-59666C?style=for-the-badge&logo=hibernate&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/ElasticSearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white">
  <img src="https://img.shields.io/badge/Kibana-005571?style=for-the-badge&logo=kibana&logoColor=white">
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/OAuth%202.0-4285F4?style=for-the-badge&logo=google&logoColor=white">
  <img src="https://img.shields.io/badge/Naver-03C75A?style=for-the-badge&logo=naver&logoColor=white">
  <img src="https://img.shields.io/badge/Google-4285F4?style=for-the-badge&logo=google&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white">
  <img src="https://img.shields.io/badge/RDS-527FFF?style=for-the-badge&logo=amazonrds&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/Route%2053-8C4FFF?style=for-the-badge&logo=amazonroute53&logoColor=white">
  <img src="https://img.shields.io/badge/CloudFront-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/ELB-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/Lambda-FF9900?style=for-the-badge&logo=awslambda&logoColor=white">
  <img src="https://img.shields.io/badge/S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white">
  <img src="https://img.shields.io/badge/ElastiCache-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white">
  <img src="https://img.shields.io/badge/ECR-527FFF?style=for-the-badge&logo=amazonaws&logoColor=white">
  <br>

  <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white">
  <br>
</div>

## 🔳 와이어 프레임

<details>
  <summary><span style="font-size: 1.2em; font-weight: bold;">1. ✏️ 매칭 포스트 (게시글)</span></summary>
  <br />

### ✏️ 매칭 보드
![매칭보드](https://github.com/user-attachments/assets/04dbed36-9f3d-46f8-a7e0-1295ff3dc139)

<br/>

### ✏️ 매칭 포스트 작성
![Image](https://github.com/user-attachments/assets/5b1315eb-7ef6-4107-8016-973500fe222f)

<br/>

### ✏️ 매칭 포스트 상세 조회
![매칭포스트 작성](https://github.com/user-attachments/assets/beea8f26-9f68-4aa6-8c2a-cab52456934c)

<br/>

### ✏️ 매칭 포스트 수정
![Image](https://github.com/user-attachments/assets/53c82dfb-9a1c-4159-9a4b-aff93ee919d8)
</details>

<details>
  <summary><span style="font-size: 1.2em; font-weight: bold;">2. 🖼️ 포트폴리오</span></summary>
  <br />

### 🖼 포트폴리오 리스트 조회 
![Image](https://github.com/user-attachments/assets/a27b4c4a-c31e-40c6-8dd9-eaf2767f89ba)

### 🖼 포트폴리오 상세 조회
![Image](https://github.com/user-attachments/assets/1e0fbf6a-7ed3-4dfe-8878-3604f43c1445)

### 🖼 포트폴리오 작성
![Image](https://github.com/user-attachments/assets/00048c92-f113-49dc-85ef-2121fd3a8ca3)
</details>

<details>
  <summary><span style="font-size: 1.2em; font-weight: bold;">3. 🤡 채팅</span></summary>
  <br />

### 🤡 채팅 리스트
![Image](https://github.com/user-attachments/assets/5ca55ed6-9199-487b-ad00-09cdeb65b0b6)

### 🤡 채팅 화면
![Image](https://github.com/user-attachments/assets/0c1c8a92-3419-45d1-b0db-e1310735f7f1)
</details>

<br/>

## 🏗️ 프로젝트 구조

### 𓊍 프로젝트 아키텍처
<img width="1051" alt="Image" src="https://github.com/user-attachments/assets/21d42bc0-6cd2-4fa0-a248-43278d7949ba" />


### ⛁ ERD (RDMBS)

```mermaid
erDiagram
    member ||--o{ portfolio : owner_id
    member ||--o{ refresh_token : member_id
    member ||--o{ matching_post : user_id
    member ||--o{ comment : member_id
    
    category ||--o{ matching_post : category_id
    
    portfolio ||--o{ portfolio_file : portfolio_id
    
    matching_post ||--o{ matching_post_image : matching_post_id
    matching_post ||--o{ comment : matching_post_id
    
    comment ||--o{ comment : parent_id

    %% 엔터티 정의
    member {
        bigint id PK
        bit is_deleted
        datetime created_at
        datetime updated_at
        varchar email
        varchar name
        varchar nickname
        varchar password
        bigint provider_id
        enum grade "basic, plus, pro"
        enum provider "naver, google"
    }
    
    category {
        bigint id PK
        bigint member_id FK
        enum genre "fantasy, romance, comic, thriller, action, drama"
    }
    
    portfolio {
        bigint id PK
        bigint owner_id FK
        datetime created_at
        datetime updated_at
        text content
        varchar title
        enum status "pending, registered, deleting, deleted"
    }
    
    portfolio_file {
        bigint id PK
        bigint portfolio_id FK
        datetime created_at
        datetime updated_at
        varchar file_url
        varchar thumbnail_url
        varchar file_name
        enum file_type "pending, registered, deleted"
    }
    
    refresh_token {
        bigint id PK
        bigint member_id FK
        datetime created_at
        datetime expires_at
        datetime updated_at
        varchar device_info
        varchar token
    }
    
    matching_post {
        bigint id PK
        bigint user_id FK
        datetime created_at
        bigint view_count
        varchar description
        varchar file_url
        varchar title
        enum artist_type "writer, illustrator"
        enum status "pending, registered, deleted"
        enum work_type "online, offline, hybrid"
    }
    
    matching_post_image {
        bigint id PK
        bigint matching_post_id FK
        datetime created_at
        varchar original_image_url
        varchar thumbnail_image_url
        varchar file_name
        enum status "pending, deleted"
    }
    
    comment {
        bigint id PK
        bigint matching_post_id FK
        bigint member_id FK
        bigint parent_id FK
        bit is_deleted
        datetime created_at
        text content
    }
```


### ⛃ MongoDB Schema

```mermaid
classDiagram
    class chat_room {
        +_id : objectid PK
        +class : string
        +is_deleted : boolean
        +member_ids : array
    }

    class chat_message {
        +_id : objectid PK
        +chat_room_id : string FK
        +message : string
        +class : string
        +created_at : isodate
        +sender_id : int64
        +is_deleted : boolean
        +unread_count : int32
    }

    chat_room "1" -- "0..*" chat_message : chat_room_id
```


### 🔁 프로젝트 플로우 개요

```mermaid
flowchart TD
    A[시작] --> B[회원 가입]
    B --> C[포트폴리오 작성]
    C --> K[포트폴리오 수정/삭제]
    B --> D[구인 글 작성]
    D --> E[구인 글 수정/삭제]
    D --> F[다른 사용자와 채팅]
    D --> G[구인 글 검색]
    D --> H[다른 사람의 프로필 조회]
    H --> L[다른 사람의 포트폴리오 조회]
    F --> I[채팅 종료]
    H --> J[프로필 닫기]
    L --> M[포트폴리오 닫기]
```

### 🌀 서비스 상세 플로우 (참고)
<details>
  <summary><span style="font-size: 1.2em; font-weight: bold;">1. 📲 회원가입</span></summary>
  <br />

  ![회원가입](https://github.com/user-attachments/assets/4a0b3f3f-ab37-430d-bc8b-59fa77e86a1d)
</details>
<details>
  <summary><span style="font-size: 1.2em; font-weight: bold;">2. 🔎 검색</span></summary>
  <br />

![검색](https://github.com/user-attachments/assets/7a75f682-96c9-4154-b2bf-630a4964a1d3)
</details>
<details>
  <summary><span style="font-size: 1.2em; font-weight: bold;">3. ✍️ 매칭포스트(게시글) 작성, 수정 및 삭제</span></summary>
  <br />

![매칭포스트(게시글) 작성, 수정 및 삭제](https://github.com/user-attachments/assets/85430d9f-d902-4d55-8147-d82be5ff26c8)
</details>
<details>
  <summary><span style="font-size: 1.2em; font-weight: bold;">4. 💼 포트폴리오 관리</span></summary>
  <br />

![포트폴리오](https://github.com/user-attachments/assets/23db30c4-f97c-4442-a526-56f062e35ae4)
</details>
<details>
  <summary><span style="font-size: 1.2em; font-weight: bold;">5. 💬 채팅</span></summary>
  <br />

![다른 사용자와 채팅](https://github.com/user-attachments/assets/e98a0a48-f0e7-4f55-841b-b645fb037475)
</details>

<br/>

## 🧩 API 명세서
[👉 API 명세서 바로가기](https://api.taptoon.site/swagger-ui/index.html)

<br/>

## ⚡ 주요 기능

### 📁 포트폴리오 등록
* 사용자는 마이 페이지에서 개인의 역량을 나타낼 수 있는 포트폴리오를 작성할 수 있습니다.
* 포트폴리오는 글, 그림 모두 가능합니다.
* 포트폴리오는 최대 5개 까지 작성 가능합니다.(이상은 VIP 서비스 예정)
* 포트폴리오에 이미지는 최대 3개까지만 첨부할 수 있습니다.

<br/>

### 📝 매칭 포스트 (구인 글)
* 사용자는 원하는 파트너를 구인하는 글을 작성할 수 있습니다.
* 구인하는 글에는 본인을 간략히 나타낼 만한 그림/글을 첨부할 수 있습니다.
* 구인하는 글의 제목이나 내용으로 검색할 수 있습니다.
  * 구인 글 검색은 자동완성 기능을 지원합니다.
  * 구인 글은 여러 조건으로 검색이 가능합니다.

<br/>

### 🗣️ 채팅
* 사용자는 원하는 파트너와 컨택하기 위해 채팅을 진행할 수 있습니다.
* 채팅은 1:1 채팅으로 진행하고, 이미지 전송 또한 지원합니다.

<br/>

## 🪵 Dev log
* [📌 Elasticsearch 클러스터링 적용기 🔥](/devlog/강성욱/elasticsearch_고가용성을_위한_클러스터링_적용기.md)
* [📌 Elasticsearch 적용기 📜](/devlog/강성욱/elasticsearch_고군분투_적용기.md)
* [📌 조회수 동시성 문제 해결 여정 🔮](/devlog/강성욱/조회수_동시성_문제_해결_여정.md)
* [📌 인덱스 최적화로 검색 API 성능 개선하기 🕵️‍♂️](/devlog/강성욱/인덱스를_활용한_검색_속도_향상_여정.md)
* [📌 CI/CD 개발노트 🚀](devlog/김창현/개발노트-CI,CD.md)
* [📌 이미지 개발노트 🤝](devlog/김창현/개발노트-이미지.md)
* [📌 인증/인가 개발노트 ✨](devlog/김창현/개발노트-인증,인가.md)
* [📌 WebSocket과 Redis의 역할과 흐름 🚀](/devlog/이진영/WebSocket과_Redis의_역할과_흐름.md)
* [📌 데이터베이스에 따른 채팅 보내기 읽기 속도 비교 📩](/devlog/이진영/데이터베이스에_따른_채팅_보내기_읽기_속도_비교.md)
* [📌 채팅 기술스택 선택 과정 💬](/devlog/이진영/채팅_기술스택_선택_과정.md)
* [📌 개발노트-댓글 📝](/devlog/이상구/개발노트-댓글.md)
* [📌 개발노트-포트폴리오 🎭](/devlog/이상구/개발노트-포트폴리오.md)
