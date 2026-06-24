import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  MessageSquare,
  PhoneOff,
  Send,
  Users,
  Volume2,
  Lock,
} from 'lucide-react';

const VideoHearing = () => {
  const { hearingId } = useParams();
  const { user } = useSelector((state) => state.auth);

  // Video/Audio states
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  // Local WebCam Feed
  const [localStream, setLocalStream] = useState(null);

  // WebRTC States
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [isWaiting, setIsWaiting] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoActive, screenShareActive]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isWaiting]);

  // Mock in-room messages
  const [roomMessages, setRoomMessages] = useState([
    { sender: 'Justice Anita Devi', text: 'Welcome to this digital bench session. We are waiting for the respondent counsel.' },
    { sender: 'Registrar', text: 'This trial is officially being recorded for judicial filing.' }
  ]);
  const [newRoomMsg, setNewRoomMsg] = useState('');

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const iceCandidatesQueue = useRef([]);

  const createPeerConnection = (targetSocketId) => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc_ice_candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote track
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(new MediaStream(event.streams[0]));
      } else {
        setRemoteStream((prev) => {
          if (prev) {
            if (prev.getTracks().find((t) => t.id === event.track.id)) {
              return prev;
            }
            const newStream = new MediaStream(prev);
            newStream.addTrack(event.track);
            return newStream;
          } else {
            return new MediaStream([event.track]);
          }
        });
      }
    };

    return pc;
  };

  // Start webcam feed and connect socket on mount
  useEffect(() => {
    if (!user || !hearingId) return;

    let streamInstance = null;

    const startCamAndConnect = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
        streamInstance = stream;
      } catch (err) {
        console.warn('Webcam permission not granted or device not found.', err);
      }

      // Connect to Socket.IO signaling server
      const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      // Helper to empty queued candidates after remote description is set
      const processCandidatesQueue = async () => {
        if (pcRef.current && pcRef.current.remoteDescription) {
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('Error adding queued ICE candidate:', e);
            }
          }
        }
      };

      // Join the hearing room
      socket.emit('join_hearing', {
        hearingId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
      });

      socket.on('connect_error', (err) => {
        console.log('Signaling socket connection deferred: server offline.');
      });

      // Receive existing peers
      socket.on('current_peers', (peers) => {
        if (peers && peers.length > 0) {
          const peer = peers[0]; // 1-to-1 setup: take first peer
          setPeerInfo(peer);
          setIsWaiting(false);
          // Glare prevention: the peer joining (B) waits for the existing peer (A) to call initiateCall
        }
      });

      // Peer joined
      socket.on('peer_joined', (peer) => {
        setPeerInfo(peer);
        setIsWaiting(false);
        iceCandidatesQueue.current = []; // Reset queue for new connection
        initiateCall(peer.socketId);
        toast.success(`${peer.userName} (${peer.userRole}) joined the hearing.`);
      });

      // Peer left
      socket.on('peer_left', ({ socketId }) => {
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        setRemoteStream(null);
        setPeerInfo(null);
        setIsWaiting(true);
        toast.error('The other participant disconnected.');
      });

      // WebRTC Offer
      socket.on('webrtc_offer', async ({ senderSocketId, sdp }) => {
        iceCandidatesQueue.current = []; // Clear old candidates
        const pc = createPeerConnection(senderSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', {
          targetSocketId: senderSocketId,
          sdp: answer,
        });
        await processCandidatesQueue();
      });

      // WebRTC Answer
      socket.on('webrtc_answer', async ({ senderSocketId, sdp }) => {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          await processCandidatesQueue();
        }
      });

      // ICE Candidate
      socket.on('webrtc_ice_candidate', async ({ senderSocketId, candidate }) => {
        if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        } else {
          iceCandidatesQueue.current.push(candidate);
        }
      });
    };

    const initiateCall = async (targetSocketId) => {
      const pc = createPeerConnection(targetSocketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('webrtc_offer', {
        targetSocketId,
        sdp: offer,
      });
    };

    startCamAndConnect();

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.emit('leave_hearing', hearingId);
        socketRef.current.disconnect();
      }
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, [user, hearingId]);

  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !micActive;
      });
    }
    setMicActive(!micActive);
    toast.success(micActive ? 'Microphone muted' : 'Microphone unmuted');
  };

  const handleToggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoActive;
      });
    }
    setVideoActive(!videoActive);
    toast.success(videoActive ? 'Camera turned off' : 'Camera turned on');
  };

  const handleToggleScreenShare = () => {
    setScreenShareActive(!screenShareActive);
    toast.success(screenShareActive ? 'Stopped screen sharing' : 'Started screen sharing');
  };

  const handleSendRoomMsg = (e) => {
    e.preventDefault();
    if (!newRoomMsg.trim()) return;

    setRoomMessages((prev) => [...prev, { sender: user.name, text: newRoomMsg }]);
    setNewRoomMsg('');
  };

  // Helper variables for layout rendering
  const isLocalJudge = user?.role === 'judge';
  const isRemoteJudge = peerInfo?.userRole === 'judge';
  const isLocalLawyerOrCitizen = user?.role === 'lawyer' || user?.role === 'citizen';
  const isRemoteLawyerOrCitizen = peerInfo?.userRole === 'lawyer' || peerInfo?.userRole === 'citizen';

  return (
    <div className="h-[82vh] flex flex-col md:flex-row gap-6">
      {/* LEFT PORT: VIDEOS GRID */}
      <div className="flex-1 flex flex-col justify-between bg-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        {/* TOP STATUS BAR */}
        <div className="flex justify-between items-center z-10 relative">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/5">
            <div className={`w-2.5 h-2.5 rounded-full ${isWaiting ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {isWaiting ? 'Waiting for participant...' : 'REC: Session Active'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 text-[10px] font-bold text-slate-350">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit Encrypted Bench</span>
          </div>
        </div>

        {/* VIDEOS GRID */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 items-center justify-center">
          {/* LEFT SLOT: REMOTE PARTICIPANT */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden relative aspect-video flex flex-col items-center justify-center shadow-lg border border-indigo-500/20 h-full">
            {!isWaiting && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto animate-pulse">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-400">Opposite Participant</p>
                <p className="text-[9px] text-amber-500 font-semibold uppercase animate-pulse">Waiting to connect...</p>
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 text-[10px] font-bold text-white rounded-lg backdrop-blur-sm border border-white/5 capitalize">
              {!isWaiting && peerInfo ? `${peerInfo.userName} (${peerInfo.userRole})` : 'Courtroom Bench (Standby)'}
            </div>
            {!isWaiting && remoteStream && (
              <div className="absolute top-3 right-3 p-1.5 bg-emerald-500 rounded-lg text-white">
                <Volume2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* RIGHT SLOT: LOCAL USER (YOU) */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden relative aspect-video flex flex-col items-center justify-center shadow-lg border border-indigo-500/10 h-full">
            {screenShareActive ? (
              <div className="w-full h-full bg-indigo-950 flex flex-col items-center justify-center text-indigo-200 gap-2 p-4 text-center">
                <Monitor className="w-8 h-8 animate-pulse" />
                <h5 className="text-xs font-bold">You are presenting your screen</h5>
                <p className="text-[9px] text-indigo-300">Other participants can see your documents.</p>
              </div>
            ) : (
              localStream && videoActive ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-lg">
                  {user?.name?.charAt(0)}
                </div>
              )
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 text-[10px] font-bold text-white rounded-lg backdrop-blur-sm capitalize">
              {user?.name} (You - {user?.role})
            </div>
            {!micActive && (
              <div className="absolute top-3 right-3 p-1.5 bg-rose-500 rounded-lg text-white">
                <MicOff className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM DEVICE BAR CONTROLS */}
        <div className="flex justify-center items-center gap-4 z-10 relative">
          <button
            onClick={handleToggleMic}
            className={`p-3.5 rounded-2xl shadow-lg transition-all ${
              micActive
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
            }`}
          >
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={handleToggleVideo}
            className={`p-3.5 rounded-2xl shadow-lg transition-all ${
              videoActive
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-rose-500 hover:bg-rose-600 text-white'
            }`}
          >
            {videoActive ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={`p-3.5 rounded-2xl shadow-lg transition-all ${
              screenShareActive
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={() => setChatPanelOpen(!chatPanelOpen)}
            className={`p-3.5 rounded-2xl shadow-lg transition-all ${
              chatPanelOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <Link
            to="/dashboard"
            className="p-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-black hidden sm:inline">Leave Bench</span>
          </Link>
        </div>
      </div>

      {/* RIGHT PORT: COURTROOM TRANSCRIPTS & CHAT */}
      {chatPanelOpen && (
        <div className="w-full md:w-80 glass-panel border rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 flex flex-col justify-between h-full animate-in slide-in-from-right-4 duration-200">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-3 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Bench Chat & Transcripts
            </h4>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pt-4 pr-1">
              {roomMessages.map((msg, idx) => (
                <div key={idx} className="space-y-0.5">
                  <h6 className="text-[9px] font-extrabold text-slate-400">{msg.sender}</h6>
                  <p className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[11px] font-semibold text-slate-700 dark:text-slate-350 rounded-xl leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendRoomMsg} className="flex gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
            <input
              type="text"
              placeholder="Send message to bench..."
              value={newRoomMsg}
              onChange={(e) => setNewRoomMsg(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VideoHearing;
