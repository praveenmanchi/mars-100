import React, { useState, useCallback } from 'react';

// Enhanced NASA Camera Gallery with Modal and Advanced Features
const NASACameraGallery = ({ cameras }) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [modalImage, setModalImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Lazy load images for performance
  const handleImageLoad = useCallback((imageIndex) => {
    setLoadedImages(prev => new Set([...prev, imageIndex]));
  }, []);
  
  // Enhanced camera categorization
  const categorizeCamera = (cameraName) => {
    const name = cameraName.toLowerCase();
    if (name.includes('front') || name.includes('fhaz')) return 'front';
    if (name.includes('rear') || name.includes('rhaz') || name.includes('back')) return 'rear';
    if (name.includes('nav') || name.includes('navigation')) return 'navigation';
    if (name.includes('mast') || name.includes('mastcam')) return 'mast';
    if (name.includes('mahli') || name.includes('hand')) return 'hand';
    if (name.includes('mardi') || name.includes('descent')) return 'descent';
    if (name.includes('chemcam') || name.includes('supercam')) return 'science';
    return 'other';
  };
  
  // Get all images with metadata
  const getAllImagesWithMetadata = useCallback(() => {
    if (!cameras || cameras.length === 0) return [];
    
    return cameras.flatMap(camera => 
      camera.images.map(image => ({
        ...image,
        cameraName: camera.name,
        category: categorizeCamera(camera.name),
        metadata: {
          timestamp: image.timestamp || new Date().toISOString(),
          location: image.location || { lat: 18.4447, lon: 77.4508 },
          sol: image.sol || 1000,
          localTime: image.local_time || '15:30:45',
          cameraType: camera.name
        }
      }))
    );
  }, [cameras]);
  
  // Filter images based on selected tab
  const filteredImages = React.useMemo(() => {
    const allImages = getAllImagesWithMetadata();
    if (selectedTab === 'all') return allImages;
    return allImages.filter(img => img.category === selectedTab);
  }, [getAllImagesWithMetadata, selectedTab]);
  
  // Tab configuration
  const tabs = React.useMemo(() => {
    const allImages = getAllImagesWithMetadata();
    const tabCounts = allImages.reduce((acc, img) => {
      acc[img.category] = (acc[img.category] || 0) + 1;
      return acc;
    }, {});
    
    return [
      { key: 'all', label: 'ALL CAMERAS', count: allImages.length },
      { key: 'front', label: 'FRONT HAZARD', count: tabCounts.front || 0 },
      { key: 'rear', label: 'REAR HAZARD', count: tabCounts.rear || 0 },
      { key: 'navigation', label: 'NAVIGATION', count: tabCounts.navigation || 0 },
      { key: 'mast', label: 'MAST CAMERAS', count: tabCounts.mast || 0 },
      { key: 'science', label: 'SCIENCE', count: tabCounts.science || 0 },
      { key: 'hand', label: 'ARM CAMERAS', count: tabCounts.hand || 0 }
    ].filter(tab => tab.count > 0);
  }, [getAllImagesWithMetadata]);
  
  // Handle image click to open modal
  const handleImageClick = useCallback((image) => {
    setModalImage(image);
    setModalOpen(true);
  }, []);
  
  // Handle image download
  const handleDownload = useCallback(async (image) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mars-rover-${image.metadata.sol}-${image.cameraName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(image.url, '_blank');
    }
  }, []);
  
  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setModalImage(null);
  }, []);
  
  // Handle keyboard navigation in modal
  const handleKeyDown = useCallback((e) => {
    if (!modalOpen) return;
    
    if (e.key === 'Escape') {
      handleModalClose();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const currentIndex = filteredImages.findIndex(img => img.url === modalImage?.url);
      let nextIndex;
      
      if (e.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
      } else {
        nextIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
      }
      
      setModalImage(filteredImages[nextIndex]);
    }
  }, [modalOpen, modalImage, filteredImages, handleModalClose]);
  
  // Add keyboard event listener
  React.useEffect(() => {
    if (modalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [modalOpen, handleKeyDown]);
  
  if (!cameras || cameras.length === 0) {
    return (
      <div className="nasa-camera-section">
        <div className="section-header">
          <h3>CAMERA SYSTEMS</h3>
          <div className="image-count">0 Images</div>
        </div>
        <div className="no-images">No images available</div>
      </div>
    );
  }
  
  return (
    <div className="nasa-camera-section">
      <div className="section-header">
        <h3>CAMERA SYSTEMS</h3>
        <div className="image-count">{filteredImages.length} Images</div>
      </div>
      
      {/* Enhanced Tab Navigation */}
      <div className="camera-tabs-enhanced">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`nasa-camera-tab-enhanced ${selectedTab === tab.key ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.key)}
          >
            <div className="tab-label">{tab.label}</div>
            <div className="tab-count">{tab.count}</div>
          </button>
        ))}
      </div>
      
      {/* Image Grid */}
      <div className="nasa-camera-grid-enhanced">
        {filteredImages.slice(0, 12).map((image, index) => (
          <div 
            key={`${image.url}-${index}`} 
            className="nasa-camera-image-enhanced"
            onClick={() => handleImageClick(image)}
          >
            <img 
              src={image.url} 
              alt={`${image.cameraName} ${index + 1}`}
              loading="lazy"
              onLoad={() => handleImageLoad(index)}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5PIElNQUdFPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
            {!loadedImages.has(index) && (
              <div className="image-loader">Loading...</div>
            )}
            <div className="image-overlay">
              <div className="image-info">
                <div className="camera-name">{image.cameraName}</div>
                <div className="image-sol">SOL {image.metadata.sol}</div>
              </div>
              <div className="image-actions">
                <button 
                  className="action-btn view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(image);
                  }}
                >
                  🔍
                </button>
                <button 
                  className="action-btn download-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image);
                  }}
                >
                  ⬇
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Enhanced Image Modal */}
      {modalOpen && modalImage && (
        <div className="nasa-image-modal" onClick={handleModalClose}>
          <div className="modal-overlay"></div>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h3>{modalImage.cameraName}</h3>
                <div className="modal-subtitle">SOL {modalImage.metadata.sol} • {modalImage.metadata.localTime}</div>
              </div>
              <button className="modal-close" onClick={handleModalClose}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-image-container">
                <img 
                  src={modalImage.url} 
                  alt={modalImage.cameraName}
                  className="modal-image"
                />
                <div className="modal-navigation">
                  <button 
                    className="nav-btn prev-btn"
                    onClick={() => {
                      const currentIndex = filteredImages.findIndex(img => img.url === modalImage.url);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
                      setModalImage(filteredImages[prevIndex]);
                    }}
                  >
                    ‹
                  </button>
                  <button 
                    className="nav-btn next-btn"
                    onClick={() => {
                      const currentIndex = filteredImages.findIndex(img => img.url === modalImage.url);
                      const nextIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
                      setModalImage(filteredImages[nextIndex]);
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
              
              <div className="modal-metadata">
                <div className="metadata-section">
                  <h4>IMAGE METADATA</h4>
                  <div className="metadata-grid">
                    <div className="metadata-item">
                      <span className="metadata-label">TIMESTAMP</span>
                      <span className="metadata-value">{new Date(modalImage.metadata.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">SOL</span>
                      <span className="metadata-value">{modalImage.metadata.sol}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">LOCAL TIME</span>
                      <span className="metadata-value">{modalImage.metadata.localTime}</span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">LOCATION</span>
                      <span className="metadata-value">
                        {modalImage?.metadata?.location?.lat?.toFixed(4) || '0.0000'}°N, {modalImage?.metadata?.location?.lon?.toFixed(4) || '0.0000'}°E
                      </span>
                    </div>
                    <div className="metadata-item">
                      <span className="metadata-label">CAMERA TYPE</span>
                      <span className="metadata-value">{modalImage.metadata.cameraType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    className="modal-action-btn download-action"
                    onClick={() => handleDownload(modalImage)}
                  >
                    ⬇ DOWNLOAD IMAGE
                  </button>
                  <button 
                    className="modal-action-btn view-original"
                    onClick={() => window.open(modalImage.url, '_blank')}
                  >
                    🔗 VIEW ORIGINAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NASACameraGallery;