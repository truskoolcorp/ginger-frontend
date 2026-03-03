'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useTracks,
  useRoomContext,
  useRemoteParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

// ============================================
// STYLES
// ============================================
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  // Embed overrides — no padding, fill the iframe
  containerEmbed: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'stretch',
    padding: '0',
  },
  card: {
    width: '100%',
    maxWidth: '900px',
    background: '#1a1a1a',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
  },
  // Embed overrides — fill iframe, no rounded corners
  cardEmbed: {
    width: '100%',
    maxWidth: '100%',
    background: '#1a1a1a',
    borderRadius: '0',
    overflow: 'hidden',
    boxShadow: 'none',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    background: 'linear-gradient(135deg, #c47135 0%, #d68950 100%)',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    margin: '5px 0 0 0',
    fontSize: '14px',
  },
  videoContainer: {
    width: '100%',
    height: '500px',
    background: '#000',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainerEmbed: {
    width: '100%',
    flex: 1,
    minHeight: '300px',
    background: '#000',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    background: '#2a2a2a',
    padding: '20px 30px',
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '15px 20px',
    border: '2px solid #444',
    borderRadius: '25px',
    background: '#1a1a1a',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #c47135 0%, #d68950 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    fontSize: '20px',
    cursor: 'pointer',
  },
  micBtn: {
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  connectBtn: {
    background: 'linear-gradient(135deg, #c47135 0%, #d68950 100%)',
    color: 'white',
    padding: '20px 50px',
    border: 'none',
    borderRadius: '50px',
    fontSize: '20px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(196,113,53,0.4)',
    transition: 'all 0.3s ease',
  },
  loadingText: {
    color: 'white',
    textAlign: 'center' as const,
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '8px',
  },
  backLink: {
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none',
    fontSize: '14px',
    marginBottom: '20px',
    display: 'block',
  },
};

// ============================================
// VIDEO COMPONENT
// ============================================
function AvatarVideo({ isEmbed }: { isEmbed: boolean }) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const avatarTrack = tracks.find(
    (t) => !t.participant.isLocal && t.source === Track.Source.Camera
  );

  if (avatarTrack) {
    return (
      <div style={isEmbed ? styles.videoContainerEmbed : styles.videoContainer}>
        <VideoTrack
          trackRef={avatarTrack}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div style={isEmbed ? styles.videoContainerEmbed : styles.videoContainer}>
      <div style={styles.loadingText}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎥</div>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          Connecting to Ginger...
        </div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>
          Setting up your video chat session
        </div>
      </div>
    </div>
  );
}

// ============================================
// CHAT CONTROLS
// ============================================
function ChatControls() {
  const [message, setMessage] = useState('');
  const [micEnabled, setMicEnabled] = useState(false);
  const room = useRoomContext();

  const sendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || !room) return;

    setMessage('');

    try {
      await room.localParticipant.sendText(text, {
        topic: 'lk-chat-topic',
        destinationIdentities: [],
      });
    } catch (e) {
      console.error('Failed to send message:', e);
      try {
        const encoder = new TextEncoder();
        const data = JSON.stringify({
          type: 'user_text',
          text: text,
          timestamp: Date.now(),
        });
        await room.localParticipant.publishData(encoder.encode(data), {
          reliable: true,
          topic: 'lk-chat-topic',
        });
      } catch (fallbackErr) {
        console.error('Fallback send also failed:', fallbackErr);
      }
    }
  }, [message, room]);

  const toggleMic = useCallback(async () => {
    if (!room) return;
    try {
      const newState = !micEnabled;
      await room.localParticipant.setMicrophoneEnabled(newState);
      setMicEnabled(newState);
    } catch (e) {
      console.error('Failed to toggle microphone:', e);
    }
  }, [micEnabled, room]);

  return (
    <div style={styles.controls}>
      <button
        onClick={toggleMic}
        style={{
          ...styles.micBtn,
          background: micEnabled
            ? 'linear-gradient(135deg, #28a745 0%, #34c759 100%)'
            : '#444',
          color: 'white',
        }}
        title={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micEnabled ? '🎙️' : '🔇'}
      </button>
      <input
        type="text"
        placeholder="Type your message to Ginger..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        style={styles.input}
      />
      <button onClick={sendMessage} style={styles.sendBtn}>
        ➤
      </button>
    </div>
  );
}

