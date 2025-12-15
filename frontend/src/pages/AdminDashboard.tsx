import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ModelPrice, BuyRequest, BuyRequestStatus } from "../types";
import { modelPricesApi } from "../api/modelPrices";
import { buyRequestsApi } from "../api/buyRequests";
import { adminAuth } from "../utils/adminAuth";
import { getAdminAccessToken } from "../auth/adminAuthStorage";
import { STATUS_LABELS } from "../constants/statusLabels";
import PhotoModal from "../components/PhotoModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { getErrorMessage } from "../api/errors";
import { logoutAdmin } from "../auth/adminLogout";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // All hooks must be declared before any conditional returns
  const [activeTab, setActiveTab] = useState<"prices" | "requests">("requests");
  const [modelPrices, setModelPrices] = useState<ModelPrice[]>([]);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price management state
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ModelPrice | null>(null);
  const [priceFormData, setPriceFormData] = useState<Partial<ModelPrice>>({
    category: "iphone",
    modelCode: "",
    modelName: "",
    storageGb: undefined,
    color: "",
    buyPrice: 0,
    currency: "KRW",
    isActive: true,
  });

  // Request management state
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | BuyRequestStatus
  >("all");
  const [unauthorizedError, setUnauthorizedError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageLimit] = useState(20);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [modalPhotos, setModalPhotos] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);
  type ProgressFilter =
    | "all"
    | "noBank"
    | "noShipping"
    | "readyForPayout"
    | "paid";
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [editingRequests, setEditingRequests] = useState<
    Record<
      string,
      { finalPrice: number | ""; adminNotes: string; isSaving: boolean }
    >
  >({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savingRequestId, setSavingRequestId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(
    null
  );
  const [expandedAdminId, setExpandedAdminId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Helper function to check admin authentication (legacy token OR JWT)
  // Matches the logic in ProtectedAdminRoute
  const isAdminAuthenticated = (): boolean => {
    const legacyToken = adminAuth.getToken();
    const hasLegacy = !!legacyToken && String(legacyToken).trim().length > 0;
    const jwt = getAdminAccessToken();
    const hasJwt = !!jwt && jwt.trim().length > 0;
    return hasLegacy || hasJwt;
  };

  // Debounce search query
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Check authentication on mount - must be after all useState hooks
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin", { replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // Only load data if authenticated
    if (!isAdminAuthenticated()) {
      return;
    }
    if (activeTab === "prices") {
      loadModelPrices();
    } else {
      loadBuyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedStatus, debouncedSearch]);

  // Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  // Reload when page changes
  useEffect(() => {
    if (isAdminAuthenticated() && activeTab === "requests") {
      loadBuyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const loadModelPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const prices = await modelPricesApi.getAll(false);
      setModelPrices(prices);
    } catch (err) {
      setError("가격 정보를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBuyRequests = async () => {
    setLoading(true);
    setError(null);
    setUnauthorizedError(false);
    try {
      const statusParam =
        selectedStatus === "all"
          ? undefined
          : (selectedStatus as BuyRequestStatus);
      const result = await buyRequestsApi.getAll(
        statusParam,
        currentPage,
        pageLimit,
        debouncedSearch || undefined
      );
      setBuyRequests(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setUnauthorizedError(true);
        setError("관리자 토큰이 유효하지 않습니다. 다시 로그인해주세요.");
        adminAuth.removeToken();
        const isDev = import.meta.env.DEV;
        if (isDev) {
          console.warn("[AdminDashboard] Unauthorized (401)");
        }
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (request: BuyRequest, initialIndex: number = 0) => {
    if (request.photoUrls && request.photoUrls.length > 0) {
      setModalPhotos(request.photoUrls);
      setModalInitialIndex(initialIndex);
      setIsPhotoModalOpen(true);
    }
  };

  const closePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setModalPhotos([]);
    setModalInitialIndex(0);
  };

  const handleCreatePrice = async () => {
    try {
      await modelPricesApi.create(priceFormData as ModelPrice);
      setShowPriceForm(false);
      setPriceFormData({
        category: "iphone",
        modelCode: "",
        modelName: "",
        storageGb: undefined,
        color: "",
        buyPrice: 0,
        currency: "KRW",
        isActive: true,
      });
      loadModelPrices();
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdatePrice = async () => {
    if (!editingPrice) return;
    try {
      await modelPricesApi.update(editingPrice._id, priceFormData);
      setEditingPrice(null);
      setShowPriceForm(false);
      setPriceFormData({
        category: "iphone",
        modelCode: "",
        modelName: "",
        storageGb: undefined,
        color: "",
        buyPrice: 0,
        currency: "KRW",
        isActive: true,
      });
      loadModelPrices();
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleEditPrice = (price: ModelPrice) => {
    setEditingPrice(price);
    setPriceFormData({
      category: price.category,
      modelCode: price.modelCode,
      modelName: price.modelName,
      storageGb: price.storageGb,
      color: price.color,
      buyPrice: price.buyPrice,
      currency: price.currency,
      isActive: price.isActive,
    });
    setShowPriceForm(true);
  };

  const handleDeletePrice = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await modelPricesApi.delete(id);
      loadModelPrices();
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdateRequestStatus = async (
    id: string,
    status: BuyRequestStatus,
    adminNotes?: string
  ) => {
    try {
      await buyRequestsApi.update(id, { status, adminNotes });
      loadBuyRequests();
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      setMarkingPaidId(id);
      setError(null);
      await buyRequestsApi.markPaid(id);
      // Update local state to reflect the paid status
      setBuyRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status: "paid" } : req))
      );
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (
      !window.confirm(
        "이 신청을 삭제하시겠어요?\n삭제된 신청은 복구할 수 없습니다."
      )
    )
      return;
    try {
      setDeletingRequestId(id);
      setError(null);
      await buyRequestsApi.delete(id);
      // Remove from local state without reloading
      setBuyRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingRequestId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  const formatKoreanDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: BuyRequestStatus) => {
    const classes: Record<BuyRequestStatus, string> = {
      pending: "status-badge--pending",
      approved: "status-badge--approved",
      rejected: "status-badge--rejected",
      paid: "status-badge--paid",
      cancelled: "status-badge--cancelled",
    };
    return classes[status];
  };

  const getStatusLabel = (status: BuyRequestStatus) => {
    return STATUS_LABELS[status];
  };

  // Don't render if not authenticated - must be after all hooks
  if (!isAdminAuthenticated()) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-top">
          <h1>관리자 대시보드</h1>
          <div className="admin-header-actions">
            <Link to="/admin/users" className="admin-users-link">
              관리자 관리
            </Link>
            <button
              type="button"
              className="admin-logout-button"
              onClick={() => {
                logoutAdmin();
                navigate("/admin", { replace: true });
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className="tabs">
          <button
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            매입 신청 관리
          </button>
          <button
            className={activeTab === "prices" ? "active" : ""}
            onClick={() => setActiveTab("prices")}
          >
            가격 관리
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {saveMessage && <div className="admin-save-message">{saveMessage}</div>}

      {activeTab === "prices" && (
        <div className="pb-admin-model-prices">
          <h2 className="pb-admin-page-title">모델 가격 관리</h2>

          <div className="pb-admin-model-prices-header">
            <button
              type="button"
              className="pb-admin-primary-button"
              onClick={() => {
                setEditingPrice(null);
                setPriceFormData({
                  category: "iphone",
                  modelCode: "",
                  modelName: "",
                  storageGb: undefined,
                  color: "",
                  buyPrice: 0,
                  currency: "KRW",
                  isActive: true,
                });
                setShowPriceForm(true);
              }}
            >
              새 가격 추가
            </button>
          </div>

          {showPriceForm && (
            <div className="price-form-modal">
              <div className="modal-content">
                <h3>{editingPrice ? "가격 수정" : "새 가격 추가"}</h3>
                <div className="form-group">
                  <label>카테고리 *</label>
                  <select
                    value={priceFormData.category}
                    onChange={(e) =>
                      setPriceFormData({
                        ...priceFormData,
                        category: e.target.value as ModelPrice["category"],
                      })
                    }
                  >
                    <option value="iphone">iPhone</option>
                    <option value="ps5">PlayStation 5</option>
                    <option value="switch">Nintendo Switch</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>모델 코드 *</label>
                  <input
                    type="text"
                    value={priceFormData.modelCode}
                    onChange={(e) =>
                      setPriceFormData({
                        ...priceFormData,
                        modelCode: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>모델 이름 *</label>
                  <input
                    type="text"
                    value={priceFormData.modelName}
                    onChange={(e) =>
                      setPriceFormData({
                        ...priceFormData,
                        modelName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>저장 용량 (GB)</label>
                  <input
                    type="number"
                    value={priceFormData.storageGb || ""}
                    onChange={(e) =>
                      setPriceFormData({
                        ...priceFormData,
                        storageGb: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>색상</label>
                  <input
                    type="text"
                    value={priceFormData.color || ""}
                    onChange={(e) =>
                      setPriceFormData({
                        ...priceFormData,
                        color: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>매입가 (KRW) *</label>
                  <input
                    type="number"
                    value={priceFormData.buyPrice}
                    onChange={(e) =>
                      setPriceFormData({
                        ...priceFormData,
                        buyPrice: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={priceFormData.isActive}
                      onChange={(e) =>
                        setPriceFormData({
                          ...priceFormData,
                          isActive: e.target.checked,
                        })
                      }
                    />
                    활성화
                  </label>
                </div>
                <div className="form-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowPriceForm(false);
                      setEditingPrice(null);
                    }}
                  >
                    취소
                  </button>
                  <button
                    className="btn-primary"
                    onClick={
                      editingPrice ? handleUpdatePrice : handleCreatePrice
                    }
                  >
                    {editingPrice ? "수정" : "생성"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : (
            <div className="pb-admin-table-wrapper">
              <table className="pb-admin-table">
                <thead>
                  <tr>
                    <th>카테고리</th>
                    <th>모델 코드</th>
                    <th>모델 이름</th>
                    <th>저장 용량</th>
                    <th>색상</th>
                    <th>매입가</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {modelPrices.map((price) => (
                    <tr key={price._id}>
                      <td>{price.category}</td>
                      <td>{price.modelCode}</td>
                      <td className="pb-admin-model-name">{price.modelName}</td>
                      <td>{price.storageGb ? `${price.storageGb}GB` : "-"}</td>
                      <td>{price.color || "-"}</td>
                      <td className="pb-admin-table-price">
                        {formatPrice(price.buyPrice)}원
                      </td>
                      <td>
                        <span
                          className={
                            "status-badge " +
                            (price.isActive
                              ? "status-badge--active"
                              : "status-badge--inactive")
                          }
                        >
                          {price.isActive ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td>
                        <div className="pb-admin-actions">
                          <button
                            type="button"
                            className="pb-admin-action-button pb-admin-action-button--edit"
                            onClick={() => handleEditPrice(price)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="pb-admin-action-button pb-admin-action-button--delete"
                            onClick={() => handleDeletePrice(price._id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="requests-section">
          {unauthorizedError ? (
            <div className="pb-admin-unauthorized">
              <div className="pb-admin-unauthorized-content">
                <h3>관리자 토큰이 유효하지 않습니다</h3>
                <p>다시 로그인해주세요.</p>
                <button
                  className="app-btn-primary"
                  onClick={() => {
                    adminAuth.removeToken();
                    navigate("/admin", { replace: true });
                  }}
                >
                  관리자 로그인으로 이동
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search and Status filters */}
              <div className="pb-admin-filters">
                <div className="pb-admin-filters-left">
                  {/* Status filter tabs */}
                  <div className="pb-admin-status-tabs">
                    <button
                      type="button"
                      className={`pb-admin-status-tab ${
                        selectedStatus === "all"
                          ? "pb-admin-status-tab--active"
                          : ""
                      }`}
                      onClick={() => setSelectedStatus("all")}
                    >
                      전체
                    </button>
                    <button
                      type="button"
                      className={`pb-admin-status-tab ${
                        selectedStatus === "pending"
                          ? "pb-admin-status-tab--active"
                          : ""
                      }`}
                      onClick={() => setSelectedStatus("pending")}
                    >
                      대기
                    </button>
                    <button
                      type="button"
                      className={`pb-admin-status-tab ${
                        selectedStatus === "approved"
                          ? "pb-admin-status-tab--active"
                          : ""
                      }`}
                      onClick={() => setSelectedStatus("approved")}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      className={`pb-admin-status-tab ${
                        selectedStatus === "paid"
                          ? "pb-admin-status-tab--active"
                          : ""
                      }`}
                      onClick={() => setSelectedStatus("paid")}
                    >
                      입금완료
                    </button>
                    <button
                      type="button"
                      className={`pb-admin-status-tab ${
                        selectedStatus === "rejected"
                          ? "pb-admin-status-tab--active"
                          : ""
                      }`}
                      onClick={() => setSelectedStatus("rejected")}
                    >
                      거절
                    </button>
                  </div>
                </div>
                <div className="pb-admin-filters-right">
                  <input
                    type="text"
                    className="pb-admin-search-input"
                    placeholder="이메일, 이름, 전화번호, IMEI 검색..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page on new search
                    }}
                  />
                </div>
              </div>

              {/* Progress filter buttons */}
              <div className="admin-requests-section">
                <div className="admin-requests-inner">
                  <div className="admin-requests-header">
                    <div className="admin-requests-header-left">
                      <h1 className="admin-requests-title">매입 신청 관리</h1>
                      <p className="admin-requests-subtitle">
                        매입 신청을 상태별로 관리하고 입금 처리를 진행하세요.
                      </p>
                    </div>
                    <div className="admin-requests-filter-bar">
                      <button
                        type="button"
                        className={
                          "admin-requests-filter-button" +
                          (progressFilter === "all"
                            ? " admin-requests-filter-button--active"
                            : "")
                        }
                        onClick={() => setProgressFilter("all")}
                      >
                        전체
                      </button>

                      <button
                        type="button"
                        className={
                          "admin-requests-filter-button" +
                          (progressFilter === "noBank"
                            ? " admin-requests-filter-button--active"
                            : "")
                        }
                        onClick={() => setProgressFilter("noBank")}
                      >
                        입금정보 미제출
                      </button>

                      <button
                        type="button"
                        className={
                          "admin-requests-filter-button" +
                          (progressFilter === "noShipping"
                            ? " admin-requests-filter-button--active"
                            : "")
                        }
                        onClick={() => setProgressFilter("noShipping")}
                      >
                        기기 발송 대기
                      </button>

                      <button
                        type="button"
                        className={
                          "admin-requests-filter-button" +
                          (progressFilter === "readyForPayout"
                            ? " admin-requests-filter-button--active"
                            : "")
                        }
                        onClick={() => setProgressFilter("readyForPayout")}
                      >
                        입금 대기
                      </button>

                      <button
                        type="button"
                        className={
                          "admin-requests-filter-button" +
                          (progressFilter === "paid"
                            ? " admin-requests-filter-button--active"
                            : "")
                        }
                        onClick={() => setProgressFilter("paid")}
                      >
                        입금 완료
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="pb-admin-loading">
                      <LoadingSkeleton lines={6} />
                    </div>
                  ) : (
                    <>
                      {(() => {
                        // Apply progress filter to server-paginated results
                        const filteredRequests = buyRequests.filter(
                          (request) => {
                            // Progress filter logic
                            const isApproved = request.status === "approved";

                            const hasBankInfo = !!(
                              request.bankName &&
                              request.bankAccount &&
                              request.bankHolder
                            );

                            const hasShippingInfo = !!(
                              request.shippingMethod &&
                              request.shippingTrackingCode &&
                              request.shippingTrackingUrl
                            );

                            const isWaitingForBankInfo =
                              isApproved && !hasBankInfo;
                            const isWaitingForShipping =
                              isApproved && hasBankInfo && !hasShippingInfo;
                            const isReadyForPayout =
                              request.status === "approved" &&
                              hasBankInfo &&
                              hasShippingInfo;
                            const isPaid = request.status === "paid";

                            switch (progressFilter) {
                              case "noBank":
                                return isWaitingForBankInfo;
                              case "noShipping":
                                return isWaitingForShipping;
                              case "readyForPayout":
                                return isReadyForPayout;
                              case "paid":
                                return isPaid;
                              case "all":
                              default:
                                return true;
                            }
                          }
                        );

                        return (
                          <>
                            <div className="requests-list">
                              {filteredRequests.map((request) => {
                                // Calculate progress status (mirroring MyRequestsPage logic)
                                const isApproved =
                                  request.status === "approved";

                                const hasBankInfo = !!(
                                  request.bankName &&
                                  request.bankAccount &&
                                  request.bankHolder
                                );

                                const hasShippingInfo = !!(
                                  request.shippingMethod &&
                                  request.shippingTrackingCode &&
                                  request.shippingTrackingUrl
                                );

                                let progressLabel: string;
                                if (request.status === "paid") {
                                  progressLabel = "입금 완료";
                                } else if (!isApproved) {
                                  progressLabel = "검수/승인 대기";
                                } else if (!hasBankInfo) {
                                  progressLabel = "입금정보 제출 대기";
                                } else if (!hasShippingInfo) {
                                  progressLabel = "기기 발송 대기";
                                } else {
                                  progressLabel = "입금 대기";
                                }

                                const canMarkPaid =
                                  request.status === "approved" &&
                                  hasBankInfo &&
                                  hasShippingInfo;

                                const isExpanded =
                                  expandedAdminId === request._id;

                                return (
                                  <div
                                    key={request._id}
                                    className="admin-request-card app-card app-card--hoverable"
                                  >
                                    <div className="card-header-row">
                                      <div className="card-header-left">
                                        <div className="admin-request-title">
                                          {request.modelName}
                                          {request.storageGb &&
                                            ` (${request.storageGb}GB)`}
                                          {request.color &&
                                            ` - ${request.color}`}
                                        </div>
                                        <div className="admin-request-meta">
                                          <span>
                                            {formatDate(request.createdAt)} |{" "}
                                            {request.customerEmail}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="card-header-right">
                                        <div className="card-header-price">
                                          {request.finalPrice
                                            ? formatPrice(request.finalPrice)
                                            : formatPrice(request.buyPrice)}
                                        </div>
                                        <span
                                          className={`status-badge app-badge ${getStatusBadgeClass(
                                            request.status
                                          )}`}
                                        >
                                          {getStatusLabel(request.status)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="card-body">
                                      <div className="admin-requests-progress-label">
                                        진행 상태: {progressLabel}
                                      </div>
                                      {request.photoUrls &&
                                        request.photoUrls.length > 0 && (
                                          <div className="pb-admin-photo-preview-row">
                                            {request.photoUrls
                                              .slice(0, 3)
                                              .map((url, index) => {
                                                const photoUrls =
                                                  request.photoUrls || [];
                                                const visibleImages =
                                                  photoUrls.slice(0, 3);
                                                const isLastVisible =
                                                  index ===
                                                  visibleImages.length - 1;
                                                const extraCount =
                                                  photoUrls.length - 3;
                                                const showOverlay =
                                                  isLastVisible &&
                                                  extraCount > 0;

                                                return (
                                                  <button
                                                    key={index}
                                                    type="button"
                                                    className="pb-admin-photo-thumb"
                                                    onClick={() =>
                                                      openPhotoModal(request)
                                                    }
                                                  >
                                                    <img
                                                      src={url}
                                                      alt={`사진 ${index + 1}`}
                                                    />
                                                    {showOverlay && (
                                                      <div className="pb-admin-photo-overlay">
                                                        +{extraCount}장
                                                      </div>
                                                    )}
                                                  </button>
                                                );
                                              })}
                                          </div>
                                        )}
                                    </div>

                                    <div className="card-details-toggle">
                                      <button
                                        type="button"
                                        className="app-btn-outline card-details-toggle-button"
                                        onClick={() =>
                                          setExpandedAdminId(
                                            isExpanded ? null : request._id
                                          )
                                        }
                                      >
                                        {isExpanded
                                          ? "상세 접기"
                                          : "상세 펼치기"}
                                      </button>
                                    </div>

                                    {isExpanded && (
                                      <div className="card-details">
                                        <div className="admin-request-body-columns">
                                          <div className="admin-request-body-col admin-request-body-col--left">
                                            <div className="admin-request-section">
                                              <div className="admin-requests-badge-group">
                                                <span
                                                  className={`admin-requests-badge ${
                                                    hasBankInfo
                                                      ? "admin-requests-badge--success"
                                                      : "admin-requests-badge--pending"
                                                  }`}
                                                >
                                                  {hasBankInfo
                                                    ? "입금정보 제출완료"
                                                    : "입금정보 미제출"}
                                                </span>
                                                <span
                                                  className={`admin-requests-badge ${
                                                    hasShippingInfo
                                                      ? "admin-requests-badge--success"
                                                      : "admin-requests-badge--pending"
                                                  }`}
                                                >
                                                  {hasShippingInfo
                                                    ? "배송정보 제출완료"
                                                    : "배송정보 미제출"}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Status history */}
                                            {request.statusHistory &&
                                              request.statusHistory.length >
                                                0 && (
                                                <div className="admin-request-section admin-request-status-history">
                                                  <div className="admin-request-status-history-title">
                                                    상태 이력
                                                  </div>
                                                  <ul className="admin-request-status-history-list">
                                                    {request.statusHistory
                                                      .slice()
                                                      .sort(
                                                        (a, b) =>
                                                          new Date(
                                                            a.changedAt
                                                          ).getTime() -
                                                          new Date(
                                                            b.changedAt
                                                          ).getTime()
                                                      )
                                                      .map((entry, index) => (
                                                        <li
                                                          key={index}
                                                          className="admin-request-status-history-item"
                                                        >
                                                          <span className="admin-request-status-history-date">
                                                            {new Date(
                                                              entry.changedAt
                                                            ).toLocaleString(
                                                              "ko-KR",
                                                              {
                                                                year: "numeric",
                                                                month:
                                                                  "2-digit",
                                                                day: "2-digit",
                                                                hour: "2-digit",
                                                                minute:
                                                                  "2-digit",
                                                              }
                                                            )}
                                                          </span>
                                                          <span className="admin-request-status-history-status">
                                                            {getStatusLabel(
                                                              entry.status
                                                            )}
                                                          </span>
                                                        </li>
                                                      ))}
                                                  </ul>
                                                </div>
                                              )}
                                          </div>

                                          <div className="admin-request-body-col admin-request-body-col--right">
                                            <div className="admin-request-section">
                                              <p>
                                                <strong>고객:</strong>{" "}
                                                {request.customerName} |{" "}
                                                {request.customerPhone}
                                              </p>
                                              {request.imeiSerial && (
                                                <p>
                                                  <strong>
                                                    IMEI / 시리얼:
                                                  </strong>{" "}
                                                  {request.imeiSerial}
                                                </p>
                                              )}
                                              <p>
                                                <strong>영수증:</strong>{" "}
                                                {request.hasReceipt === true
                                                  ? "있음"
                                                  : request.hasReceipt === false
                                                  ? "없음"
                                                  : "-"}
                                              </p>
                                              {request.notes && (
                                                <p>
                                                  <strong>메모:</strong>{" "}
                                                  {request.notes}
                                                </p>
                                              )}
                                              {request.adminNotes &&
                                                !editingRequests[
                                                  request._id
                                                ] && (
                                                  <p>
                                                    <strong>
                                                      관리자 메모:
                                                    </strong>{" "}
                                                    {request.adminNotes}
                                                  </p>
                                                )}
                                              {request.photoUrls &&
                                                request.photoUrls.length >
                                                  0 && (
                                                  <div className="admin-request-photos-info">
                                                    사진{" "}
                                                    {request.photoUrls.length}장
                                                    업로드됨
                                                  </div>
                                                )}
                                            </div>

                                            {/* Timestamp metadata */}
                                            {(request.approvedAt ||
                                              request.paidAt ||
                                              request.cancelledAt) && (
                                              <div className="pb-admin-meta">
                                                {request.approvedAt && (
                                                  <p>
                                                    <strong>승인 시각:</strong>{" "}
                                                    {formatKoreanDateTime(
                                                      request.approvedAt
                                                    )}
                                                  </p>
                                                )}
                                                {request.paidAt && (
                                                  <p>
                                                    <strong>입금 시각:</strong>{" "}
                                                    {formatKoreanDateTime(
                                                      request.paidAt
                                                    )}
                                                  </p>
                                                )}
                                                {request.cancelledAt && (
                                                  <p>
                                                    <strong>취소 시각:</strong>{" "}
                                                    {formatKoreanDateTime(
                                                      request.cancelledAt
                                                    )}
                                                  </p>
                                                )}
                                              </div>
                                            )}

                                            {/* Display bank info if available */}
                                            {(request.bankName ||
                                              request.bankAccount ||
                                              request.bankHolder) && (
                                              <div className="admin-request-bank-info">
                                                <p>
                                                  <strong>은행 정보:</strong>{" "}
                                                  {request.bankName &&
                                                    `은행: ${request.bankName}`}
                                                  {request.bankAccount &&
                                                    ` | 계좌: ${request.bankAccount}`}
                                                  {request.bankHolder &&
                                                    ` | 예금주: ${request.bankHolder}`}
                                                </p>
                                              </div>
                                            )}

                                            {/* Display shipping info if available */}
                                            {(request.shippingMethod ||
                                              request.shippingTrackingCode ||
                                              request.shippingTrackingUrl) && (
                                              <div className="admin-request-shipping-info">
                                                <p>
                                                  <strong>배송 정보:</strong>{" "}
                                                  {request.shippingMethod &&
                                                    `방법: ${request.shippingMethod}`}
                                                  {request.shippingTrackingCode &&
                                                    ` | 운송장: ${request.shippingTrackingCode}`}
                                                  {request.shippingTrackingUrl && (
                                                    <span>
                                                      {" "}
                                                      |{" "}
                                                      <a
                                                        href={
                                                          request.shippingTrackingUrl
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                      >
                                                        조회 링크
                                                      </a>
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="admin-request-edit-block">
                                          <label className="admin-field-label">
                                            최종 매입 금액 (원)
                                          </label>
                                          <input
                                            type="number"
                                            className="admin-input"
                                            value={
                                              editingRequests[request._id]
                                                ?.finalPrice ??
                                              request.finalPrice ??
                                              request.buyPrice ??
                                              ""
                                            }
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              setEditingRequests((prev) => ({
                                                ...prev,
                                                [request._id]: {
                                                  finalPrice:
                                                    value === ""
                                                      ? ""
                                                      : Number(value),
                                                  adminNotes:
                                                    prev[request._id]
                                                      ?.adminNotes ??
                                                    request.adminNotes ??
                                                    "",
                                                  isSaving:
                                                    prev[request._id]
                                                      ?.isSaving ?? false,
                                                },
                                              }));
                                            }}
                                            placeholder="예: 1250000"
                                          />

                                          <label className="admin-field-label">
                                            관리자 메모
                                          </label>
                                          <textarea
                                            className="admin-textarea"
                                            value={
                                              editingRequests[request._id]
                                                ?.adminNotes ??
                                              request.adminNotes ??
                                              ""
                                            }
                                            onChange={(e) => {
                                              setEditingRequests((prev) => ({
                                                ...prev,
                                                [request._id]: {
                                                  finalPrice:
                                                    prev[request._id]
                                                      ?.finalPrice ??
                                                    request.finalPrice ??
                                                    request.buyPrice ??
                                                    "",
                                                  adminNotes: e.target.value,
                                                  isSaving:
                                                    prev[request._id]
                                                      ?.isSaving ?? false,
                                                },
                                              }));
                                            }}
                                            rows={3}
                                            placeholder="검수 내용, 고객과의 협의 사항 등을 기록해주세요."
                                          />

                                          <button
                                            type="button"
                                            className="admin-button admin-button--primary"
                                            disabled={
                                              savingRequestId === request._id
                                            }
                                            onClick={async () => {
                                              // Get current values from editing state or fallback to request values
                                              const currentEdit =
                                                editingRequests[request._id];
                                              const finalPriceValue =
                                                currentEdit?.finalPrice !==
                                                undefined
                                                  ? currentEdit.finalPrice
                                                  : request.finalPrice ??
                                                    request.buyPrice ??
                                                    "";
                                              const adminNotesValue =
                                                currentEdit?.adminNotes !==
                                                undefined
                                                  ? currentEdit.adminNotes
                                                  : request.adminNotes ?? "";

                                              try {
                                                setSavingRequestId(request._id);
                                                setSaveMessage(null);
                                                setError(null);

                                                const updateData: {
                                                  finalPrice?: number;
                                                  adminNotes?: string;
                                                } = {};

                                                // Only include finalPrice if it's not empty
                                                if (
                                                  finalPriceValue !== "" &&
                                                  finalPriceValue !== null &&
                                                  finalPriceValue !== undefined
                                                ) {
                                                  updateData.finalPrice =
                                                    typeof finalPriceValue ===
                                                    "number"
                                                      ? finalPriceValue
                                                      : Number(finalPriceValue);
                                                }

                                                // Always include adminNotes (even if empty, to clear it)
                                                updateData.adminNotes =
                                                  adminNotesValue || undefined;

                                                await buyRequestsApi.update(
                                                  request._id,
                                                  updateData
                                                );

                                                // Refresh the list to show updated values
                                                await loadBuyRequests();

                                                // Show success message
                                                setSaveMessage(
                                                  "요청이 성공적으로 저장되었습니다."
                                                );

                                                // Clear editing state after successful save
                                                setEditingRequests((prev) => {
                                                  const next = { ...prev };
                                                  delete next[request._id];
                                                  return next;
                                                });

                                                // Clear success message after 3 seconds
                                                setTimeout(() => {
                                                  setSaveMessage(null);
                                                }, 3000);
                                              } catch (err: any) {
                                                console.error(
                                                  "Failed to update request:",
                                                  err
                                                );
                                                setError(getErrorMessage(err));
                                                setSaveMessage(null);
                                                setEditingRequests((prev) => ({
                                                  ...prev,
                                                  [request._id]: {
                                                    finalPrice: finalPriceValue,
                                                    adminNotes: adminNotesValue,
                                                    isSaving: false,
                                                  },
                                                }));
                                              } finally {
                                                setSavingRequestId(null);
                                              }
                                            }}
                                          >
                                            {savingRequestId === request._id
                                              ? "저장 중..."
                                              : "저장"}
                                          </button>
                                        </div>

                                        <div className="admin-request-actions">
                                          {request.status === "pending" && (
                                            <>
                                              <button
                                                className="app-btn-primary"
                                                onClick={() =>
                                                  handleUpdateRequestStatus(
                                                    request._id,
                                                    "approved"
                                                  )
                                                }
                                              >
                                                승인
                                              </button>
                                              <button
                                                className="app-btn-outline"
                                                onClick={() =>
                                                  handleUpdateRequestStatus(
                                                    request._id,
                                                    "rejected"
                                                  )
                                                }
                                              >
                                                거절
                                              </button>
                                            </>
                                          )}
                                          {request.status === "approved" && (
                                            <>
                                              {canMarkPaid && (
                                                <button
                                                  type="button"
                                                  className="admin-requests-mark-paid-button app-btn-primary app-btn-primary--success"
                                                  disabled={
                                                    markingPaidId ===
                                                    request._id
                                                  }
                                                  onClick={() =>
                                                    handleMarkPaid(request._id)
                                                  }
                                                >
                                                  {markingPaidId === request._id
                                                    ? "처리 중..."
                                                    : "입금 완료 처리"}
                                                </button>
                                              )}
                                            </>
                                          )}
                                          <button
                                            type="button"
                                            className="pb-admin-action-button pb-admin-action-button--delete"
                                            disabled={
                                              deletingRequestId === request._id
                                            }
                                            onClick={() =>
                                              handleDeleteRequest(request._id)
                                            }
                                          >
                                            {deletingRequestId === request._id
                                              ? "삭제 중..."
                                              : "삭제"}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {!loading && filteredRequests.length === 0 && (
                                <div className="pb-admin-empty">
                                  <p className="pb-admin-empty-title">
                                    표시할 신청 내역이 없습니다.
                                  </p>
                                  <p className="pb-admin-empty-text">
                                    선택한 상태의 신청이 없거나, 아직 고객이
                                    신청을 만들지 않았습니다.
                                  </p>
                                </div>
                              )}
                            </div>
                            {totalPages > 1 && (
                              <div className="pb-admin-pagination">
                                <button
                                  type="button"
                                  disabled={currentPage === 1}
                                  onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                  }
                                >
                                  이전
                                </button>
                                <span className="pb-admin-pagination-info">
                                  페이지 {currentPage} / {totalPages} (총{" "}
                                  {totalCount}건)
                                </span>
                                <button
                                  type="button"
                                  disabled={currentPage === totalPages}
                                  onClick={() =>
                                    setCurrentPage((p) =>
                                      Math.min(totalPages, p + 1)
                                    )
                                  }
                                >
                                  다음
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Photo Modal */}
      <PhotoModal
        isOpen={isPhotoModalOpen}
        photos={modalPhotos}
        initialIndex={modalInitialIndex}
        onClose={closePhotoModal}
      />
    </div>
  );
};

export default AdminDashboard;
