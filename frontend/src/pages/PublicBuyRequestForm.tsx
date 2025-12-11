import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModelPrice, CreateBuyRequestDto, DeviceCategory } from "../types";
import { modelPricesApi } from "../api/modelPrices";
import { buyRequestsApi } from "../api/buyRequests";
import { uploadPhotos } from "../api/files";
import { getUserToken } from "../auth/authStore";
import BuyFlowSteps from "../components/BuyFlowSteps";
import { getErrorMessage } from "../api/errors";
import "./PublicBuyRequest.css";

// Category metadata for device images
const CATEGORY_META: Record<
  DeviceCategory,
  { label: string; description: string; imageUrl: string }
> = {
  iphone: {
    label: "iPhone 17 시리즈",
    description: "아이폰 17 / 17 플러스 / 17 프로 / 17 프로 맥스",
    imageUrl: "/images/categories/iphone17.png",
  },
  ps5: {
    label: "PlayStation 5",
    description: "디스크 / 디지털 / 슬림 모델",
    imageUrl: "/images/categories/ps5.png",
  },
  switch: {
    label: "Nintendo Switch",
    description: "OLED / 일반 / 라이트",
    imageUrl: "/images/categories/switch.png",
  },
};

interface PendingSell {
  category: DeviceCategory;
  modelPriceId: string;
  modelName: string;
  storage?: number;
  color?: string | null;
}

