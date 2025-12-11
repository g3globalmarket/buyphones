import { useState, useEffect } from "react";
import "../pages/AdminDashboard.css";

interface PhotoModalProps {
  isOpen: boolean;
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}

const PhotoModal = ({
  isOpen,
  photos,
  initialIndex = 0,
  onClose,
}: PhotoModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < photos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, photos.length, onClose]);

  if (!isOpen || photos.length === 0) {
    return null;
  }

  return (
    <div className="pb-admin-photo-modal-backdrop" onClick={onClose}>
      <div
        className="pb-admin-photo-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pb-admin-photo-modal-header">
          <h3>제품 사진</h3>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="pb-admin-photo-modal-main">
          <img
            src={photos[currentIndex]}
            alt={`제품 사진 ${currentIndex + 1}`}
          />
        </div>

        <div className="pb-admin-photo-modal-thumbs">
          {photos.map((url, index) => (
            <button
              key={index}
              type="button"
              className={
                "pb-admin-photo-modal-thumb" +
                (index === currentIndex
                  ? " pb-admin-photo-modal-thumb--active"
                  : "")
              }
              onClick={() => setCurrentIndex(index)}
            >
              <img src={url} alt={`썸네일 ${index + 1}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;
