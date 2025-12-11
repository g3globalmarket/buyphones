# 전자제품 매입 서비스 MVP

한국 정발, 자급제, 미개봉 전자제품을 매입하는 웹 서비스입니다.

## 지원 기기

- **iPhone 17 시리즈** (17 / 17 Plus / 17 Pro / 17 Pro Max)
- **PlayStation 5** (최신 모델)
- **Nintendo Switch** (최신 세대, OLED 또는 최신 리비전)

## 필수 조건

- ✅ **한국 정발** (한국 정식 발매 제품)
- ✅ **자급제** (SIM-free, 통신사 계약 없음)
- ✅ **미개봉** (공장 밀봉, 개봉 이력 없음)

## 기술 스택

### Backend

- NestJS + TypeScript
- MongoDB + Mongoose
- RESTful API

### Frontend

- React + TypeScript
- Vite
- React Router

### Package Manager

- pnpm

## 프로젝트 구조

```
ProjectByu/
├── backend/          # NestJS 백엔드
│   ├── src/
│   │   ├── model-prices/    # 모델 가격 관리
│   │   ├── buy-requests/    # 매입 신청 관리
│   │   └── main.ts
│   └── package.json
├── frontend/         # React 프론트엔드
│   ├── src/
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── api/            # API 클라이언트
│   │   └── types/          # TypeScript 타입
│   └── package.json
└── README.md
```

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- MongoDB (로컬 또는 원격)
- pnpm (또는 npm)

### Backend 설정

```bash
cd backend
pnpm install

# 환경 변수 설정
# .env.example 파일을 .env로 복사하고 실제 값으로 수정
cp .env.example .env
# .env 파일을 열어서 필요한 값들을 설정하세요 (특히 JWT_SECRET, CODE_SECRET, ADMIN_TOKEN)

pnpm start:dev
```

Backend는 기본적으로 `http://localhost:3000`에서 실행됩니다.

**중요:** 프로덕션 환경에서는 반드시 `.env` 파일의 다음 값들을 변경하세요:

- `JWT_SECRET`: 강력한 랜덤 시크릿 (예: `openssl rand -base64 32`)
- `CODE_SECRET`: 강력한 랜덤 시크릿
- `ADMIN_TOKEN`: 강력한 랜덤 토큰
- `MONGODB_URI`: 프로덕션 MongoDB 연결 문자열
- `FRONTEND_URL`: 프로덕션 프론트엔드 URL

### Frontend 설정

```bash
cd frontend
pnpm install

# 환경 변수 설정 (선택사항)
# .env.example 파일을 .env.local로 복사하고 필요한 값만 수정
cp .env.example .env.local
# .env.local 파일을 열어서 VITE_API_URL 등을 설정하세요

pnpm dev
```

Frontend는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 주요 기능

### 공개 UI (Public UI)

- 사용자가 매입 신청을 제출할 수 있는 폼
- 지원 기기 목록 및 가격 확인
- 한국 정발/자급제/미개봉 조건 안내
- 이메일 기반 로그인 (인증 코드 발송)

### 관리자 UI (Admin UI)

- 매입 신청 관리 (승인/거절/완료 처리)
- 모델 가격 관리 (생성/수정/삭제)
- 신청 상태별 필터링
- 관리자 계정 관리 (최고 관리자만)

### 인증 시스템

- **사용자 인증**: 이메일 기반 인증 코드 로그인
  - 인증 코드는 이메일로 발송 (SMTP 또는 콘솔 로그)
  - 코드 재요청 쿨다운: 60초 (기본값, 환경 변수로 조정 가능)
  - 코드 유효 기간: 10분
- **관리자 인증**: JWT 기반 로그인 (아이디 + 비밀번호)
  - 역할 기반 접근 제어 (super_admin, admin)
  - 레거시 토큰 인증도 지원 (하위 호환성)

## API 엔드포인트

### Authentication

- `POST /auth/request-code` - 로그인 코드 요청 (이메일로 발송)
  - 쿨다운: 60초 (기본값, `AUTH_REQUEST_CODE_COOLDOWN_SECONDS`로 조정)
  - 429 Too Many Requests: 쿨다운 중일 때 반환
- `POST /auth/verify-code` - 인증 코드 검증 및 로그인

### Model Prices

- `GET /model-prices` - 모든 가격 조회 (activeOnly 쿼리 파라미터 지원)
- `GET /model-prices/:id` - 특정 가격 조회
- `POST /model-prices` - 새 가격 생성
- `PATCH /model-prices/:id` - 가격 수정
- `DELETE /model-prices/:id` - 가격 삭제

### Buy Requests

- `GET /buy-requests` - 모든 신청 조회 (status 쿼리 파라미터 지원)
- `GET /buy-requests/:id` - 특정 신청 조회
- `POST /buy-requests` - 새 신청 생성
- `PATCH /buy-requests/:id` - 신청 상태 업데이트
- `DELETE /buy-requests/:id` - 신청 삭제

## 데이터 모델

### ModelPrice

