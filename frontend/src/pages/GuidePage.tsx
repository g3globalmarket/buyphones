import React from "react";
import "./GuidePage.css";

export const GuidePage: React.FC = () => {
  return (
    <div className="page page--guide">
      <header className="page-header">
        <h1 className="page-title">기기 매입 안내</h1>
        <p className="page-subtitle">
          아이폰 17 시리즈, PS5, 닌텐도 스위치를 안전하게 매입받기 위한 기본
          조건과 진행 절차를 안내드립니다.
        </p>
      </header>

      <section className="guide-section">
        <h2>1. 매입 대상 기기</h2>
        <ul>
          <li>
            아이폰 17 / 아이폰 17 플러스 / 아이폰 17 프로 / 아이폰 17 프로 맥스
          </li>
          <li>PlayStation 5 (디스크 / 디지털 / 슬림)</li>
          <li>닌텐도 스위치 (OLED / 일반 / 라이트)</li>
        </ul>
        <p className="guide-note">
          위 기기 중 한국 정발·자급제·미개봉 상태인 제품만 접수 가능합니다.
        </p>
      </section>

      <section className="guide-section">
        <h2>2. 필수 조건</h2>
        <ul>
          <li>
            <strong>한국 정발 제품</strong>만 매입합니다. (병행수입/해외판 불가)
          </li>
          <li>
            <strong>자급제 기기</strong>만 가능합니다. (통신사 약정·할부 기기
            불가)
          </li>
          <li>
            <strong>완전 미개봉</strong> 상태여야 합니다. (비닐/씰 훼손, 개봉
            흔적이 있을 경우 중고로 분류)
          </li>
          <li>분실·도난·회수 대상 기기는 절대 매입하지 않습니다.</li>
        </ul>
      </section>

      <section className="guide-section">
        <h2>3. 진행 절차</h2>
        <ol>
          <li>
            <strong>온라인 신청</strong> – 사이트에서 기기, 용량, 색상, 상태,
            IMEI/시리얼, 영수증 여부, 계좌 정보를 입력합니다.
          </li>
          <li>
            <strong>1차 자동 견적 확인</strong> – 선택하신 옵션을 기준으로 예상
            매입 금액이 안내됩니다.
          </li>
          <li>
            <strong>관리자 검토</strong> – 사진과 정보를 검토한 후 승인/보류
            여부를 안내드립니다.
          </li>
          <li>
            <strong>제품 발송</strong> – 안내 드린 방법(택배/퀵/직접 방문)에
            따라 제품을 보내주시면 됩니다.
          </li>
          <li>
            <strong>실물 검수 및 입금</strong> – 실물 상태와 정보가 일치할 경우
            최종 금액 확정 후 계좌로 입금됩니다.
          </li>
        </ol>
      </section>

      <section className="guide-section">
        <h2>4. 매입이 거절되거나 금액이 조정될 수 있는 경우</h2>
        <ul>
          <li>실제 모델, 용량, 색상이 신청하신 정보와 다른 경우</li>
          <li>미개봉이 아닌 경우 (박스 개봉, 사용 흔적, 보호필름 제거 등)</li>
          <li>한국 정발·자급제가 아닌 경우 (해외판, 통신사 할부 기기 등)</li>
          <li>분실·도난·회수 대상 기기로 확인되는 경우</li>
          <li>기타 고의적인 허위 정보 기재가 의심되는 경우</li>
        </ul>
      </section>

      <section className="guide-section">
        <h2>5. 견적 안내에 대한 안내</h2>
        <p>
          사이트에서 안내되는 금액은{" "}
          <strong>신청하신 정보가 모두 정확하다는 전제</strong> 하에 산출된 예상
          금액입니다. 실제 검수 결과와 차이가 있을 경우, 새로운 금액을
          안내드리며 동의하지 않으실 경우 제품은 반송 처리됩니다. (반송 시
          배송비 정책은 공지 기준을 따릅니다.)
        </p>
      </section>

      <section className="guide-section">
        <h2>6. 문의</h2>
        <p>
          별도 문의가 필요하신 경우, 사이트 하단의 연락처 또는 안내된 채널로
          문의해 주세요. (카카오톡, 이메일 등 실제 운영 방식에 맞게 추후 보완
          가능합니다.)
        </p>
      </section>
    </div>
  );
};

export default GuidePage;
