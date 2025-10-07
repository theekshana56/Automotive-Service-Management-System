import React from 'react';

const FreeMap = ({
  center = [40.7128, -74.0060],
  zoom = 13,
  serviceRequests = [],
  mechanics = [],
  userLocation = null,
  onLocationSelect = null,
  selectedLocation = null,
  height = '400px'
}) => {
  return (
    <div style={{
      height,
      width: '100%',
      backgroundColor: '#f0f0f0',
      border: '2px dashed #ccc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px'
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Interactive Map</h3>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Map functionality will be implemented here
        </p>
        <div style={{ fontSize: '14px', color: '#888' }}>
          <p>Center: {center[0]}, {center[1]}</p>
          <p>Zoom: {zoom}</p>
          {userLocation && <p>User Location: {userLocation.latitude}, {userLocation.longitude}</p>}
          {serviceRequests.length > 0 && <p>Service Requests: {serviceRequests.length}</p>}
          {mechanics.length > 0 && <p>Mechanics: {mechanics.length}</p>}
        </div>
      </div>
    </div>
  );
};

export default FreeMap;
