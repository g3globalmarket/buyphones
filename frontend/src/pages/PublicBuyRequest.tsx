import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ModelPrice, DeviceCategory } from "../types";
import { modelPricesApi } from "../api/modelPrices";
import { getUserToken } from "../auth/authStore";
import BuyFlowSteps from "../components/BuyFlowSteps";
import LoadingSkeleton from "../components/LoadingSkeleton";
import "./PublicBuyRequest.css";

// Category metadata for visual category selection
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

// Model metadata for visual model selection
const MODEL_META: Record<string, { label: string; imageUrl: string }> = {
  "iPhone 17": {
    label: "iPhone 17",
    imageUrl: "/images/models/iphone17.png",
  },
  "iPhone 17 Plus": {
    label: "iPhone 17 Plus",
    imageUrl: "/images/models/iphone17-plus.png",
  },
  "iPhone 17 Pro": {
    label: "iPhone 17 Pro",
    imageUrl: "/images/models/iphone17-pro.png",
  },
  "iPhone 17 Pro Max": {
    label: "iPhone 17 Pro Max",
    imageUrl: "/images/models/iphone17-pro-max.png",
  },
  "PlayStation 5 Standard": {
    label: "PS5 디스크",
    imageUrl: "/images/models/ps5-standard.png",
  },
  "PlayStation 5 Digital Edition": {
    label: "PS5 디지털",
    imageUrl: "/images/models/ps5-digital.png",
  },
  "PlayStation 5 Slim Standard": {
    label: "PS5 슬림 디스크",
    imageUrl: "/images/models/ps5-slim-standard.png",
  },
  "PlayStation 5 Slim Digital Edition": {
    label: "PS5 슬림 디지털",
    imageUrl: "/images/models/ps5-slim-digital.png",
  },
  // Fallback for actual model names from database
  "PlayStation 5 (표준판)": {
    label: "PS5 디스크",
    imageUrl: "/images/models/ps5-standard.png",
  },
  "PlayStation 5 (디지털 에디션)": {
    label: "PS5 디지털",
    imageUrl: "/images/models/ps5-digital.png",
  },
  "PlayStation 5 Slim (표준판)": {
    label: "PS5 슬림 디스크",
    imageUrl: "/images/models/ps5-slim-standard.png",
  },
  "PlayStation 5 Slim (디지털 에디션)": {
    label: "PS5 슬림 디지털",
    imageUrl: "/images/models/ps5-slim-digital.png",
  },
  "Nintendo Switch OLED": {
    label: "Switch OLED",
    imageUrl: "/images/models/switch-oled.png",
  },
  "Nintendo Switch (표준판)": {
    label: "Switch",
    imageUrl: "/images/models/switch-standard.png",
  },
  "Nintendo Switch Lite": {
    label: "Switch Lite",
    imageUrl: "/images/models/switch-lite.png",
  },
};

// Color metadata for visual color picker
const COLOR_META: Record<
  string,
  { label: string; hex?: string; imageUrl?: string }
> = {
  Lavender: {
    label: "Lavender",
    hex: "#e3c8ff",
    imageUrl: "/images/colors/iphone17/lavender.png",
  },
  Sage: {
    label: "Sage",
    hex: "#b6c8a0",
    imageUrl: "/images/colors/iphone17/sage.png",
  },
  "Mist Blue": {
    label: "Mist Blue",
    hex: "#c1d8f5",
    imageUrl: "/images/colors/iphone17/mist-blue.png",
  },
  White: {
    label: "White",
    hex: "#f5f5f5",
    imageUrl: "/images/colors/iphone17/white.png",
  },
  Black: {
    label: "Black",
    hex: "#111111",
    imageUrl: "/images/colors/iphone17/black.png",
  },
  "Cosmic Orange": {
    label: "Cosmic Orange",
    hex: "#ff8a3d",
    imageUrl: "/images/colors/iphone17pro/cosmic-orange.png",
  },
  "Deep Blue": {
    label: "Deep Blue",
    hex: "#0f3c7a",
    imageUrl: "/images/colors/iphone17pro/deep-blue.png",
  },
  Silver: {
    label: "Silver",
    hex: "#d2d2d7",
    imageUrl: "/images/colors/iphone17pro/silver.png",
  },
};

