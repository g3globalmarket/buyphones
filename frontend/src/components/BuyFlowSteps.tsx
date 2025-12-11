import "./BuyFlowSteps.css";

interface BuyFlowStepsProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

const STEP_INFO = [
  {
    number: 1,
    title: "기기 종류 선택",
    desc: "판매할 기기 종류를 선택하세요",
  },
  {
    number: 2,
    title: "모델 · 색상 선택 및 매입가 확인",
    desc: "모델, 저장 용량, 색상을 선택하고 매입가를 확인하세요",
  },
  {
    number: 3,
    title: "고객 · 기기 정보 입력",
    desc: "고객 정보와 기기 정보를 입력하세요",
  },
  {
    number: 4,
    title: "사진 업로드",
    desc: "제품 사진을 업로드하세요",
  },
  {
    number: 5,
    title: "요약 확인 및 신청",
    desc: "정보를 확인하고 신청을 완료하세요",
  },
];

const BuyFlowSteps = ({ currentStep }: BuyFlowStepsProps) => {
  return (
    <aside className="pb-steps-sidebar">
      {STEP_INFO.map((step) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <div
            key={step.number}
            className={`pb-step ${isActive ? "pb-step--active" : ""} ${
              isCompleted ? "pb-step--completed" : ""
            }`}
          >
            <div className="pb-step-number">
              {isCompleted ? (
                <span className="pb-step-checkmark">✓</span>
              ) : (
                step.number
              )}
            </div>
            <div className="pb-step-content">
              <div className="pb-step-title">{step.title}</div>
              <div className="pb-step-desc">{step.desc}</div>
            </div>
          </div>
        );
      })}
    </aside>
  );
};

export default BuyFlowSteps;