// ============================================
// CONNECTION STATUS
// ============================================
function ConnectionStatus() {
  const participants = useRemoteParticipants();
  const isConnected = participants.length > 0;

  return (
    <div
      style={{
        padding: '8px 20px',
        background: '#222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        color: isConnected ? 'rgba(40,167,69,0.9)' : 'rgba(255,255,255,0.5)',
      }}
    >
      <span
        style={{
          ...styles.statusDot,
          background: isConnected ? '#28a745' : '#666',
        }}
      />
      {isConnected ? 'Ginger is live' : 'Waiting for Ginger to connect...'}
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmbed, setIsEmbed] = useState(false);

  const LIVEKIT_URL = 'wss://dallasite-ginger-86dob45r.livekit.cloud';

  // Detect embed mode from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsEmbed(params.get('embed') === 'true');
  }, []);

  const connect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `ginger-chat-${Date.now()}`,
          participantName: `visitor-${Math.random().toString(36).slice(2, 8)}`,
        }),
      });

      if (!res.ok) throw new Error('Failed to get chat token');

      const data = await res.json();
      setToken(data.token);
      setRoomName(data.roomName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnecting(false);
    }
  };

  // ---- CONNECTED STATE ----
  if (token) {
    return (
      <div style={isEmbed ? styles.containerEmbed : styles.container}>
        {!isEmbed && (
          <a href="https://dallasiteontour.org" style={styles.backLink}>
            ← Back to Dallasite On Tour
          </a>
        )}
        <div style={isEmbed ? styles.cardEmbed : styles.card}>
          {!isEmbed && (
            <div style={styles.header}>
              <div>
                <h3 style={styles.headerTitle}>Video Chat with Ginger</h3>
                <p style={styles.headerSubtitle}>Luxury Travel Curator</p>
              </div>
              <button
                onClick={() => {
                  setToken(null);
                  setRoomName(null);
                  setConnecting(false);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          )}
          {LIVEKIT_URL && (
            <LiveKitRoom
              serverUrl={LIVEKIT_URL}
              token={token}
              connect={true}
              audio={true}
              video={false}
              onDisconnected={() => {
                setToken(null);
                setRoomName(null);
                setConnecting(false);
              }}
            >
              <RoomAudioRenderer />
              <ConnectionStatus />
              <AvatarVideo isEmbed={isEmbed} />
              <ChatControls />
            </LiveKitRoom>
          )}
        </div>
      </div>
    );
  }

  // ---- LANDING STATE ----
  return (
    <div style={isEmbed ? styles.containerEmbed : styles.container}>
      {!isEmbed && (
        <a href="https://dallasiteontour.org" style={styles.backLink}>
          ← Back to Dallasite On Tour
        </a>
      )}
      <div style={isEmbed ? styles.cardEmbed : styles.card}>
        {!isEmbed && (
          <div style={styles.header}>
            <div>
              <h3 style={styles.headerTitle}>Video Chat with Ginger</h3>
              <p style={styles.headerSubtitle}>Luxury Travel Curator</p>
            </div>
          </div>
        )}
        <div
          style={{
            ...(isEmbed ? styles.videoContainerEmbed : styles.videoContainer),
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ fontSize: '80px' }}>🌴</div>
          <div style={{ color: 'white', textAlign: 'center', padding: '0 40px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
              Chat with Ginger Pelirroja
            </h2>
            <p
              style={{
                opacity: 0.7,
                fontSize: '16px',
                lineHeight: 1.6,
                marginBottom: '30px',
              }}
            >
              Get personalized luxury travel advice and discover how to save up
              to 65% on 5-star hotels and resorts worldwide.
            </p>
            {error && (
              <p style={{ color: '#dc3545', marginBottom: '20px' }}>{error}</p>
            )}
            <button
              onClick={connect}
              disabled={connecting}
              style={{ ...styles.connectBtn, opacity: connecting ? 0.7 : 1 }}
            >
              {connecting ? 'Connecting...' : '🎥 Start Video Chat'}
            </button>
            <p style={{ opacity: 0.5, fontSize: '13px', marginTop: '15px' }}>
              Microphone access required for voice chat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
