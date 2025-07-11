# ✅ 인증 서버 구축 로드맵

## 📌 1단계: 기본 회원 가입/로그인 기능
- 회원가입 API (POST /users/signup)
- 로그인 API (POST /auth/login)
  - 이메일 + 비밀번호 검증
  - JWT 발급 (Access + Refresh 토큰)

## 📌 2단계: JWT 기반 인증 및 보호 라우팅
- WT 발급 및 검증
- @UseGuards(AuthGuard) 설정
- 유저 정보 추출 (@Req(), @User() 데코레이터 등)

## 📌 3단계: 리프레시 토큰 관리
- Access/Refresh 토큰 분리
- Refresh 토큰 재발급 API
- 로그아웃 시 토큰 무효화

## 📌 4단계: 이메일 인증 및 비밀번호 초기화
- 이메일 인증 코드 발급 및 검증
- 비밀번호 초기화 요청 및 처리

## 📌 5단계: 역할 기반 인증
- roles 테이블 구성
- @Roles() 데코레이터 + RolesGuard

---

## 📌 환경 설정 파일 예시 {projectRootDir}/my.env
```sh
# JWT
JWT_SECRET=mySuperSecretKey123!
JWT_EXPIRES_IN=1h
# DB
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=myuser
DB_PASSWORD=mypassword
DB_NAME=auth
```