const PublicBuyRequestForm = () => {
  const navigate = useNavigate();
  const [modelPrices, setModelPrices] = useState<ModelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | "">(
    ""
  );
  const [selectedModelPrice, setSelectedModelPrice] =
    useState<ModelPrice | null>(null);
  const [formData, setFormData] = useState<CreateBuyRequestDto>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    modelPriceId: "",
    notes: "",
  });
  const [imeiSerial, setImeiSerial] = useState<string>("");
  const [imeiSerialError, setImeiSerialError] = useState<string | null>(null);
  const [hasReceipt, setHasReceipt] = useState<boolean | null>(null);
  const [devicePhotos, setDevicePhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [devicePhotosError, setDevicePhotosError] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<3 | 4 | 5>(3);

  useEffect(() => {
    loadModelPrices();
  }, []);

  // Clean up object URLs when component unmounts or photos change
  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  // Load pending selection from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("pb-pending-sell");
    if (!raw) {
      // No data → allow form to load anyway (user might have navigated directly)
      // Don't redirect immediately - let them fill the form manually
      return;
    }

    try {
      const pending: PendingSell = JSON.parse(raw);

      if (pending.category) {
        setSelectedCategory(pending.category);
      }
      if (pending.modelPriceId) {
        setFormData((prev) => ({
          ...prev,
          modelPriceId: pending.modelPriceId,
        }));
      }
    } catch (e) {
      console.error("Failed to parse pending sell data:", e);
      // Don't redirect on parse error - just continue without pre-fill
    } finally {
      // Only remove after successful use
      localStorage.removeItem("pb-pending-sell");
    }
  }, []);

  // Find the selected model price once modelPrices are loaded
  useEffect(() => {
    if (modelPrices.length > 0 && formData.modelPriceId) {
      const model = modelPrices.find((m) => m._id === formData.modelPriceId);
      if (model) {
        setSelectedModelPrice(model);
        setSelectedCategory(model.category);
      }
    }
  }, [modelPrices, formData.modelPriceId]);

  // Check auth - ensure token is available, but don't redirect immediately
  // This allows the redirect from login to complete first
  useEffect(() => {
    const token = getUserToken();

    if (!token) {
      // Only redirect if we're sure there's no token
      // Use a small delay to allow login redirect to complete
      const checkAuth = setTimeout(() => {
        const tokenAgain = getUserToken();
        if (!tokenAgain) {
          navigate("/login?redirect=/sell/new", { replace: true });
        }
      }, 200);

      return () => clearTimeout(checkAuth);
    }
  }, [navigate]);

  const loadModelPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const prices = await modelPricesApi.getAll(true);
      setModelPrices(prices);
    } catch (err) {
      setError("가격 정보를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Validate IMEI/Serial based on category
  const validateImeiSerial = (value: string): string | null => {
    if (!value.trim()) {
      return "필수 입력 항목입니다.";
    }

    if (selectedCategory === "iphone") {
      // IMEI must be exactly 15 digits
      if (value.length !== 15) {
        return "유효한 IMEI 15자리를 입력해주세요.";
      }
      if (!/^\d+$/.test(value)) {
        return "유효한 IMEI 15자리를 입력해주세요.";
      }
    } else if (selectedCategory === "ps5" || selectedCategory === "switch") {
      // Serial number: minimum 8 characters, alphanumeric
      if (value.length < 8) {
        return "제품 시리얼 번호를 정확히 입력해주세요. (최소 8자)";
      }
      if (!/^[A-Za-z0-9]+$/.test(value)) {
        return "제품 시리얼 번호를 정확히 입력해주세요. (최소 8자)";
      }
    }

    return null;
  };

  const handleImeiSerialChange = (value: string) => {
    setImeiSerial(value);
    // Clear error when user starts typing
    if (imeiSerialError) {
      setImeiSerialError(null);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentStep === 3) {
      // Validate customer info and IMEI before proceeding to step 4
      if (!formData.customerName.trim()) {
        setError("이름을 입력해주세요.");
        return;
      }
      if (!formData.customerPhone.trim()) {
        setError("전화번호를 입력해주세요.");
        return;
      }
      if (!formData.customerEmail.trim()) {
        setError("이메일을 입력해주세요.");
        return;
      }

      const imeiSerialValidationError = validateImeiSerial(imeiSerial);
      if (imeiSerialValidationError) {
        setImeiSerialError(imeiSerialValidationError);
        setError(imeiSerialValidationError);
        return;
      }
      setImeiSerialError(null);

      if (hasReceipt === null) {
        setError("영수증 보유 여부를 선택해주세요.");
        return;
      }

      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Validate photos before proceeding to step 5
      if (devicePhotos.length < 2) {
        setDevicePhotosError("최소 2장 이상의 제품 사진을 업로드해주세요.");
        setError("최소 2장 이상의 제품 사진을 업로드해주세요.");
        return;
      }
      setDevicePhotosError(null);
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // Final submit
      await handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 3) {
      setCurrentStep((currentStep - 1) as 3 | 4);
      setError(null);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setDevicePhotos(newFiles);

    // Revoke old preview URLs
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));

    // Create new preview URLs
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(newPreviews);

    // Validate
    if (newFiles.length >= 2) {
      setDevicePhotosError(null);
    } else if (newFiles.length > 0) {
      setDevicePhotosError("최소 2장 이상의 제품 사진을 업로드해주세요.");
    } else {
      setDevicePhotosError(null);
    }
  };

  const handleRemovePhoto = (index: number) => {
    // Revoke the URL for the removed photo
    const urlToRemove = photoPreviews[index];
    if (urlToRemove) {
      URL.revokeObjectURL(urlToRemove);
    }

    // Remove from both arrays and validate
    setDevicePhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const remainingCount = updated.length;
      if (remainingCount >= 2) {
        setDevicePhotosError(null);
      } else if (remainingCount > 0) {
        setDevicePhotosError("최소 2장 이상의 제품 사진을 업로드해주세요.");
      } else {
        setDevicePhotosError(null);
      }
      return updated;
    });
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      let photoUrls: string[] = [];

      // Upload photos if any are selected
      if (devicePhotos.length > 0) {
        setIsUploadingPhotos(true);
        try {
          // Upload files to /files/photos endpoint
          const uploadedUrls = await uploadPhotos(devicePhotos);
          photoUrls = uploadedUrls;
        } catch (uploadErr: any) {
          setIsUploadingPhotos(false);
          setError(getErrorMessage(uploadErr));
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploadingPhotos(false);
        }
      }

      // Create buy request with uploaded photo URLs
      await buyRequestsApi.create({
        ...formData,
        imeiSerial: imeiSerial || undefined,
        hasReceipt: hasReceipt ?? undefined,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      });

      // Redirect to My Requests page after successful submission
      navigate("/my-requests");
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const getCategoryLabel = (category: DeviceCategory): string => {
    const labels: Record<DeviceCategory, string> = {
      iphone: "iPhone 17 Series",
      ps5: "PlayStation 5",
      switch: "Nintendo Switch (Latest)",
    };
    return labels[category];
  };

  if (!selectedModelPrice) {
    return (
      <div className="pb-sell-form-page">
        <main className="pb-main">
          <section className="pb-card">
            <div className="loading-state">
              {loading
                ? "가격 정보를 불러오는 중..."
                : "선택된 모델 정보를 불러올 수 없습니다."}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const categoryMeta = selectedCategory
    ? CATEGORY_META[selectedCategory]
    : null;

  return (
    <div className="pb-sell-form-page pb-form-page-compact">
      <main className="pb-main">
        <div className="pb-page-layout">
          {/* Left: Step navigation */}
          <BuyFlowSteps currentStep={currentStep} />

          {/* Right: Form content */}
          <div className="pb-content-area">
            <section className="pb-form-layout">
              <form onSubmit={handleNext} className="buy-request-form">
                {/* Step 3: Customer and Device Info */}
                {currentStep === 3 && (
                  <div className="pb-form-layout-main">
                    {/* LEFT: Device info */}
                    <div className="pb-form-left">
                      {selectedModelPrice && (
                        <div className="pb-device-panel">
                          <div className="pb-device-panel-image">
                            {categoryMeta && (
                              <img
                                src={categoryMeta.imageUrl}
                                alt={categoryMeta.label}
                                className="pb-device-panel-img"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            )}
                          </div>
                          <div className="pb-device-panel-info">
                            <div className="pb-device-panel-name">
                              {getCategoryLabel(selectedModelPrice.category)}
                            </div>
                            <div className="pb-device-panel-meta">
                              {selectedModelPrice.modelName}
                              {selectedModelPrice.storageGb &&
                                ` (${selectedModelPrice.storageGb}GB)`}
                              {selectedModelPrice.color &&
                                ` - ${selectedModelPrice.color}`}
                            </div>
                            <div className="pb-device-panel-price-label">
                              예상 매입가
                            </div>
                            <div className="pb-device-panel-price">
                              {formatPrice(selectedModelPrice.buyPrice)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Form fields */}
                    <div className="pb-form-right">
                      {/* Customer info section */}
                      <div className="pb-form-section">
                        <h2 className="pb-form-section-title">고객 정보</h2>
                        <div className="pb-form-grid">
                          <div className="pb-form-grid-item">
                            <div className="form-group">
                              <label htmlFor="customerName">이름 *</label>
                              <input
                                type="text"
                                id="customerName"
                                required
                                value={formData.customerName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    customerName: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="pb-form-grid-item">
                            <div className="form-group">
                              <label htmlFor="customerPhone">전화번호 *</label>
                              <input
                                type="tel"
                                id="customerPhone"
                                required
                                value={formData.customerPhone}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    customerPhone: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="customerEmail">이메일 *</label>
                          <input
                            type="email"
                            id="customerEmail"
                            required
                            value={formData.customerEmail}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                customerEmail: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Device details section */}
                      <div className="pb-form-section">
                        <h2 className="pb-form-section-title">기기 정보</h2>
                        <div className="form-group">
                          <label htmlFor="imeiSerial">
                            {selectedCategory === "iphone"
                              ? "IMEI"
                              : "시리얼 번호"}{" "}
                            *
                          </label>
                          <input
                            type="text"
                            id="imeiSerial"
                            required
                            value={imeiSerial}
                            onChange={(e) =>
                              handleImeiSerialChange(e.target.value)
                            }
                            onBlur={() => {
                              if (imeiSerial) {
                                const error = validateImeiSerial(imeiSerial);
                                setImeiSerialError(error);
                              }
                            }}
                            placeholder={
                              selectedCategory === "iphone"
                                ? "IMEI 15자리 입력"
                                : "시리얼 번호 입력"
                            }
                            disabled={!selectedCategory}
                          />
                          {imeiSerialError && (
                            <div className="pb-form-error">
                              {imeiSerialError}
                            </div>
                          )}
                          <div className="field-helper">
                            {selectedCategory === "iphone"
                              ? "아이폰: 설정 → 일반 → 정보에서 IMEI를 확인할 수 있습니다."
                              : selectedCategory === "ps5" ||
                                selectedCategory === "switch"
                              ? "PS5/스위치: 본체 뒷면 또는 박스에 적힌 시리얼 번호를 입력해주세요."
                              : "기기를 선택하면 IMEI/시리얼 번호 입력 필드가 활성화됩니다."}
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            구매 영수증이 있으신가요?
                          </label>
                          <div className="inline-radio-group">
                            <label>
                              <input
                                type="radio"
                                name="hasReceipt"
                                value="yes"
                                checked={hasReceipt === true}
                                onChange={() => setHasReceipt(true)}
                              />
                              <span>네, 있어요</span>
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="hasReceipt"
                                value="no"
                                checked={hasReceipt === false}
                                onChange={() => setHasReceipt(false)}
                              />
                              <span>아니요, 없어요</span>
                            </label>
                          </div>
                          <p className="field-helper">
                            영수증이 있으면 검수 및 입금이 더 원활하게 진행될 수
                            있습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Photos Upload */}
                {currentStep === 4 && (
                  <div className="pb-form-bottom">
                    <div className="pb-form-section">
                      <h2 className="pb-form-section-title">제품 사진</h2>
                      <div className="form-group">
                        <label className="form-label">
                          제품 사진 업로드 (최소 2장 이상) *
                        </label>
                        <div className="pb-photo-upload-dropzone">
                          <label className="pb-photo-upload-dropzone-inner">
                            <div
                              className="pb-photo-upload-icon"
                              aria-hidden="true"
                            >
                              📷
                            </div>
                            <div className="pb-photo-upload-texts">
                              <div className="pb-photo-upload-title">
                                사진 선택하기
                              </div>
                              <div className="pb-photo-upload-subtitle">
                                박스, 제품 앞/뒤, 봉인 씰이 잘 보이도록 최소 2장
                                이상 업로드해주세요.
                              </div>
                            </div>
                            <input
                              type="file"
                              id="devicePhotos"
                              accept="image/*"
                              multiple
                              onChange={handlePhotoChange}
                              hidden
                            />
                          </label>
                          {devicePhotos.length > 0 && (
                            <div className="pb-file-upload-info">
                              총 {devicePhotos.length}장 선택됨
                            </div>
                          )}
                        </div>
                        {photoPreviews.length > 0 && (
                          <div className="pb-photo-preview-grid">
                            {photoPreviews.map((url, index) => {
                              const file = devicePhotos[index];
                              return (
                                <div
                                  key={url}
                                  className="pb-photo-preview-item"
                                >
                                  <div className="pb-photo-preview-image-wrapper">
                                    <img
                                      src={url}
                                      alt={file?.name ?? `사진 ${index + 1}`}
                                    />
                                  </div>
                                  <div className="pb-photo-preview-meta">
                                    <div className="pb-photo-preview-name">
                                      {file?.name || `사진 ${index + 1}`}
                                    </div>
                                    <button
                                      type="button"
                                      className="pb-photo-remove-button"
                                      onClick={() => handleRemovePhoto(index)}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {devicePhotosError && (
                          <div className="pb-form-error">
                            {devicePhotosError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Summary and Final Submit */}
                {currentStep === 5 && (
                  <div className="pb-form-bottom">
                    <div className="pb-summary-card">
                      {/* Device Summary */}
                      {selectedModelPrice && (
                        <div className="pb-summary-section">
                          <h3 className="pb-summary-title">기기 정보</h3>
                          <div className="pb-summary-row">
                            <span className="pb-summary-label">모델</span>
                            <span className="pb-summary-value">
                              {selectedModelPrice.modelName}
                              {selectedModelPrice.storageGb &&
                                ` (${selectedModelPrice.storageGb}GB)`}
                              {selectedModelPrice.color &&
                                ` · ${selectedModelPrice.color}`}
                            </span>
                          </div>
                          <div className="pb-summary-row">
                            <span className="pb-summary-label">
                              예상 매입가
                            </span>
                            <span className="pb-summary-value pb-summary-price">
                              {formatPrice(selectedModelPrice.buyPrice)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Customer & Device Info Summary */}
                      <div className="pb-summary-section">
                        <h3 className="pb-summary-title">고객 · 기기 정보</h3>
                        <div className="pb-summary-row">
                          <span className="pb-summary-label">이름</span>
                          <span className="pb-summary-value">
                            {formData.customerName}
                          </span>
                        </div>
                        <div className="pb-summary-row">
                          <span className="pb-summary-label">전화번호</span>
                          <span className="pb-summary-value">
                            {formData.customerPhone}
                          </span>
                        </div>
                        <div className="pb-summary-row">
                          <span className="pb-summary-label">이메일</span>
                          <span className="pb-summary-value">
                            {formData.customerEmail}
                          </span>
                        </div>
                        <div className="pb-summary-row">
                          <span className="pb-summary-label">
                            {selectedCategory === "iphone"
                              ? "IMEI"
                              : "시리얼 번호"}
                          </span>
                          <span className="pb-summary-value">{imeiSerial}</span>
                        </div>
                        <div className="pb-summary-row">
                          <span className="pb-summary-label">영수증</span>
                          <span className="pb-summary-value">
                            {hasReceipt === true
                              ? "있음"
                              : hasReceipt === false
                              ? "없음"
                              : "-"}
                          </span>
                        </div>
                      </div>

                      {/* Photos Summary */}
                      <div className="pb-summary-section">
                        <h3 className="pb-summary-title">제품 사진</h3>
                        {photoPreviews.length === 0 ? (
                          <div className="pb-summary-empty">
                            선택된 사진이 없습니다.
                          </div>
                        ) : (
                          <div className="pb-summary-photo-grid">
                            {photoPreviews.map((url, index) => (
                              <div key={url} className="pb-summary-photo-item">
                                <div className="pb-summary-photo-image-wrapper">
                                  <img
                                    src={url}
                                    alt={`제품 사진 ${index + 1}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes section */}
                    <div className="pb-form-section">
                      <div className="form-group">
                        <label htmlFor="notes" className="pb-field-label">
                          추가 메모 (선택사항)
                        </label>
                        <textarea
                          id="notes"
                          rows={4}
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="pb-form-footer">
                  {error && <div className="pb-form-error">{error}</div>}
                  <div className="pb-form-footer-buttons">
                    {currentStep > 3 && (
                      <button
                        type="button"
                        className="pb-secondary-button"
                        onClick={handleBack}
                        disabled={isSubmitting}
                      >
                        이전 단계
                      </button>
                    )}
                    <button
                      type="submit"
                      className="pb-primary-button"
                      disabled={
                        !selectedModelPrice ||
                        isSubmitting ||
                        isUploadingPhotos ||
                        loading ||
                        (currentStep === 3 &&
                          (!imeiSerial.trim() ||
                            !!imeiSerialError ||
                            !formData.customerName.trim() ||
                            !formData.customerPhone.trim() ||
                            !formData.customerEmail.trim() ||
                            hasReceipt === null)) ||
                        (currentStep === 4 && devicePhotos.length < 2)
                      }
                    >
                      {isUploadingPhotos
                        ? "사진 업로드 중..."
                        : isSubmitting
                        ? "제출 중..."
                        : currentStep === 5
                        ? "신청 완료하기"
                        : "다음 단계로"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicBuyRequestForm;
