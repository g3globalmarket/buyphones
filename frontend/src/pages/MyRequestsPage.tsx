import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BuyRequest, UpdateMyRequestDto } from "../types";
import { meApi } from "../api/me";
import { getUserToken } from "../auth/authStore";
import { STATUS_LABELS } from "../constants/statusLabels";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { getErrorMessage } from "../api/errors";
import "./MyRequestsPage.css";

const MyRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BuyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageLimit] = useState(20);
  const [editing, setEditing] = useState<Record<string, UpdateMyRequestDto>>(
    {}
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, currentPage]);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await meApi.getMyRequests(currentPage, pageLimit);
      setRequests(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      // 401 is handled by apiClient interceptor
      if (err?.response?.status !== 401) {
        setError("신청 내역을 불러오는데 실패했습니다.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (requestId: string) => {
    const token = getUserToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const edit = editing[requestId];
    if (!edit) return;

    try {
      setSavingId(requestId);
      setSaveError(null);
      setSaveMessage(null);

      const payload: UpdateMyRequestDto = {
        bankName: edit.bankName?.trim() || undefined,
        bankAccount: edit.bankAccount?.trim() || undefined,
        bankHolder: edit.bankHolder?.trim() || undefined,
        shippingMethod: edit.shippingMethod?.trim() || undefined,
        shippingTrackingCode: edit.shippingTrackingCode?.trim() || undefined,
        shippingTrackingUrl: edit.shippingTrackingUrl?.trim() || undefined,
      };

      const updated = await meApi.updateMyRequest(requestId, payload);

      // Update local list of requests
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? updated : r))
      );

      // Clear editing state for this request
      setEditing((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });

      setSaveMessage("정보가 저장되었습니다.");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveError(getErrorMessage(err));
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSavingId(null);
    }
  };

  const handleChange = (
    requestId: string,
    field: keyof UpdateMyRequestDto,
    value: string
  ) => {
    setEditing((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {
          bankName: "",
          bankAccount: "",
          bankHolder: "",
          shippingMethod: "",
          shippingTrackingCode: "",
          shippingTrackingUrl: "",
        }),
        [field]: value,
      },
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const getStatusLabel = (status: BuyRequest["status"]) => {
    return STATUS_LABELS[status];
  };

  const getStatusBadgeClass = (status: BuyRequest["status"]) => {
    const classes: Record<BuyRequest["status"], string> = {
      pending: "status-badge--pending",
      approved: "status-badge--approved",
      rejected: "status-badge--rejected",
      paid: "status-badge--paid",
      cancelled: "status-badge--cancelled",
    };
    return classes[status];
  };

  const handleCancelRequest = async (request: BuyRequest) => {
    if (!window.confirm("이 신청을 취소하시겠어요?")) return;
    const token = getUserToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      setIsActionLoading(request._id);
      const updated = await meApi.cancelMyRequest(request._id);
      setRequests((prev) =>
        prev.map((r) => (r._id === request._id ? updated : r))
      );
    } catch (error: any) {
      // 401 is handled by apiClient interceptor
      if (error?.response?.status !== 401) {
        alert(getErrorMessage(error));
      }
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteRequest = async (request: BuyRequest) => {
    if (
      !window.confirm(
        "내 목록에서 이 신청을 삭제하시겠어요?\n(관리자 기록은 유지될 수 있습니다.)"
      )
    )
      return;
    const token = getUserToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      setIsActionLoading(request._id);
      await meApi.deleteMyRequest(request._id);
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
    } catch (error: any) {
      // 401 is handled by apiClient interceptor
      if (error?.response?.status !== 401) {
        alert(getErrorMessage(error));
      }
    } finally {
      setIsActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="my-requests-page">
        <div className="my-requests-inner">
          <div className="my-requests-header">
            <div className="my-requests-header-left">
              <h1 className="my-requests-title">내 매입 신청</h1>
              <p className="my-requests-subtitle">
                신청 상태, 입금 및 배송 진행 상황을 한눈에 확인하세요.
              </p>
            </div>
          </div>
          <div className="pb-myreq-loading">
            <LoadingSkeleton lines={4} />
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalRequests = requests.length;
  const activeRequests = requests.filter(
    (r) => r.status === "approved" || r.status === "pending"
  ).length;
  const paidRequests = requests.filter((r) => r.status === "paid").length;

  return (
    <div className="my-requests-page">
      <div className="my-requests-inner">
        <div className="my-requests-header">
          <div className="my-requests-header-left">
            <h1 className="my-requests-title">내 매입 신청</h1>
            <p className="my-requests-subtitle">
              신청 상태, 입금 및 배송 진행 상황을 한눈에 확인하세요.
            </p>
          </div>
          {totalRequests > 0 && (
            <div className="my-requests-header-right">
              <span className="my-requests-summary-chip">
                총 {totalRequests}건
              </span>
              <span className="my-requests-summary-chip">
                진행 중 {activeRequests}건
              </span>
              <span className="my-requests-summary-chip">
                입금 완료 {paidRequests}건
              </span>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {!loading && !error && requests.length === 0 ? (
          <div className="pb-myreq-empty">
            <p className="pb-myreq-empty-title">아직 신청 내역이 없습니다.</p>
            <p className="pb-myreq-empty-text">
              첫 번째 매입 신청을 만들어보세요. 아이폰, PS5, 스위치 등을 편하게
              판매하실 수 있어요.
            </p>
            <Link to="/" className="pb-myreq-empty-button">
              매입 신청하러 가기
            </Link>
          </div>
        ) : !loading && !error && requests.length > 0 ? (
          <div className="my-requests-list">
            {requests.map((request) => {
              const isPaid = request.status === "paid";
              const isFinalStatus = isPaid;
              const isApproved = request.status === "approved";
              const canEdit = isApproved && !isPaid;
              const canCancel =
                request.status === "pending" || request.status === "approved";
              const canDelete =
                request.status === "pending" ||
                request.status === "rejected" ||
                request.status === "cancelled";
              const edit = editing[request._id] ?? {
                bankName: request.bankName || "",
                bankAccount: request.bankAccount || "",
                bankHolder: request.bankHolder || "",
                shippingMethod: request.shippingMethod || "",
                shippingTrackingCode: request.shippingTrackingCode || "",
                shippingTrackingUrl: request.shippingTrackingUrl || "",
              };

              // Calculate submission status for approved requests
              // If status is final (paid), mark all steps as done
              const hasBankInfo =
                isFinalStatus ||
                !!(
                  request.bankName &&
                  request.bankAccount &&
                  request.bankHolder
                );
              const hasShippingInfo =
                isFinalStatus ||
                !!(
                  request.shippingMethod &&
                  request.shippingTrackingCode &&
                  request.shippingTrackingUrl
                );

              // Format submission date if present
              const submittedAt = request.shippingSubmittedAt
                ? new Date(request.shippingSubmittedAt)
                : null;

              // Calculate if form is dirty (has changes compared to original)
              const isDirty =
                (edit.bankName ?? "") !== (request.bankName ?? "") ||
                (edit.bankAccount ?? "") !== (request.bankAccount ?? "") ||
                (edit.bankHolder ?? "") !== (request.bankHolder ?? "") ||
                (edit.shippingMethod ?? "") !==
                  (request.shippingMethod ?? "") ||
                (edit.shippingTrackingCode ?? "") !==
                  (request.shippingTrackingCode ?? "") ||
                (edit.shippingTrackingUrl ?? "") !==
                  (request.shippingTrackingUrl ?? "");

              // Calculate if form has any data
              const hasAnyData = !!(
                edit.bankName ||
                edit.bankAccount ||
                edit.bankHolder ||
                edit.shippingMethod ||
                edit.shippingTrackingCode ||
                edit.shippingTrackingUrl
              );

              // Bank validation: if any bank field is filled, all three must be filled
              const hasAnyBankField = !!(
                edit.bankName ||
                edit.bankAccount ||
                edit.bankHolder
              );

              const isBankValid =
                !hasAnyBankField ||
                (!!edit.bankName && !!edit.bankAccount && !!edit.bankHolder);

              // Shipping validation: if any shipping field is filled, method + trackingCode must be filled
              const hasAnyShippingField = !!(
                edit.shippingMethod ||
                edit.shippingTrackingCode ||
                edit.shippingTrackingUrl
              );

              const isShippingValid =
                !hasAnyShippingField ||
                (!!edit.shippingMethod && !!edit.shippingTrackingCode);

              const isExpanded = expandedId === request._id;

              return (
                <div
                  key={request._id}
                  className="pb-myreq-card my-requests-card app-card app-card--hoverable"
                >
                  <div className="pb-myreq-header">
                    <div className="pb-myreq-device">
                      {request.modelName}
                      {request.storageGb && ` ${request.storageGb}GB`}
                      {request.color && ` · ${request.color}`}
                    </div>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className="pb-myreq-meta">
                    <div className="pb-myreq-meta-item">
                      <span className="pb-myreq-meta-label">신청일</span>
                      <span className="pb-myreq-meta-value">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    <div className="pb-myreq-meta-item">
                      <span className="pb-myreq-meta-label">예상 매입가</span>
                      <span className="pb-myreq-meta-value">
                        {formatPrice(request.finalPrice ?? request.buyPrice)}원
                      </span>
                    </div>
                  </div>

                  {request.photoUrls?.length ? (
                    <div className="pb-myreq-photos">
                      사진 {request.photoUrls.length}장 업로드됨
                    </div>
                  ) : null}

                  {(canCancel || canDelete || canEdit) && (
                    <div className="pb-myreq-actions">
                      {canCancel && (
                        <button
                          type="button"
                          className="pb-myreq-action-button pb-myreq-action-button--cancel"
                          disabled={isActionLoading === request._id}
                          onClick={() => handleCancelRequest(request)}
                        >
                          신청 취소
                        </button>
                      )}

                      {canEdit && (
                        <button
                          type="button"
                          className="pb-myreq-action-button pb-myreq-action-button--edit"
                          onClick={() => setExpandedId(request._id)}
                        >
                          입금/배송 정보 수정
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className="pb-myreq-action-button pb-myreq-action-button--delete"
                          disabled={isActionLoading === request._id}
                          onClick={() => handleDeleteRequest(request)}
                        >
                          내 목록에서 삭제
                        </button>
                      )}
                    </div>
                  )}

                  {/* Keep existing stepper and expandable details */}
                  <div className="card-body">
                    {/* Stepper Timeline */}
                    <div className="my-requests-stepper">
                      <div
                        className={`my-requests-step ${
                          request.status !== "pending"
                            ? "my-requests-step--done"
                            : ""
                        }`}
                      >
                        <div className="my-requests-step-circle">1</div>
                        <div className="my-requests-step-label">검수/승인</div>
                      </div>
                      <div className="my-requests-step-line" />
                      <div
                        className={`my-requests-step ${
                          hasBankInfo ? "my-requests-step--done" : ""
                        }`}
                      >
                        <div className="my-requests-step-circle">2</div>
                        <div className="my-requests-step-label">입금정보</div>
                      </div>
                      <div className="my-requests-step-line" />
                      <div
                        className={`my-requests-step ${
                          hasShippingInfo ? "my-requests-step--done" : ""
                        }`}
                      >
                        <div className="my-requests-step-circle">3</div>
                        <div className="my-requests-step-label">기기 발송</div>
                      </div>
                      <div className="my-requests-step-line" />
                      <div
                        className={`my-requests-step ${
                          isFinalStatus ? "my-requests-step--done" : ""
                        }`}
                      >
                        <div className="my-requests-step-circle">4</div>
                        <div className="my-requests-step-label">입금 완료</div>
                      </div>
                    </div>

                    {/* Shipping Address Block - Show after approval */}
                    {isApproved && request.shippingInfo
                      ? (() => {
                          const shippingInfo = request.shippingInfo;
                          return (
                            <div className="shipping-info-block">
                              <div className="shipping-info-header">
                                <h3 className="shipping-info-title">
                                  배송 주소 (기기 발송지)
                                </h3>
                              </div>
                              <div className="shipping-info-content">
                                <div className="shipping-info-row">
                                  <div className="shipping-info-item">
                                    <span className="shipping-info-label">
                                      수령인
                                    </span>
                                    <span className="shipping-info-value">
                                      {shippingInfo.recipientName}
                                    </span>
                                  </div>
                                  <div className="shipping-info-item">
                                    <span className="shipping-info-label">
                                      연락처
                                    </span>
                                    <span className="shipping-info-value">
                                      {shippingInfo.phone}
                                    </span>
                                    <button
                                      type="button"
                                      className="shipping-info-copy-btn"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(
                                            shippingInfo.phone
                                          );
                                          alert("연락처가 복사되었습니다.");
                                        } catch (err) {
                                          console.error("Failed to copy:", err);
                                          alert("복사에 실패했습니다.");
                                        }
                                      }}
                                      title="연락처 복사"
                                    >
                                      복사
                                    </button>
                                  </div>
                                </div>
                                <div className="shipping-info-address">
                                  <div className="shipping-info-address-line">
                                    {shippingInfo.postalCode && (
                                      <span>[{shippingInfo.postalCode}] </span>
                                    )}
                                    {shippingInfo.address1}
                                  </div>
                                  {shippingInfo.address2 && (
                                    <div className="shipping-info-address-line">
                                      {shippingInfo.address2}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    className="shipping-info-copy-btn shipping-info-copy-btn--address"
                                    onClick={async () => {
                                      try {
                                        const fullAddress = [
                                          shippingInfo.postalCode &&
                                            `[${shippingInfo.postalCode}]`,
                                          shippingInfo.address1,
                                          shippingInfo.address2,
                                        ]
                                          .filter(Boolean)
                                          .join(" ");
                                        await navigator.clipboard.writeText(
                                          fullAddress
                                        );
                                        alert("주소가 복사되었습니다.");
                                      } catch (err) {
                                        console.error("Failed to copy:", err);
                                        alert("복사에 실패했습니다.");
                                      }
                                    }}
                                    title="주소 복사"
                                  >
                                    주소 복사
                                  </button>
                                </div>
                                {shippingInfo.note && (
                                  <div className="shipping-info-note">
                                    <span className="shipping-info-note-label">
                                      안내사항:
                                    </span>
                                    <span className="shipping-info-note-text">
                                      {shippingInfo.note}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      : null}
                  </div>

                  <div className="card-details-toggle">
                    <button
                      type="button"
                      className="app-btn-outline card-details-toggle-button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : request._id)
                      }
                    >
                      {isExpanded ? "상세 정보 숨기기" : "상세 정보 보기"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="card-details">
                      {(isApproved || isPaid) && (
                        <>
                          <div className="my-requests-badge-group">
                            <span
                              className={`my-requests-badge ${
                                hasBankInfo
                                  ? "my-requests-badge--success"
                                  : "my-requests-badge--pending"
                              }`}
                            >
                              {hasBankInfo
                                ? "입금정보 제출완료"
                                : "입금정보 미제출"}
                            </span>
                            <span
                              className={`my-requests-badge ${
                                hasShippingInfo
                                  ? "my-requests-badge--success"
                                  : "my-requests-badge--pending"
                              }`}
                            >
                              {hasShippingInfo
                                ? "배송정보 제출완료"
                                : "배송정보 미제출"}
                            </span>
                          </div>

                          {submittedAt && (
                            <div className="my-requests-submitted-at">
                              <span className="my-requests-submitted-at-icon">
                                ⏰
                              </span>
                              정보 제출일:{" "}
                              {submittedAt.toLocaleString("ko-KR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}

                          {isPaid && (
                            <div className="my-requests-paid-info">
                              <span className="my-requests-paid-info-icon">
                                ✅
                              </span>
                              입금이 완료되었습니다. 이용해 주셔서 감사합니다.
                            </div>
                          )}
                        </>
                      )}

                      {request.adminNotes && (
                        <div className="admin-notes">
                          <strong>관리자 안내:</strong>
                          <p>{request.adminNotes}</p>
                        </div>
                      )}

                      {canEdit && (
                        <>
                          <div className="myreq-edit-block">
                            <div className="myreq-field">
                              <label className="myreq-label">은행명</label>
                              <input
                                type="text"
                                className="myreq-input"
                                value={edit.bankName ?? ""}
                                onChange={(e) =>
                                  handleChange(
                                    request._id,
                                    "bankName",
                                    e.target.value
                                  )
                                }
                                placeholder="예: 국민은행"
                              />
                            </div>

                            <div className="myreq-field">
                              <label className="myreq-label">계좌번호</label>
                              <input
                                type="text"
                                className="myreq-input"
                                value={edit.bankAccount ?? ""}
                                onChange={(e) =>
                                  handleChange(
                                    request._id,
                                    "bankAccount",
                                    e.target.value
                                  )
                                }
                                placeholder="예: 123456-78-901234"
                              />
                            </div>

                            <div className="myreq-field">
                              <label className="myreq-label">예금주</label>
                              <input
                                type="text"
                                className="myreq-input"
                                value={edit.bankHolder ?? ""}
                                onChange={(e) =>
                                  handleChange(
                                    request._id,
                                    "bankHolder",
                                    e.target.value
                                  )
                                }
                                placeholder="예금주명"
                              />
                            </div>

                            {!isBankValid && (
                              <div className="my-requests-error">
                                <span className="my-requests-error-icon">
                                  ⚠️
                                </span>
                                은행 정보는 은행명, 계좌번호, 예금주를 모두
                                입력해야 합니다.
                              </div>
                            )}

                            <div className="myreq-field">
                              <label className="myreq-label">발송 방법</label>
                              <input
                                type="text"
                                className="myreq-input"
                                placeholder="예: 택배 / 편의점택배 / 퀵 / 직접 방문"
                                value={edit.shippingMethod ?? ""}
                                onChange={(e) =>
                                  handleChange(
                                    request._id,
                                    "shippingMethod",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="myreq-field">
                              <label className="myreq-label">운송장 번호</label>
                              <input
                                type="text"
                                className="myreq-input"
                                value={edit.shippingTrackingCode ?? ""}
                                onChange={(e) =>
                                  handleChange(
                                    request._id,
                                    "shippingTrackingCode",
                                    e.target.value
                                  )
                                }
                                placeholder="운송장 번호를 입력하세요"
                              />
                            </div>

                            <div className="myreq-field">
                              <label className="myreq-label">
                                배송 조회 링크 (선택)
                              </label>
                              <input
                                type="url"
                                className="myreq-input"
                                placeholder="https://..."
                                value={edit.shippingTrackingUrl ?? ""}
                                onChange={(e) =>
                                  handleChange(
                                    request._id,
                                    "shippingTrackingUrl",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            {!isShippingValid && (
                              <div className="my-requests-error">
                                <span className="my-requests-error-icon">
                                  ⚠️
                                </span>
                                배송 정보는 발송 방법과 운송장 번호를 모두
                                입력해야 합니다.
                              </div>
                            )}

                            {saveError && savingId === request._id && (
                              <div className="my-requests-error">
                                {saveError}
                              </div>
                            )}
                            {saveMessage && savingId === request._id && (
                              <div className="myreq-success">{saveMessage}</div>
                            )}
                          </div>

                          <div className="myreq-actions">
                            <button
                              className="myreq-save-button app-btn-primary"
                              disabled={
                                savingId === request._id ||
                                !isDirty ||
                                !hasAnyData ||
                                !isBankValid ||
                                !isShippingValid
                              }
                              onClick={() => handleSave(request._id)}
                            >
                              {savingId === request._id
                                ? "저장 중..."
                                : "정보 저장"}
                            </button>
                            <button
                              className="myreq-cancel-button app-btn-outline"
                              onClick={() => {
                                setEditing((prev) => {
                                  const next = { ...prev };
                                  delete next[request._id];
                                  return next;
                                });
                              }}
                            >
                              취소
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {!loading && totalPages > 1 && (
          <div className="pb-myreq-pagination">
            <button
              type="button"
              className="pb-myreq-pagination-button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              이전
            </button>
            <span className="pb-myreq-pagination-info">
              페이지 {currentPage} / {totalPages} (총 {totalCount}건)
            </span>
            <button
              type="button"
              className="pb-myreq-pagination-button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequestsPage;
