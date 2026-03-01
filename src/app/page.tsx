"use client";

import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useRemoteParticipants,
  useTracks,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

// ============================================
// STYLES
// ============================================
const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "900px",
    background: "#1a1a1a",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
  },
  header: {
    background: "linear-gradient(135deg, #c47135 0%, #d68950 100%)",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    margin: "5px 0 0 0",
    fontSize: "14px",
  },
  videoContainer: {
    width: "100%",
    height: "500px",
    background: "#000",
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    background: "#2a2a2a",
    padding: "20px 30px",
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "15px 20px",
    border: "2px solid #444",
    borderRadius: "25px",
    background: "#1a1a1a",
    color: "white",
    fontSize: "16px",
    outline: "none",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #c47135 0%, #d68950 100%)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    fontSize: "20px",
    cursor: "pointer",
  },
  micBtn: {
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    fontSize: "20px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  connectBtn: {
    background: "linear-gradient(135deg, #c47135 0%, #d68950 100%)",
    color: "white",
    padding: "20px 50px",
    border: "none",
    borderRadius: "50px",
    fontSize: "20px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(196,113,53,0.4)",
    transition: "all 0.3s ease",
  },
  loadingText: {
    color: "white",
    textAlign: "center" as const,
  },
  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
    marginRight: "8px",
  },
  backLink: {
    color: "rgba(255,255,255,0.6)",
    textDecoration: "none",
    fontSize: "14px",
    marginBottom: "20px",
    display: "block",
  },
};

// ============================================
// AVATAR VIDEO DISPLAY
// ============================================
function AvatarVideo() {
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  // Find the avatar's video track (not the local user)
  const avatarTrack = tracks.find(
    (t) => !t.participant.isLocal && t.source === Track.Source.Camera
  );

  if (!avatarTrack) {
    return (
      <div style={styles.videoContainer}>
        <div style={styles.loadingText}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎥</div>
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>
            Connecting to Ginger...
          </div>
          <div style={{ fontSize: "14px", opacity: 0.7 }}>
            Setting up your video chat session
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.videoContainer}>
      <VideoTrack
        trackRef={avatarTrack}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

// ============================================
// CHAT CONTROLS (Text + Mic)
// ============================================
function ChatControls() {
  const [message, setMessage] = useState("");
  const [micEnabled, setMicEnabled] = useState(false);
  const room = useRoomContext();

  // FIX: Send text via LiveKit's built-in text protocol
  // This is what RoomInputOptions(text_enabled=True) listens for on the agent
  const sendMessage = useCallback(async () => {
    const text = message.trim();
    if (!text || !room) return;

    setMessage("");

    try {
      // Use LiveKit's native sendText — this reaches the agent's text input
      await room.localParticipant.sendText(text, {
        topic: "lk-chat-topic",
        destinationIdentities: [],
      });
    } catch (error) {
      console.error("Failed to send message:", error);

      // Fallback: try the data channel method for older SDK versions
      try {
        const encoder = new TextEncoder();
        const payload = JSON.stringify({
          type: "user_text",
          text: text,
          timestamp: Date.now(),
        });
        await room.localParticipant.publishData(encoder.encode(payload), {
          reliable: true,
          topic: "lk-chat-topic",
        });
      } catch (fallbackError) {
        console.error("Fallback send also failed:", fallbackError);
      }
    }
  }, [message, room]);

  // Toggle microphone for voice chat
  const toggleMic = useCallback(async () => {
    if (!room) return;

    try {
      const newState = !micEnabled;
      await room.localParticipant.setMicrophoneEnabled(newState);
      setMicEnabled(newState);
    } catch (error) {
      console.error("Failed to toggle microphone:", error);
    }
  }, [micEnabled, room]);

  return (
    <div style={styles.controls}>
      {/* Mic toggle button */}
      <button
        onClick={toggleMic}
        style={{
          ...styles.micBtn,
          background: micEnabled
            ? "linear-gradient(135deg, #28a745 0%, #34c759 100%)"
            : "#444",
          color: "white",
        }}
        title={micEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {micEnabled ? "🎙️" : "🔇"}
      </button>

      {/* Text input */}
      <input
        type="text"
        placeholder="Type your message to Ginger..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
  const isAgentConnected = participants.length > 0;

  return (
    <div
      style={{
        padding: "8px 20px",
        background: "#222",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        color: isAgentConnected
          ? "rgba(40,167,69,0.9)"
          : "rgba(255,255,255,0.5)",
      }}
    >
      <span
        style={{
          ...styles.statusDot,
          background: isAgentConnected ? "#28a745" : "#666",
        }}
      />
      {isAgentConnected ? "Ginger is live" : "Waiting for Ginger to connect..."}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function GingerChat() {
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const startChat = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: `ginger-chat-${Date.now()}`,
          participantName: `visitor-${Math.random().toString(36).slice(2, 8)}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get chat token");
      }

      const data = await response.json();
      setToken(data.token);
      setRoomName(data.roomName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnecting(false);
    }
  };

  // Pre-connection screen
  if (!token) {
    return (
      <div style={styles.container}>
        <a href="https://dallasiteontour.org" style={styles.backLink}>
          ← Back to Dallasite On Tour
        </a>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h3 style={styles.headerTitle}>Video Chat with Ginger</h3>
              <p style={styles.headerSubtitle}>Luxury Travel Curator</p>
            </div>
          </div>
          <div
            style={{
              ...styles.videoContainer,
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ fontSize: "80px" }}>🌴</div>
            <div style={{ color: "white", textAlign: "center", padding: "0 40px" }}>
              <h2 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>
                Chat with Ginger Pelirroja
              </h2>
              <p
                style={{
                  opacity: 0.7,
                  fontSize: "16px",
                  lineHeight: 1.6,
                  marginBottom: "30px",
                }}
              >
                Get personalized luxury travel advice and discover how to save
                up to 65% on 5-star hotels and resorts worldwide.
              </p>
              {error && (
                <p style={{ color: "#dc3545", marginBottom: "20px" }}>
                  {error}
                </p>
              )}
              <button
                onClick={startChat}
                disabled={isConnecting}
                style={{
                  ...styles.connectBtn,
                  opacity: isConnecting ? 0.7 : 1,
                }}
              >
                {isConnecting ? "Connecting..." : "🎥 Start Video Chat"}
              </button>
              <p
                style={{
                  opacity: 0.5,
                  fontSize: "13px",
                  marginTop: "15px",
                }}
              >
                Microphone access required for voice chat
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active chat screen
  return (
    <div style={styles.container}>
      <a href="https://dallasiteontour.org" style={styles.backLink}>
        ← Back to Dallasite On Tour
      </a>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.headerTitle}>Video Chat with Ginger</h3>
            <p style={styles.headerSubtitle}>Luxury Travel Curator</p>
          </div>
          <button
            onClick={() => {
              setToken(null);
              setRoomName(null);
              setIsConnecting(false);
            }}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        {livekitUrl && (
          <LiveKitRoom
            serverUrl={livekitUrl}
            token={token}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={() => {
              setToken(null);
              setRoomName(null);
              setIsConnecting(false);
            }}
          >
            {/* FIX 1: This component plays ALL remote audio (Ginger's voice) */}
            <RoomAudioRenderer />

            <ConnectionStatus />
            <AvatarVideo />
            <ChatControls />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}
