import React from 'react';

const AudioUpload = ({
  audioUrl,
  setAudioFile,
  handleAddAudio,
  loading,
  styles
}) => {
  return (
    <div style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎵</div>
        <h3 style={{ color: '#667eea' }}>Upload Audio File</h3>
      </div>
      <input 
        type="file" 
        accept="audio/*" 
        onChange={(e) => setAudioFile(e.target.files[0])} 
        style={styles.input} 
      />

      {audioUrl && (
        <div style={{ marginTop: '10px' }}>
          <p>Preview:</p>
          <audio controls src={audioUrl} style={{ width: '100%' }} />
        </div>
      )}

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button style={styles.button} onClick={handleAddAudio} disabled={loading}>
          {loading ? 'Uploading...' : '➕ Upload Audio'}
        </button>
      </div>
    </div>
  );
};
export default AudioUpload;