- `category`: "iphone" | "ps5" | "switch"
- `modelCode`: 내부 모델 코드
- `modelName`: 사용자용 모델 이름
- `storageGb`: 저장 용량 (선택)
- `color`: 색상 (선택)
- `buyPrice`: 매입가 (KRW)
- `isActive`: 활성화 여부

### BuyRequest

- `customerName`, `customerPhone`, `customerEmail`: 고객 정보
- `modelPriceId`: 참조하는 ModelPrice ID
- `status`: "pending" | "approved" | "rejected" | "paid" | "cancelled"
- `notes`: 고객 메모
- `adminNotes`: 관리자 메모

## 개발 참고사항

- Backend와 Frontend는 별도로 실행됩니다
- CORS는 개발 환경에서 `http://localhost:5173`으로 설정되어 있습니다
- 프로덕션 환경에서는 환경 변수를 적절히 설정하세요

## 프로덕션 배포

### 환경 변수 설정

#### Backend

`backend/.env.example` 파일을 참고하여 `backend/.env` 파일을 생성하고 다음 변수들을 설정하세요:

**필수 변수 (프로덕션에서 반드시 변경):**

- `JWT_SECRET`: 강력한 랜덤 시크릿 (예: `openssl rand -base64 32`)
- `CODE_SECRET`: 강력한 랜덤 시크릿
- `ADMIN_TOKEN`: 강력한 랜덤 토큰
- `MONGODB_URI`: 프로덕션 MongoDB 연결 문자열
- `FRONTEND_URL`: 프로덕션 프론트엔드 URL (예: `https://yourdomain.com`)
- `NODE_ENV=production`

**이메일 설정 (프로덕션):**

- `EMAIL_MODE`: `console` (개발) 또는 `smtp` (프로덕션)
- `EMAIL_FROM`: 발신자 이메일 주소 (예: `no-reply@yourdomain.com`)
- `EMAIL_SMTP_HOST`: SMTP 서버 호스트 (예: `smtp.gmail.com`)
- `EMAIL_SMTP_PORT`: SMTP 포트 (일반적으로 587 또는 465)
- `EMAIL_SMTP_USER`: SMTP 사용자명
- `EMAIL_SMTP_PASS`: SMTP 비밀번호 또는 앱 비밀번호
- `APP_URL`: 프론트엔드 URL (이메일 템플릿의 링크에 사용, 예: `https://yourdomain.com`)

**선택 변수:**

- `PORT`: 서버 포트 (기본값: 3000)
- `THROTTLE_TTL`: Rate limiting 시간 창 (초, 기본값: 60)
- `THROTTLE_LIMIT`: Rate limiting 최대 요청 수 (기본값: 20)
- `AUTH_REQUEST_CODE_COOLDOWN_SECONDS`: 로그인 코드 재요청 쿨다운 (초, 기본값: 60)

#### Frontend

`frontend/.env.example` 파일을 참고하여 `frontend/.env` 파일을 생성하고 다음 변수들을 설정하세요:

- `VITE_API_URL`: 백엔드 API URL (예: `https://api.yourdomain.com`)
- `VITE_INACTIVITY_TIMEOUT_MINUTES`: 자동 로그아웃 시간 (분, 기본값: 30)
- `VITE_INACTIVITY_WARNING_MINUTES`: 경고 표시 시간 (분, 기본값: 5)

### Backend 실행

```bash
cd backend
pnpm install
pnpm build
NODE_ENV=production pnpm start:prod
```

또는 PM2를 사용:

```bash
pm2 start dist/main.js --name buyphones-backend
```

### Frontend 빌드 및 배포

```bash
cd frontend
pnpm install
pnpm build
```

빌드된 파일은 `frontend/dist/` 디렉토리에 생성됩니다. 이 디렉토리를 Nginx나 다른 정적 파일 서버로 제공하세요.

**Nginx 예시 설정:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend static files
    root /path/to/frontend/dist;
    index index.html;

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads proxy (if serving through Nginx)
    location /uploads {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Health Check

백엔드는 `/health` 엔드포인트를 제공합니다. 로드 밸런서나 모니터링 시스템에서 사용할 수 있습니다:

```bash
curl http://localhost:3000/health
```

응답 예시:

```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "state": 1
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 보안 고려사항

- ✅ Helmet을 통한 보안 헤더 설정
- ✅ CORS는 `FRONTEND_URL` 환경 변수로 제한
- ✅ Rate limiting 활성화 (인증 엔드포인트에 더 엄격한 제한)
- ✅ ValidationPipe에서 `forbidNonWhitelisted: true` 설정
- ✅ JSON body 크기 제한 (2MB)
- ✅ 파일 업로드 크기 제한 (5MB per file)
- ✅ Base64 데이터 URL 차단 (파일 업로드만 허용)

### 모니터링

- `/health` 엔드포인트를 사용하여 서버 및 데이터베이스 상태 확인
- 모든 요청에 `X-Request-Id` 헤더가 포함되어 로깅 및 추적 가능
- 에러 응답에는 `requestId`가 포함되어 디버깅 용이
