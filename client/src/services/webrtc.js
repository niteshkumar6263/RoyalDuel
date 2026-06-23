import socket from "./socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const initializePeerConnection = (
  onRemoteStream,
  onIceCandidate,
  localStream,
) => {
  const peerConnection = new RTCPeerConnection(ICE_SERVERS);
  const remoteStream = new MediaStream();

  // Add local stream tracks
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  }

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    console.log("Remote track received:", event.track.kind);

    if (onRemoteStream) {
      if (event.streams[0]) {
        onRemoteStream(event.streams[0]);
      } else {
        remoteStream.addTrack(event.track);
        onRemoteStream(remoteStream);
      }
    }
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  // Log connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state:", peerConnection.connectionState);
  };

  return peerConnection;
};

export const createOffer = async (peerConnection) => {
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peerConnection.setLocalDescription(offer);
    return offer;
  } catch (error) {
    console.error("Error creating offer:", error);
  }
};

export const createAnswer = async (peerConnection) => {
  try {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  } catch (error) {
    console.error("Error creating answer:", error);
  }
};

export const handleOffer = async (peerConnection, offer) => {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  } catch (error) {
    console.error("Error handling offer:", error);
  }
};

export const handleAnswer = async (peerConnection, answer) => {
  try {
    if (peerConnection.signalingState === "have-local-offer") {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer),
      );
    }
  } catch (error) {
    console.error("Error handling answer:", error);
  }
};

export const handleIceCandidate = async (peerConnection, candidate) => {
  try {
    if (candidate && peerConnection.remoteDescription) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (error) {
    console.error("Error adding ICE candidate:", error);
  }
};

export const setupSignaling = (peerConnection, roomId) => {
  const pendingCandidates = [];

  const flushPendingCandidates = async () => {
    while (pendingCandidates.length > 0 && peerConnection.remoteDescription) {
      const candidate = pendingCandidates.shift();
      await handleIceCandidate(peerConnection, candidate);
    }
  };

  // Listen for offer
  const onOffer = async ({ offer }) => {
    await handleOffer(peerConnection, offer);
    await flushPendingCandidates();
    const answer = await createAnswer(peerConnection);
    socket.emit("webrtc-answer", { roomId, answer });
  };

  // Listen for answer
  const onAnswer = async ({ answer }) => {
    await handleAnswer(peerConnection, answer);
    await flushPendingCandidates();
  };

  // Listen for ICE candidates
  const onIceCandidate = async ({ candidate }) => {
    if (!peerConnection.remoteDescription) {
      pendingCandidates.push(candidate);
      return;
    }

    await handleIceCandidate(peerConnection, candidate);
  };

  socket.on("webrtc-offer", onOffer);
  socket.on("webrtc-answer", onAnswer);
  socket.on("webrtc-ice-candidate", onIceCandidate);

  return () => {
    socket.off("webrtc-offer", onOffer);
    socket.off("webrtc-answer", onAnswer);
    socket.off("webrtc-ice-candidate", onIceCandidate);
  };
};

export const sendIceCandidate = (roomId, candidate) => {
  socket.emit("webrtc-ice-candidate", { roomId, candidate });
};

export const sendOffer = (roomId, offer) => {
  socket.emit("webrtc-offer", { roomId, offer });
};

export const sendAnswer = (roomId, answer) => {
  socket.emit("webrtc-answer", { roomId, answer });
};