const PublicBuyRequest = () => {
  const navigate = useNavigate();
  const [modelPrices, setModelPrices] = useState<ModelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | "">(
    ""
  );
  const [selectedModelName, setSelectedModelName] = useState<string>("");
  const [selectedStorage, setSelectedStorage] = useState<number | "">("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step state: 1 before category selection, 2 after category is selected
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    loadModelPrices();
  }, []);

  // Check auth status
  useEffect(() => {
    const token = getUserToken();
    setIsAuthenticated(!!token);
  }, []);

  const loadModelPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const prices = await modelPricesApi.getAll(true);
      setModelPrices(prices);
      if (prices.length === 0) {
        setError("현재 매입 가능한 모델이 없습니다.");
      }
    } catch (err) {
      setError("가격 정보를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from model prices
  const categories = useMemo(() => {
    const cats = Array.from(new Set(modelPrices.map((m) => m.category)));
    return cats.sort();
  }, [modelPrices]);

  // Get unique model names for selected category
  const modelNames = useMemo(() => {
    if (!selectedCategory) return [];
    const models = modelPrices.filter((m) => m.category === selectedCategory);

    if (selectedCategory === "iphone") {
      // For iPhone, group by the full model name (iPhone 17, iPhone 17 Plus, etc.)
      // but we need to normalize to get unique base models
      const nameMap = new Map<string, string>();
      models.forEach((m) => {
        // Extract base model: "iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max"
        const baseName = m.modelName;
        if (!nameMap.has(baseName)) {
          nameMap.set(baseName, baseName);
        }
      });
      return Array.from(nameMap.values()).sort();
    } else if (selectedCategory === "ps5") {
      // For PS5, we need to distinguish between Standard and Digital
      // Group by base name + variant type
      const nameMap = new Map<string, string>();
      models.forEach((m) => {
        const baseName = m.modelName;
        const isSlim = baseName.includes("Slim");
        const isDigital = baseName.includes("디지털");

        // Create unique key: "PlayStation 5 Standard", "PlayStation 5 Digital", etc.
        let displayName = "PlayStation 5";
        if (isSlim) displayName += " Slim";
        if (isDigital) displayName += " Digital Edition";
        else if (!isSlim) displayName += " Standard";

        // Use a key that includes variant info
        const key = isSlim
          ? isDigital
            ? "slim-digital"
            : "slim-standard"
          : isDigital
          ? "digital"
          : "standard";
        if (!nameMap.has(key)) {
          nameMap.set(key, displayName);
        }
      });
      return Array.from(nameMap.values()).sort();
    } else {
      // For Switch, use full model name
      const uniqueNames = Array.from(new Set(models.map((m) => m.modelName)));
      return uniqueNames.sort();
    }
  }, [modelPrices, selectedCategory]);

  // Get available storage options for selected category and model
  const storageOptions = useMemo(() => {
    if (!selectedCategory || !selectedModelName) return [];

    const models = modelPrices.filter((m) => {
      if (m.category !== selectedCategory) return false;
      if (m.storageGb === undefined) return false;

      // Match model name based on category
      if (selectedCategory === "iphone") {
        return m.modelName === selectedModelName;
      } else if (selectedCategory === "ps5") {
        // For PS5, match by variant type
        const isSlim = selectedModelName.includes("Slim");
        const isDigital = selectedModelName.includes("Digital");
        const modelIsSlim = m.modelName.includes("Slim");
        const modelIsDigital = m.modelName.includes("디지털");
        return isSlim === modelIsSlim && isDigital === modelIsDigital;
      } else {
        return m.modelName === selectedModelName;
      }
    });

    const storages = Array.from(
      new Set(models.map((m) => m.storageGb!).filter((s) => s !== undefined))
    );
    return storages.sort((a, b) => a - b);
  }, [modelPrices, selectedCategory, selectedModelName]);

  // Get models matching the current selection (for color extraction)
  const matchingModelsForColor = useMemo(() => {
    if (!selectedCategory || !selectedModelName) return [];

    return modelPrices.filter((m) => {
      if (m.category !== selectedCategory) return false;

      // Match model name based on category
      let modelMatch = false;
      if (selectedCategory === "iphone") {
        modelMatch = m.modelName === selectedModelName;
        // For iPhone, also match storage if selected
        if (modelMatch && selectedStorage !== "") {
          modelMatch = m.storageGb === selectedStorage;
        }
      } else if (selectedCategory === "ps5") {
        const isSlim = selectedModelName.includes("Slim");
        const isDigital = selectedModelName.includes("Digital");
        const modelIsSlim = m.modelName.includes("Slim");
        const modelIsDigital = m.modelName.includes("디지털");
        modelMatch = isSlim === modelIsSlim && isDigital === modelIsDigital;
      } else {
        modelMatch = m.modelName === selectedModelName;
      }

      return modelMatch;
    });
  }, [modelPrices, selectedCategory, selectedModelName, selectedStorage]);

  // Get available colors for the selected combination
  const availableColors = useMemo(() => {
    if (matchingModelsForColor.length === 0) return [];

    // Extract unique non-null colors
    const colorSet = new Set<string>();
    matchingModelsForColor.forEach((m) => {
      if (m.color && m.color !== "") {
        colorSet.add(m.color);
      }
    });

    return Array.from(colorSet).sort();
  }, [matchingModelsForColor]);

  // Determine if color selection is needed
  const needsColorSelection = useMemo(() => {
    return availableColors.length > 1;
  }, [availableColors]);

  // Auto-select color if only one option
  useEffect(() => {
    if (availableColors.length === 1 && selectedColor !== availableColors[0]) {
      setSelectedColor(availableColors[0]);
    } else if (availableColors.length === 0) {
      setSelectedColor(null);
    } else if (
      availableColors.length > 1 &&
      selectedColor &&
      !availableColors.includes(selectedColor)
    ) {
      // Reset if selected color is no longer available
      setSelectedColor(null);
    }
  }, [availableColors, selectedColor]);

  // Find the matching ModelPrice based on selections (including color)
  const selectedModelPrice = useMemo(() => {
    if (!selectedCategory || !selectedModelName) return null;

    // If color selection is needed but not selected, return null
    if (needsColorSelection && !selectedColor) return null;

    const matching = modelPrices.find((m) => {
      if (m.category !== selectedCategory) return false;

      // Match model name based on category
      let modelMatch = false;
      if (selectedCategory === "iphone") {
        modelMatch = m.modelName === selectedModelName;
      } else if (selectedCategory === "ps5") {
        // Match by checking if the model matches the selected display name pattern
        const isSlim = selectedModelName.includes("Slim");
        const isDigital = selectedModelName.includes("Digital");
        const modelIsSlim = m.modelName.includes("Slim");
        const modelIsDigital = m.modelName.includes("디지털");
        modelMatch = isSlim === modelIsSlim && isDigital === modelIsDigital;
      } else {
        modelMatch = m.modelName === selectedModelName;
      }

      if (!modelMatch) return false;

      // For iPhone, storage must match. For others, storage is not required
      if (selectedCategory === "iphone") {
        if (selectedStorage === "" || m.storageGb !== selectedStorage) {
          return false;
        }
      }

      // Match color if color dimension exists
      if (needsColorSelection) {
        // Must match selected color exactly
        return m.color === selectedColor;
      } else {
        // If no color dimension, match any (null/undefined/empty color)
        return !m.color || m.color === "" || m.color === null;
      }
    });

    return matching || null;
  }, [
    modelPrices,
    selectedCategory,
    selectedModelName,
    selectedStorage,
    selectedColor,
    needsColorSelection,
  ]);

  // Reset dependent selections when category changes
  const handleCategoryChange = (category: DeviceCategory | "") => {
    setSelectedCategory(category);
    setSelectedModelName("");
    setSelectedStorage("");
    setSelectedColor(null);
    // Update step: step 1 if no category, step 2 if category is selected
    if (category === "") {
      setCurrentStep(1);
    } else {
      setCurrentStep(2);
    }
  };

  // Reset storage and color when model changes
  const handleModelChange = (modelName: string) => {
    setSelectedModelName(modelName);
    setSelectedStorage("");
    setSelectedColor(null);
  };

  // Reset color when storage changes (for iPhone)
  const handleStorageChange = (storage: number | "") => {
    setSelectedStorage(storage);
    setSelectedColor(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const getModelDisplayName = (
    modelName: string,
    category: DeviceCategory
  ): string => {
    // Return cleaned model name for display
    if (category === "iphone") {
      // Show full model name: "iPhone 17", "iPhone 17 Plus", etc.
      return modelName;
    }
    if (category === "ps5") {
      // modelName is already formatted like "PlayStation 5 Standard", etc.
      // Just extract the variant part
      if (modelName.includes("Slim")) {
        return modelName.replace("PlayStation 5 ", "");
      }
      return modelName.replace("PlayStation 5 ", "");
    }
    if (category === "switch") {
      // Extract variant from full name
      if (modelName.includes("OLED")) return "OLED";
      if (modelName.includes("Lite")) return "Lite";
      return "Standard";
    }
    return modelName;
  };

  const handleGoToForm = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("DEBUG: handleGoToForm clicked");

    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();

    console.log("DEBUG: ", {
      selectedCategory,
      selectedModelName,
      selectedModelPrice: selectedModelPrice
        ? {
            _id: selectedModelPrice._id,
            modelName: selectedModelPrice.modelName,
          }
        : null,
    });

    if (!selectedModelPrice) {
      console.warn("Cannot proceed: no model selected");
      alert("모델을 선택해주세요.");
      return;
    }

    // Save current selection to localStorage
    const pendingSell = {
      category: selectedCategory,
      modelPriceId: selectedModelPrice._id,
      modelName: selectedModelName,
      storage: selectedStorage,
      color: selectedColor,
    };
    localStorage.setItem("pb-pending-sell", JSON.stringify(pendingSell));
    console.log("DEBUG: Saved to localStorage:", pendingSell);

    // Check auth and redirect
    const token = getUserToken();
    const isAuth = !!token;
    console.log("DEBUG: Auth check - token exists:", isAuth);

    if (!isAuth) {
      console.log("DEBUG: navigating to login");
      const loginPath = "/login?redirect=/sell/new";
      console.log("DEBUG: navigate path:", loginPath);
      navigate(loginPath, { replace: false });
      return;
    }

    console.log("DEBUG: navigating directly to form");
    navigate("/sell/new", { replace: false });
  };

  const hasSelectedDevice = !!selectedCategory;

  return (
    <div className="pb-sell-page pb-device-page-compact">
      {/* FULL-WIDTH, COMPACT HERO */}
      <section className="pb-hero-intro">
        <div className="pb-hero-intro-inner">
          <p className="pb-hero-eyebrow">
            신뢰할 수 있는 한국 기기 매입 서비스
          </p>
          <h1 className="pb-hero-title">한국에서 기기 매입, 쉽고 빠르게.</h1>
          <p className="pb-hero-body">
            간단한 신청과 한 번의 발송으로 안전하게 매입가를 입금받으세요.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT WITH STEP SIDEBAR */}
      <main className="pb-main">
        <div className="pb-page-layout">
          {/* Left: Step navigation */}
          <BuyFlowSteps currentStep={currentStep} />

          {/* Right: Main content */}
          <div className="pb-content-area">
            {/* DEVICE SELECTION SECTION */}
            <section
              className={`pb-card pb-device-card-section ${
                currentStep === 2 ? "pb-device-card-section--step2" : ""
              }`}
            >
              {error && <div className="pb-form-error">{error}</div>}
              {loading ? (
                <div className="pb-public-loading">
                  <LoadingSkeleton lines={4} />
                </div>
              ) : (
                <div className="selection-form">
                  {/* Step 1: Category Selection */}
                  {currentStep === 1 && (
                    <>
                      <div className="form-group">
                        <div className="pb-device-grid">
                          {categories.map((category) => {
                            const meta = CATEGORY_META[category];
                            if (!meta) return null;
                            const isSelected = selectedCategory === category;

                            return (
                              <button
                                key={category}
                                type="button"
                                className={`pb-device-card device-card ${
                                  isSelected
                                    ? "pb-device-card--active device-card--selected"
                                    : ""
                                }`}
                                onClick={() => handleCategoryChange(category)}
                                disabled={loading || categories.length === 0}
                              >
                                <div className="device-card__image-wrapper">
                                  <img
                                    src={meta.imageUrl}
                                    alt={meta.label}
                                    className="device-card__image"
                                    onError={(e) => {
                                      // Hide image if it fails to load
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                </div>
                                <div className="device-card__content">
                                  <div className="device-card__title">
                                    {meta.label}
                                  </div>
                                  <div className="device-card__subtitle">
                                    {meta.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2: Model / Storage / Color / Price */}
                  {currentStep === 2 && (
                    <div className="pb-device-step2">
                      {/* Level 2: Model Selection */}
                      {selectedCategory && (
                        <div className="form-group">
                          <div className="device-model-grid">
                            {modelNames.map((modelName) => {
                              const meta = MODEL_META[modelName] ?? {
                                label: getModelDisplayName(
                                  modelName,
                                  selectedCategory
                                ),
                                imageUrl: "/images/models/default.png",
                              };
                              const isSelected =
                                selectedModelName === modelName;

                              return (
                                <button
                                  key={modelName}
                                  type="button"
                                  className={`device-card device-card--model ${
                                    isSelected ? "device-card--selected" : ""
                                  }`}
                                  onClick={() => handleModelChange(modelName)}
                                  disabled={loading || modelNames.length === 0}
                                >
                                  <div className="device-card__image-wrapper">
                                    <img
                                      src={meta.imageUrl}
                                      alt={meta.label}
                                      className="device-card__image"
                                      onError={(e) => {
                                        // Hide image if it fails to load
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.display = "none";
                                      }}
                                    />
                                  </div>
                                  <div className="device-card__content">
                                    <div className="device-card__title">
                                      {meta.label}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Level 3: Storage Selection (for iPhone) */}
                      {selectedCategory === "iphone" &&
                        selectedModelName &&
                        storageOptions.length > 0 && (
                          <div className="form-group">
                            <div className="storage-pill-group">
                              {storageOptions.map((storage) => {
                                const isSelected = selectedStorage === storage;

                                return (
                                  <button
                                    key={storage}
                                    type="button"
                                    className={`storage-pill ${
                                      isSelected ? "storage-pill--selected" : ""
                                    }`}
                                    onClick={() => handleStorageChange(storage)}
                                    disabled={loading}
                                  >
                                    {storage}GB
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Level 4: Color Selection (if multiple colors exist) */}
                      {needsColorSelection &&
                        ((selectedCategory === "iphone" &&
                          selectedStorage !== "") ||
                          (selectedCategory !== "iphone" &&
                            selectedModelName)) && (
                          <div className="form-group">
                            <div className="color-picker">
                              {availableColors.map((color) => {
                                const colorMeta = COLOR_META[color] || {
                                  label: color,
                                };
                                const isSelected = selectedColor === color;
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`color-chip ${
                                      isSelected ? "color-chip--selected" : ""
                                    }`}
                                    onClick={() => setSelectedColor(color)}
                                    disabled={
                                      loading || availableColors.length === 0
                                    }
                                    aria-label={colorMeta.label}
                                    title={colorMeta.label}
                                  >
                                    {colorMeta.imageUrl ? (
                                      <img
                                        src={colorMeta.imageUrl}
                                        alt={colorMeta.label}
                                        className="color-chip__image"
                                        onError={(e) => {
                                          // Fallback to swatch if image fails to load
                                          const target =
                                            e.target as HTMLImageElement;
                                          target.style.display = "none";
                                          const fallback =
                                            target.nextElementSibling as HTMLElement;
                                          if (fallback) {
                                            fallback.style.display = "block";
                                          }
                                        }}
                                      />
                                    ) : null}
                                    {colorMeta.hex && (
                                      <span
                                        className="color-chip__swatch"
                                        style={{
                                          backgroundColor: colorMeta.hex,
                                          display: colorMeta.imageUrl
                                            ? "none"
                                            : "block",
                                        }}
                                      />
                                    )}
                                    <span className="color-chip__label">
                                      {colorMeta.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Show single color as read-only if only one option */}
                      {!needsColorSelection &&
                        availableColors.length === 1 &&
                        ((selectedCategory === "iphone" &&
                          selectedStorage !== "") ||
                          (selectedCategory !== "iphone" &&
                            selectedModelName)) && (
                          <div className="form-group">
                            <label htmlFor="color-display">색상</label>
                            <div className="color-picker">
                              {(() => {
                                const color = availableColors[0];
                                const colorMeta = COLOR_META[color] || {
                                  label: color,
                                };
                                return (
                                  <div
                                    className="color-chip color-chip--selected"
                                    aria-label={colorMeta.label}
                                  >
                                    {colorMeta.imageUrl ? (
                                      <img
                                        src={colorMeta.imageUrl}
                                        alt={colorMeta.label}
                                        className="color-chip__image"
                                        onError={(e) => {
                                          // Fallback to swatch if image fails to load
                                          const target =
                                            e.target as HTMLImageElement;
                                          target.style.display = "none";
                                          const fallback =
                                            target.nextElementSibling as HTMLElement;
                                          if (fallback) {
                                            fallback.style.display = "block";
                                          }
                                        }}
                                      />
                                    ) : null}
                                    {colorMeta.hex && (
                                      <span
                                        className="color-chip__swatch"
                                        style={{
                                          backgroundColor: colorMeta.hex,
                                          display: colorMeta.imageUrl
                                            ? "none"
                                            : "block",
                                        }}
                                      />
                                    )}
                                    <span className="color-chip__label">
                                      {colorMeta.label}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                      {/* Price Display */}
                      {selectedModelPrice && (
                        <div className="pb-price-block">
                          <div className="pb-price-value">
                            {formatPrice(selectedModelPrice.buyPrice)}
                          </div>
                          <div className="pb-price-details">
                            {selectedModelPrice.modelName}
                            {selectedModelPrice.storageGb &&
                              ` (${selectedModelPrice.storageGb}GB)`}
                            {selectedModelPrice.color &&
                              ` - ${selectedModelPrice.color}`}
                          </div>
                        </div>
                      )}

                      {/* CTA Button to proceed to form */}
                      {hasSelectedDevice && selectedModelPrice && (
                        <div className="pb-device-cta-row">
                          <button
                            type="button"
                            className="pb-primary-button pb-primary-button--large"
                            onClick={handleGoToForm}
                            disabled={false}
                          >
                            {isAuthenticated
                              ? "판매 신청 계속하기"
                              : "로그인하고 판매하기"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicBuyRequest;
